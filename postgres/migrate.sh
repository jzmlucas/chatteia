#!/bin/sh
# ============================================================================
# Runner de migrations (psql puro — o container já tem postgresql-client).
#
# Aplica, em ordem alfabética, cada arquivo de postgres/migrations/*.sql que
# ainda não consta em `schema_migrations`. Cada migration roda numa transação
# única junto com o registro dela: ou aplica inteira, ou não aplica nada.
#
# Bancos criados antes deste runner (só com a 0001, sem `schema_migrations`)
# funcionam sem ajuste: a 0001 é idempotente (create ... if not exists), então
# reaplicá-la é inofensivo e ela passa a constar na tabela.
#
# Uso:  DATABASE_URL=postgresql://... sh postgres/migrate.sh
#
# Atenção: pensado para UMA instância subindo por vez (o app já é
# single-instance por causa dos barramentos de chat em memória). Se um dia
# rodar réplicas, suba as migrations num job separado antes do deploy.
# ============================================================================
set -eu

: "${DATABASE_URL:?DATABASE_URL precisa estar definido}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$SCRIPT_DIR/migrations}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c \
  "create table if not exists schema_migrations (
       version text primary key,
       applied_at timestamptz not null default now()
   )"

for file in "$MIGRATIONS_DIR"/*.sql; do
  [ -e "$file" ] || continue

  version="$(basename "$file" .sql)"

  case "$version" in
    *[!0-9A-Za-z_-]*)
      echo "Nome de migration inválido: $file" >&2
      exit 1
      ;;
  esac

  applied="$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tAc \
    "select 1 from schema_migrations where version = '$version'")"

  if [ "$applied" = "1" ]; then
    continue
  fi

  echo "Aplicando migration $version..."

  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -1 \
    -f "$file" \
    -c "insert into schema_migrations (version) values ('$version') on conflict do nothing"
done

echo "Migrations em dia."
