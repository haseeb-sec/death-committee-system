import sqlite3
from pathlib import Path
import sys

import pytest

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1] / "scripts"),
)

from restore_db import restore_database


def create_database(path, username):
    connection = sqlite3.connect(path)

    try:
        connection.execute(
            "CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT)"
        )
        connection.execute(
            "INSERT INTO users (username) VALUES (?)",
            (username,),
        )
        connection.commit()
    finally:
        connection.close()


def read_username(path):
    connection = sqlite3.connect(path)

    try:
        return connection.execute(
            "SELECT username FROM users WHERE id = 1"
        ).fetchone()[0]
    finally:
        connection.close()


def test_restore_creates_safety_copy_and_restores_database(tmp_path):
    original = tmp_path / "committee.db"
    backup = tmp_path / "committee.db.backup.bak"

    create_database(original, "backup-user")

    backup_connection = sqlite3.connect(backup)
    try:
        original_connection = sqlite3.connect(original)
        try:
            original_connection.backup(backup_connection)
        finally:
            original_connection.close()
    finally:
        backup_connection.close()

    original.unlink()
    create_database(original, "wrong-user")

    safety_copy = restore_database(backup, original)

    assert safety_copy.exists()
    assert read_username(safety_copy) == "wrong-user"
    assert read_username(original) == "backup-user"

    restored = sqlite3.connect(original)
    try:
        assert (
            restored.execute("PRAGMA integrity_check").fetchone()[0]
            == "ok"
        )
    finally:
        restored.close()


def test_restore_refuses_missing_backup(tmp_path):
    database = tmp_path / "committee.db"
    create_database(database, "current-user")

    with pytest.raises(SystemExit, match="Backup not found"):
        restore_database(
            tmp_path / "missing.bak",
            database,
        )


def test_restore_refuses_corrupt_backup(tmp_path):
    database = tmp_path / "committee.db"
    backup = tmp_path / "corrupt.bak"

    create_database(database, "current-user")
    backup.write_bytes(b"not a sqlite database")

    with pytest.raises(SystemExit, match="Backup integrity check failed"):
        restore_database(backup, database)

    assert read_username(database) == "current-user"
