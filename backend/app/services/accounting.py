from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Account, JournalEntry, JournalLine


class AccountingError(Exception):
    """Raised when an accounting operation violates a business rule."""


def create_journal_entry(
    db: Session,
    *,
    description: str,
    lines: list[tuple[int, int]],
    entry_date: datetime | None = None,
    reference: str | None = None,
    reverses_entry_id: int | None = None,
) -> JournalEntry:
    """
    Create a balanced journal entry.

    Each line is represented as:
        (account_id, amount)

    The sum of all amounts must equal zero.
    """

    if not description.strip():
        raise AccountingError("Journal entry description cannot be empty.")

    if len(lines) < 2:
        raise AccountingError(
            "A journal entry must contain at least two lines."
        )

    if any(amount == 0 for _, amount in lines):
        raise AccountingError(
            "Journal lines cannot contain zero amounts."
        )

    if sum(amount for _, amount in lines) != 0:
        raise AccountingError(
            "Journal entry is not balanced. Total amount must equal zero."
        )

    account_ids = [account_id for account_id, _ in lines]

    accounts = (
        db.query(Account)
        .filter(Account.id.in_(account_ids))
        .all()
    )

    found_account_ids = {account.id for account in accounts}
    missing_account_ids = set(account_ids) - found_account_ids

    if missing_account_ids:
        raise AccountingError(
            f"Account(s) not found: {sorted(missing_account_ids)}"
        )

    entry = JournalEntry(
        entry_date=entry_date or datetime.utcnow(),
        description=description.strip(),
        reference=reference,
        reverses_entry_id=reverses_entry_id,
    )

    for account_id, amount in lines:
        entry.lines.append(
            JournalLine(
                account_id=account_id,
                amount=amount,
            )
        )

    db.add(entry)

    try:
        db.flush()
    except Exception:
        db.rollback()
        raise

    return entry


def reverse_journal_entry(
    db: Session,
    *,
    journal_entry_id: int,
    reversal_date: datetime | None = None,
    reference: str | None = None,
) -> JournalEntry:
    """
    Reverse an existing journal entry without modifying or deleting it.

    Every original journal line is recreated with the opposite amount.

    Example:

        Original:
            Cash    +2000
            Member  -2000

        Reversal:
            Cash    -2000
            Member  +2000

    The original entry remains permanently in the journal history.
    """

    entry = db.get(JournalEntry, journal_entry_id)

    if entry is None:
        raise AccountingError(
            f"Journal entry not found: {journal_entry_id}"
        )

    # A reversal itself cannot be reversed through this operation.
    if entry.reverses_entry_id is not None:
        raise AccountingError(
            f"Cannot reverse a reversal entry: {journal_entry_id}"
        )

    existing_reversal = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.reverses_entry_id == journal_entry_id
        )
        .first()
    )

    if existing_reversal is not None:
        raise AccountingError(
            f"Journal entry is already reversed: {journal_entry_id}"
        )

    if not entry.lines:
        raise AccountingError(
            f"Journal entry has no journal lines: {journal_entry_id}"
        )

    reversal_lines = [
        (line.account_id, -line.amount)
        for line in entry.lines
    ]

    reversal = create_journal_entry(
        db,
        description=f"Reversal: {entry.description}",
        entry_date=reversal_date or datetime.utcnow(),
        reference=reference or f"REVERSAL-{entry.id}",
        reverses_entry_id=entry.id,
        lines=reversal_lines,
    )

    return reversal
