#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  DB_CONNECTION_STRING="$DATABASE_URL"
elif [ -n "${DB_HOST:-}" ] && [ -n "${DB_NAME:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_PASSWORD:-}" ]; then
  DB_CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}?sslmode=${DB_SSLMODE:-disable}"
else
  echo "DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD must be set."
  exit 1
fi

export DATABASE_URL="$DB_CONNECTION_STRING"

if ! PGPASSWORD="${DB_PASSWORD:-postgres}" psql "postgresql://${DB_USER:-postgres}@${DB_HOST:-db}:${DB_PORT:-5432}/${DB_NAME:-chatteia}?sslmode=${DB_SSLMODE:-disable}" -tc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'sessions', 'oauth_accounts');" | grep -q 1; then
  echo "Database schema not found. Applying migration..."
  PGPASSWORD="${DB_PASSWORD:-postgres}" psql "postgresql://${DB_USER:-postgres}@${DB_HOST:-db}:${DB_PORT:-5432}/${DB_NAME:-chatteia}?sslmode=${DB_SSLMODE:-disable}" -f /app/postgres/migrations/0001_init.sql
else
  echo "Database schema already exists. Skipping migration."
fi

exec "$@"
