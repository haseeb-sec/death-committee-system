#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <backup.sql> <target_database>"
  exit 1
fi

BACKUP_FILE="$1"
TARGET_DB="$2"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup not found: $BACKUP_FILE"
  exit 1
fi

if [[ ! "$TARGET_DB" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "Invalid target database name: $TARGET_DB"
  exit 1
fi

if [[ "$TARGET_DB" == "death_committee" && "${ALLOW_LIVE_RESTORE:-}" != "1" ]]; then
  echo "Refusing to restore into the live database."
  echo "Use an isolated target database, or explicitly set ALLOW_LIVE_RESTORE=1."
  exit 1
fi

echo "Checking whether target database already exists..."

if docker compose exec -T postgres \
  psql \
  --username=death_committee \
  --dbname=postgres \
  --tuples-only \
  --no-align \
  --command="SELECT 1 FROM pg_database WHERE datname = '$TARGET_DB'" |
  grep -q '^1$'; then
  echo "Target database already exists: $TARGET_DB"
  echo "Refusing to overwrite an existing database."
  exit 1
fi

echo "Creating isolated target database: $TARGET_DB"

docker compose exec -T postgres \
  createdb \
  --username=death_committee \
  "$TARGET_DB"

cleanup_on_failure() {
  echo "Restore failed. Removing partially restored database: $TARGET_DB"
  docker compose exec -T postgres \
    dropdb \
    --username=death_committee \
    "$TARGET_DB" || true
}

trap cleanup_on_failure ERR

echo "Restoring backup: $BACKUP_FILE"

docker compose exec -T postgres \
  psql \
  --username=death_committee \
  --dbname="$TARGET_DB" \
  --set=ON_ERROR_STOP=1 \
  < "$BACKUP_FILE"

trap - ERR

echo "PostgreSQL restore completed successfully."
echo "Restored database: $TARGET_DB"
