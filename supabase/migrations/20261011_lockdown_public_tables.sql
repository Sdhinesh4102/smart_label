-- Stage 2: run after the matching frontend has been deployed and verified.
-- Until this transaction commits, old public table policies still expose
-- stores, QR winners and claim status to anyone with the public API key.
begin;
drop policy if exists "Allow public read/write on store_clients" on public.store_clients;
drop policy if exists "Allow public read/write on print_runs" on public.print_runs;
drop policy if exists "Allow public read/write on qr_codes" on public.qr_codes;
alter table public.store_clients enable row level security;
alter table public.print_runs enable row level security;
alter table public.qr_codes enable row level security;
alter table public.invoices enable row level security;
commit;
