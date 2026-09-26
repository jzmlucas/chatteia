alter table giveaways
    add column if not exists participants jsonb not null default '[]'::jsonb,
    add column if not exists duration_seconds integer,
    add column if not exists deadline_at timestamptz;

alter table giveaways
    drop constraint if exists giveaways_duration_seconds_valid;

alter table giveaways
    add constraint giveaways_duration_seconds_valid
    check (duration_seconds is null or duration_seconds between 10 and 86400);
