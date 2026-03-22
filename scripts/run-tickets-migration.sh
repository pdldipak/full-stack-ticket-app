#!/usr/bin/env bash
# Repository root (contains docker-compose.yml and .env).
set -euo pipefail
cd "$(dirname "$0")/.." || exit 1

if [ -f .env ]; then
  # Strip Windows CR so sourcing and docker compose env values are valid on Linux/WSL.
  _env_clean=$(mktemp) || exit 1
  sed 's/\r$//' .env > "$_env_clean"
  set -a
  # shellcheck source=/dev/null
  . "$_env_clean"
  set +a
  rm -f "$_env_clean"
fi

echo "Applying migrations/001_tickets_legacy_upgrade.sql to database \"${MYSQL_DATABASE:-?}\"..."
sed 's/\r$//' migrations/001_tickets_legacy_upgrade.sql | docker compose exec -T \
  -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
  -e MYSQL_DATABASE="$MYSQL_DATABASE" \
  db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'

echo "Migration finished successfully."
echo "Note: mysql may print \"Using a password on the command line...\" — that is a warning, not an error."
