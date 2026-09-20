from datetime import datetime
from pathlib import Path
import sqlite3


def restore_database(
    backup_path: Path,
    database_path: Path,
) -> Path:
    backup_path = Path(backup_path)
    database_path = Path(database_path)

    if not backup_path.exists():
        raise SystemExit(f"Backup not found: {backup_path}")

    if not database_path.exists():
        raise SystemExit(f"Database not found: {database_path}")

    backup = sqlite3.connect(backup_path)

    try:
        try:
            integrity = backup.execute(
                "PRAGMA integrity_check"
            ).fetchone()[0]
        except sqlite3.DatabaseError as exc:
            raise SystemExit(
                f"Backup integrity check failed: {exc}"
            ) from exc

        if integrity != "ok":
            raise SystemExit(
                f"Backup integrity check failed: {integrity}"
            )
    finally:
        backup.close()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safety_copy = (
        database_path.parent
        / f"{database_path.name}.before_restore.{timestamp}.bak"
    )

    if safety_copy.exists():
        raise SystemExit(f"Safety copy already exists: {safety_copy}")

    current = sqlite3.connect(database_path)
    source = sqlite3.connect(backup_path)
    safety = sqlite3.connect(safety_copy)
    destination = None

    try:
        current.backup(safety)
        safety.close()
        safety = None
        current.close()
        current = None

        destination = sqlite3.connect(database_path)
        source.backup(destination)
        destination.close()
        destination = None

        verification = sqlite3.connect(database_path)

        try:
            result = verification.execute(
                "PRAGMA integrity_check"
            ).fetchone()[0]

            if result != "ok":
                raise SystemExit(
                    f"Restored database integrity check failed: {result}"
                )
        finally:
            verification.close()

    except Exception:
        if destination is not None:
            destination.close()
        if safety is not None:
            safety.close()
        raise
    finally:
        if current is not None:
            current.close()
        source.close()

    print(f"Database restored from: {backup_path}")
    print(f"Safety copy created: {safety_copy}")
    print("Integrity check: ok")

    return safety_copy


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        raise SystemExit(
            "Usage: python backend/scripts/restore_db.py "
            "<backup_path> <database_path>"
        )

    restore_database(
        Path(sys.argv[1]),
        Path(sys.argv[2]),
    )
