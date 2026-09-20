#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  DB_CONNECTION_STRING="$DATABASE_URL"
  DB_CHECK_URL="$DATABASE_URL"
elif [ -n "${DB_HOST:-}" ] && [ -n "${DB_NAME:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_PASSWORD:-}" ]; then
  DB_CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}?sslmode=${DB_SSLMODE:-disable}"
  DB_CHECK_URL="$DB_CONNECTION_STRING"
else
  echo "DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD must be set."
  exit 1
fi

export DATABASE_URL="$DB_CONNECTION_STRING"

if ! psql "$DB_CHECK_URL" -tc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'sessions', 'oauth_accounts');" | grep -q 1; then
  echo "Database schema not found. Applying migration..."
  psql "$DB_CHECK_URL" -f /app/postgres/migrations/0001_init.sql
else
  echo "Database schema already exists. Skipping migration."
fi

exec "$@"
