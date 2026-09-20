from datetime import datetime
from pathlib import Path
import sqlite3


DATABASE_PATH = Path(__file__).resolve().parents[1] / "committee.db"
BACKUP_DIR = Path(__file__).resolve().parents[1] / "backups"


def backup_database(
    database_path: Path = DATABASE_PATH,
    backup_dir: Path = BACKUP_DIR,
) -> Path:
    database_path = Path(database_path)
    backup_dir = Path(backup_dir)

    if not database_path.exists():
        raise SystemExit(f"Database not found: {database_path}")

    backup_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = backup_dir / f"committee.db.{timestamp}.bak"

    if backup_path.exists():
        raise SystemExit(f"Backup already exists: {backup_path}")

    source = sqlite3.connect(database_path)
    destination = sqlite3.connect(backup_path)

    try:
        source.backup(destination)

        result = destination.execute(
            "PRAGMA integrity_check"
        ).fetchone()[0]

        if result != "ok":
            raise SystemExit(
                f"Backup integrity check failed: {result}"
            )
    except Exception:
        backup_path.unlink(missing_ok=True)
        raise
    finally:
        destination.close()
        source.close()

    print(f"Backup created: {backup_path}")
    print("Integrity check: ok")

    return backup_path


if __name__ == "__main__":
    backup_database()
