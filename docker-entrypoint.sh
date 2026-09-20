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

# Aplica migrations pendentes (0001, 0002, ...). Antes só a 0001 rodava, e só
# se o banco estivesse vazio — migrations novas nunca chegariam a bancos
# existentes.
sh /app/postgres/migrate.sh

exec "$@"
