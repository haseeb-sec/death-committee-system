#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backups" && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/death_committee_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres \
  pg_dump \
  --username=death_committee \
  --dbname=death_committee \
  --format=plain \
  > "$BACKUP_FILE"

echo "PostgreSQL backup created: $BACKUP_FILE"
ls -lh "$BACKUP_FILE"
