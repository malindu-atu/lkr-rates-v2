-- Run this once in Supabase Dashboard → SQL Editor

create table if not exists exchange_rates (
  id          bigserial primary key,
  bank_code   text        not null,
  bank_name   text        not null,
  currency    text        not null,
  buying      numeric     not null,
  selling     numeric     not null,
  date        date        not null,
  scraped_at  timestamptz not null default now()
);

-- One row per bank per currency per day — scraper upserts safely
alter table exchange_rates
  add constraint exchange_rates_bank_currency_date_key
  unique (bank_code, currency, date);

-- Fast lookups by currency and date
create index if not exists idx_rates_currency_date
  on exchange_rates (currency, date desc);

create index if not exists idx_rates_bank_currency
  on exchange_rates (bank_code, currency);

-- Row-level security: public read, service-role write
alter table exchange_rates enable row level security;

create policy "Public read"
  on exchange_rates for select
  using (true);
