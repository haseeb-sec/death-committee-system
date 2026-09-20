import sqlite3

import pytest

from pathlib import Path
import sys

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1] / "scripts"),
)

from backup_db import backup_database


def test_backup_creates_valid_copy(tmp_path):
    database = tmp_path / "committee.db"
    backup_dir = tmp_path / "backups"

    connection = sqlite3.connect(database)

    try:
        connection.execute(
            "CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT)"
        )
        connection.execute(
            "INSERT INTO users (username) VALUES (?)",
            ("test-user",),
        )
        connection.commit()
    finally:
        connection.close()

    backup_path = backup_database(database, backup_dir)

    assert backup_path.exists()
    assert backup_path.parent == backup_dir
    assert backup_path.name.startswith("committee.db.")
    assert backup_path.name.endswith(".bak")

    backup = sqlite3.connect(backup_path)

    try:
        assert (
            backup.execute("PRAGMA integrity_check").fetchone()[0]
            == "ok"
        )

        row = backup.execute(
            "SELECT username FROM users WHERE id = 1"
        ).fetchone()

        assert row == ("test-user",)
    finally:
        backup.close()


def test_backup_refuses_missing_database(tmp_path):
    with pytest.raises(SystemExit, match="Database not found"):
        backup_database(
            tmp_path / "missing.db",
            tmp_path / "backups",
        )
