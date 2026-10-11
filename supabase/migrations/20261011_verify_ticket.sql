-- Stage 1b: additive cashier preview; apply before the matching frontend.
begin;
create or replace function public.verify_ticket(p_ticket_code text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_qr public.qr_codes%rowtype;
declare v_store public.store_clients%rowtype;
begin
  if (select auth.uid()) is null then return jsonb_build_object('status', 'unauthorized'); end if;
  select * into v_qr from public.qr_codes where ticket_code = upper(trim(p_ticket_code));
  if not found then return jsonb_build_object('status', 'invalid'); end if;
  if not (public.is_app_admin() or exists (
    select 1 from public.store_staff
    where user_id = (select auth.uid()) and client_id = v_qr.client_id
  )) then return jsonb_build_object('status', 'unauthorized'); end if;
  if v_qr.redeemed_at is not null then
    return jsonb_build_object('status', 'already_redeemed', 'redeemed_at', v_qr.redeemed_at);
  end if;
  select * into v_store from public.store_clients where id = v_qr.client_id;
  return jsonb_build_object('status', 'ready', 'store_name', v_store.name,
    'offer_text', v_store.offer_text, 'coupon_code', v_qr.coupon_code,
    'ticket_code', v_qr.ticket_code);
end;
$$;
revoke all on function public.verify_ticket(text) from public;
grant execute on function public.verify_ticket(text) to authenticated;
commit;
