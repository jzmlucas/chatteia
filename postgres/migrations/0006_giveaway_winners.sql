alter table giveaways
    add column if not exists winner_count integer not null default 1,
    add column if not exists winners jsonb not null default '[]'::jsonb;

alter table giveaways
    drop constraint if exists giveaways_winner_count_valid;

alter table giveaways
    add constraint giveaways_winner_count_valid
    check (winner_count between 1 and 50);
