-- Stage 1: install secure functions and admin policies before deploying the
-- matching frontend. Existing public policies remain until stage 2.
begin;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
insert into public.app_admins (user_id)
values ('bc7489be-b9d1-40bc-bbb9-e6aa68d9d083')
on conflict do nothing;

create table if not exists public.store_staff (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.store_clients(id) on delete cascade,
  primary key (user_id, client_id)
);

alter table public.qr_codes add column if not exists claim_token_hash text;
alter table public.qr_codes add column if not exists ticket_code text;
alter table public.qr_codes add column if not exists redeemed_at timestamptz;
alter table public.qr_codes add column if not exists redeemed_by uuid references auth.users(id);
create unique index if not exists qr_codes_ticket_code_key on public.qr_codes(ticket_code);
create index if not exists qr_codes_client_id_idx on public.qr_codes(client_id);

create or replace function public.is_app_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.app_admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

alter table public.app_admins enable row level security;
alter table public.store_staff enable row level security;
revoke all on public.app_admins, public.store_staff from anon, authenticated;

alter table public.store_clients enable row level security;
alter table public.print_runs enable row level security;
alter table public.qr_codes enable row level security;
alter table public.invoices enable row level security;

create policy "Admins manage stores" on public.store_clients
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy "Admins manage print runs" on public.print_runs
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy "Admins manage QR codes" on public.qr_codes
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy "Admins manage invoices" on public.invoices
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

create or replace function public.create_print_run(p_client_id uuid, p_codes jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_run_id uuid;
declare v_quantity integer;
declare v_winners integer;
begin
  if not public.is_app_admin() then raise exception 'not authorized'; end if;
  if not exists (select 1 from public.store_clients where id = p_client_id) then
    raise exception 'store not found';
  end if;
  if p_codes is null or jsonb_typeof(p_codes) <> 'array' then
    raise exception 'invalid QR batch';
  end if;
  v_quantity := jsonb_array_length(p_codes);
  if v_quantity < 1 or v_quantity > 1000 then raise exception 'invalid QR quantity'; end if;
  if exists (select 1 from jsonb_array_elements(p_codes) as c
    where c->>'id' is null or c->>'sticker_number' is null
      or c->>'is_winner' not in ('true', 'false')) then
    raise exception 'incomplete QR batch';
  end if;
  if (select count(distinct c->>'id') from jsonb_array_elements(p_codes) as c) <> v_quantity then
    raise exception 'duplicate QR ID';
  end if;
  select count(*) into v_winners from jsonb_array_elements(p_codes) as c
    where (c->>'is_winner')::boolean;
  insert into public.print_runs(client_id, quantity, winners_count)
    values (p_client_id, v_quantity, v_winners) returning id into v_run_id;
  insert into public.qr_codes(id, client_id, print_run_id, is_winner,
      is_claimed, coupon_code, sticker_number)
    select (c->>'id')::uuid, p_client_id, v_run_id, (c->>'is_winner')::boolean,
      false, nullif(c->>'coupon_code', ''), (c->>'sticker_number')::integer
    from jsonb_array_elements(p_codes) as c;
  return v_run_id;
end;
$$;

create or replace function public.public_store(p_store_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_store public.store_clients%rowtype;
begin
  select * into v_store from public.store_clients where id = p_store_id;
  if not found then return null; end if;
  return jsonb_build_object(
    'id', v_store.id, 'name', v_store.name, 'location_url', v_store.location_url,
    'instagram', v_store.instagram, 'whatsapp', v_store.whatsapp,
    'facebook', v_store.facebook, 'website', v_store.website,
    'qr_type', v_store.qr_type, 'logo_data', v_store.logo_data,
    'offer_text', v_store.offer_text
  );
end;
$$;

create or replace function public.inspect_qr(p_store_id uuid, p_qr_id uuid, p_device_token text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_qr public.qr_codes%rowtype;
begin
  select * into v_qr from public.qr_codes where id = p_qr_id and client_id = p_store_id;
  if not found then return jsonb_build_object('status', 'unverified'); end if;
  if v_qr.redeemed_at is not null then return jsonb_build_object('status', 'redeemed'); end if;
  if v_qr.is_claimed and v_qr.claim_token_hash is null then
    return jsonb_build_object('status', 'already_scanned');
  end if;
  if v_qr.scanned_at is null then return jsonb_build_object('status', 'available'); end if;
  if p_device_token is not null and length(p_device_token) between 32 and 128
     and v_qr.claim_token_hash = md5(p_device_token) then
    return jsonb_build_object('status', 'revealed', 'is_winner', v_qr.is_winner,
      'coupon_code', case when v_qr.is_winner then v_qr.coupon_code else null end,
      'ticket_code', case when v_qr.is_winner then v_qr.ticket_code else null end);
  end if;
  return jsonb_build_object('status', 'already_scanned');
end;
$$;

create or replace function public.reveal_qr(
  p_store_id uuid, p_qr_id uuid, p_device_token text, p_name text, p_phone text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_qr public.qr_codes%rowtype;
declare v_ticket text;
begin
  if p_device_token is null or length(p_device_token) < 32 or length(p_device_token) > 128
     or p_name is null or length(trim(p_name)) < 2 or length(p_name) > 100
     or p_phone is null or p_phone !~ '^[0-9]{7,15}$' then
    return jsonb_build_object('status', 'invalid_input');
  end if;
  select * into v_qr from public.qr_codes
    where id = p_qr_id and client_id = p_store_id for update;
  if not found then return jsonb_build_object('status', 'unverified'); end if;
  if v_qr.redeemed_at is not null then return jsonb_build_object('status', 'redeemed'); end if;
  if v_qr.is_claimed and v_qr.claim_token_hash is null then
    return jsonb_build_object('status', 'already_scanned');
  end if;
  if v_qr.scanned_at is not null then
    if v_qr.claim_token_hash = md5(p_device_token) then
      return jsonb_build_object('status', 'revealed', 'is_winner', v_qr.is_winner,
        'coupon_code', case when v_qr.is_winner then v_qr.coupon_code else null end,
        'ticket_code', case when v_qr.is_winner then v_qr.ticket_code else null end);
    end if;
    return jsonb_build_object('status', 'already_scanned');
  end if;
  if v_qr.is_winner then
    v_ticket := 'SL-' || upper(substr(md5(gen_random_uuid()::text), 1, 16));
  end if;
  update public.qr_codes set scanned_at = now(), claim_token_hash = md5(p_device_token),
    claimer_name = trim(p_name), claimer_phone = trim(p_phone), ticket_code = v_ticket
    where id = p_qr_id;
  return jsonb_build_object('status', 'revealed', 'is_winner', v_qr.is_winner,
    'coupon_code', case when v_qr.is_winner then v_qr.coupon_code else null end,
    'ticket_code', v_ticket);
end;
$$;

create or replace function public.redeem_ticket(p_ticket_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_qr public.qr_codes%rowtype;
begin
  if (select auth.uid()) is null then return jsonb_build_object('status', 'unauthorized'); end if;
  select * into v_qr from public.qr_codes where ticket_code = upper(trim(p_ticket_code)) for update;
  if not found then return jsonb_build_object('status', 'invalid'); end if;
  if not (public.is_app_admin() or exists (
    select 1 from public.store_staff
    where user_id = (select auth.uid()) and client_id = v_qr.client_id
  )) then return jsonb_build_object('status', 'unauthorized'); end if;
  if v_qr.redeemed_at is not null then
    return jsonb_build_object('status', 'already_redeemed', 'redeemed_at', v_qr.redeemed_at);
  end if;
  update public.qr_codes set redeemed_at = now(), redeemed_by = (select auth.uid()),
    is_claimed = true where id = v_qr.id;
  return jsonb_build_object('status', 'redeemed', 'client_id', v_qr.client_id,
    'ticket_code', v_qr.ticket_code);
end;
$$;

revoke all on function public.public_store(uuid) from public;
revoke all on function public.create_print_run(uuid, jsonb) from public;
revoke all on function public.inspect_qr(uuid, uuid, text) from public;
revoke all on function public.reveal_qr(uuid, uuid, text, text, text) from public;
revoke all on function public.redeem_ticket(text) from public;
grant execute on function public.public_store(uuid) to anon, authenticated;
grant execute on function public.create_print_run(uuid, jsonb) to authenticated;
grant execute on function public.inspect_qr(uuid, uuid, text) to anon, authenticated;
grant execute on function public.reveal_qr(uuid, uuid, text, text, text) to anon, authenticated;
grant execute on function public.redeem_ticket(text) to authenticated;

commit;
