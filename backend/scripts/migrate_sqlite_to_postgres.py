from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import MetaData, create_engine, inspect, text


BASE_DIR = Path(__file__).resolve().parents[1]
SQLITE_URL = f"sqlite:///{BASE_DIR / 'committee.db'}"
POSTGRES_URL = os.environ.get("DATABASE_URL")

if not POSTGRES_URL:
    raise SystemExit("DATABASE_URL is not set.")

if not POSTGRES_URL.startswith("postgresql"):
    raise SystemExit("DATABASE_URL must point to PostgreSQL.")

sqlite_engine = create_engine(SQLITE_URL)
postgres_engine = create_engine(POSTGRES_URL)

sqlite_metadata = MetaData()
postgres_metadata = MetaData()

sqlite_metadata.reflect(bind=sqlite_engine)
postgres_metadata.reflect(bind=postgres_engine)

sqlite_tables = set(sqlite_metadata.tables)
postgres_tables = set(postgres_metadata.tables)

if sqlite_tables != postgres_tables:
    missing = sorted(sqlite_tables - postgres_tables)
    extra = sorted(postgres_tables - sqlite_tables)
    raise SystemExit(
        f"Schema mismatch.\nMissing in PostgreSQL: {missing}\n"
        f"Extra in PostgreSQL: {extra}"
    )

# The migration target must still be empty except for Alembic's version row.
with postgres_engine.connect() as conn:
    non_empty = []

    for table_name in sorted(postgres_tables):
        if table_name == "alembic_version":
            continue

        count = conn.execute(
            text(f'SELECT COUNT(*) FROM "{table_name}"')
        ).scalar_one()

        if count:
            non_empty.append((table_name, count))

    if non_empty:
        raise SystemExit(
            "PostgreSQL is not empty. Migration aborted:\n"
            + "\n".join(f"  {name}: {count}" for name, count in non_empty)
        )

# SQLAlchemy's sorted_tables respects foreign-key dependencies.
tables = [
    table
    for table in postgres_metadata.sorted_tables
    if table.name != "alembic_version"
]

print("=== SQLite → PostgreSQL migration ===")
print(f"Tables to migrate: {len(tables)}")
print()

with sqlite_engine.connect() as sqlite_conn, postgres_engine.begin() as postgres_conn:
    for table in tables:
        sqlite_table = sqlite_metadata.tables[table.name]

        rows = sqlite_conn.execute(sqlite_table.select()).mappings().all()

        if not rows:
            print(f"{table.name:<30} 0 rows")
            continue

        postgres_conn.execute(table.insert(), [dict(row) for row in rows])

        print(f"{table.name:<30} {len(rows)} rows")

    # Reset PostgreSQL sequences for integer primary keys so future inserts
    # continue after the imported IDs.
    print()
    print("=== Repairing PostgreSQL sequences ===")

    inspector = inspect(postgres_engine)

    for table in tables:
        pk_columns = inspector.get_pk_constraint(table.name)["constrained_columns"]

        if len(pk_columns) != 1:
            continue

        pk_column = pk_columns[0]

        sequence = postgres_conn.execute(
            text("SELECT pg_get_serial_sequence(:table_name, :column_name)"),
            {
                "table_name": table.name,
                "column_name": pk_column,
            },
        ).scalar()

        if not sequence:
            continue

        max_id = postgres_conn.execute(
            text(
                f'SELECT MAX("{pk_column}") '
                f'FROM "{table.name}"'
            )
        ).scalar()

        if max_id is None:
            postgres_conn.execute(
                text("SELECT setval(:sequence_name, 1, false)"),
                {"sequence_name": sequence},
            )
        else:
            postgres_conn.execute(
                text("SELECT setval(:sequence_name, :value, true)"),
                {
                    "sequence_name": sequence,
                    "value": max_id,
                },
            )

        print(f"{table.name}.{pk_column} -> {sequence}")

print()
print("=== Verifying row counts ===")

mismatches = []

with sqlite_engine.connect() as sqlite_conn, postgres_engine.connect() as postgres_conn:
    for table in tables:
        sqlite_count = sqlite_conn.execute(
            text(f'SELECT COUNT(*) FROM "{table.name}"')
        ).scalar_one()

        postgres_count = postgres_conn.execute(
            text(f'SELECT COUNT(*) FROM "{table.name}"')
        ).scalar_one()

        status = "OK" if sqlite_count == postgres_count else "MISMATCH"

        print(
            f"{table.name:<30}"
            f" SQLite={sqlite_count:<6}"
            f" PostgreSQL={postgres_count:<6}"
            f" [{status}]"
        )

        if sqlite_count != postgres_count:
            mismatches.append(
                (table.name, sqlite_count, postgres_count)
            )

if mismatches:
    raise SystemExit(
        "Migration verification failed:\n"
        + "\n".join(
            f"  {name}: SQLite={sqlite_count}, PostgreSQL={postgres_count}"
            for name, sqlite_count, postgres_count in mismatches
        )
    )

print()
print("Migration completed successfully.")
print("SQLite was not modified.")
