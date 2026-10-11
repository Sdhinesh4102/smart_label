# Smart Label rollout status — 2026-10-11

## Applied to live Supabase project `rdsokcdhecftrxebtrfs`

- `20261011_secure_qr_flow.sql` applied successfully. Secure QR functions,
  cashier redemption, admin policies, invoice duplicate guard, and invoice RLS
  are present. The live SQL Editor confirmed inspect, reveal, and redeem
  functions and invoice RLS are active.
- `20261011_verify_ticket.sql` applied successfully.
- Supabase Auth **Allow new users to sign up** was turned off and the dashboard
  confirmed the setting was saved.
- The old public policies on `store_clients`, `print_runs`, and `qr_codes`
  deliberately remain until the matching frontend is deployed. Raw QR and
  customer claim data are still exposed by those policies.

## Code status

- Draft [PR #1](https://github.com/synkraze-software-solutions/smart_label/pull/1)
  contains the matching frontend and all SQL. The branch is pushed to
  `Sdhinesh4102:fix/qr-integrity`.
- Local Vite build and 14 business-rule tests pass. A temporary PostgreSQL 16
  instance validated migration syntax, public table isolation, random winner
  registration, same-browser ticket return, other-browser rejection, loser
  repeat rejection, one-time cashier redemption, invoice duplicate refusal,
  and idempotent print request accounting.
- Local browser against the live Supabase project verified owner login, QR
  Results, fake QR handling, valid unscanned QR registration screen without
  submitting a claim, and fake cashier ticket rejection.

## Required deployment sequence

1. Vercel must authorize preview deployment for the fork contributor or provide
   an equivalent authorized preview route. PR checks currently report
   `Authorization required to deploy` for four Vercel projects.
2. Verify the preview with a **controlled test QR batch** that is never printed
   or distributed. Check winner and loser flows, same-browser reload, other
   browser rejection, cashier verify and redeem, and admin dashboard.
3. Promote/merge the frontend to production after the preview passes. The
   production project for the user URL is `smart-label-k61e` on `master`.
4. Immediately apply `20261011_lockdown_public_tables.sql` and verify that
   `anon` cannot read or modify raw stores, print runs, QR rows, or invoices.
5. Add shop cashier users through Supabase Auth invitation and map their user
   IDs to store IDs in `public.store_staff`. Do not share the owner login.

## Known constraints

- 25 saved QR rows are all winners; 3 were scanned before this update. The
  existing 14 print runs include losing sticker IDs that were not stored.
  Original QR export files are unavailable, so those older losing stickers
  cannot be authenticated or made one-time retroactively. The new scanner
  directs their holders to show the physical label at the shop.
- Existing invoice number `INV-0001` appears twice. The guard preserves those
  records and blocks future duplicates.
- The Supabase overview reported no scheduled backups. Arrange backup or
  export before a larger production rollout.
