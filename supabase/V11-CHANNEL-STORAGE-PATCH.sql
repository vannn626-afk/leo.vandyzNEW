-- KING VANDYZ V11 PATCH
-- Run this AFTER your existing Batch 1-3 + theme-banner patch.
-- Safe to run more than once.

-- 1) WhatsApp Channel promotion settings (stored with site_settings).
alter table public.site_settings
  add column if not exists channel_promo_enabled boolean not null default true,
  add column if not exists channel_promo_name text not null default 'KING VANDYZ CHANNEL',
  add column if not exists channel_promo_title text not null default 'Stay Updated with KING VANDYZ',
  add column if not exists channel_promo_description text not null default 'Update tools, fitur baru, maintenance, promo, dan info terbaru langsung dari channel resmi.',
  add column if not exists channel_promo_url text not null default 'https://whatsapp.com/channel/0029VbEFmPM6buMLQgdlie1J',
  add column if not exists channel_promo_button text not null default 'JOIN CHANNEL',
  add column if not exists channel_promo_home boolean not null default true,
  add column if not exists channel_promo_floating boolean not null default true,
  add column if not exists channel_promo_cooldown_hours integer not null default 24;

update public.site_settings
set channel_promo_url='https://whatsapp.com/channel/0029VbEFmPM6buMLQgdlie1J'
where id=true and coalesce(channel_promo_url,'')='';

-- 2) Permanent public Storage bucket for banner/video uploads.
insert into storage.buckets (id,name,public,file_size_limit)
values ('site-assets','site-assets',true,104857600)
on conflict (id) do update set public=true, file_size_limit=greatest(coalesce(storage.buckets.file_size_limit,0),104857600);

-- Public reads are required because Zyvor needs a direct URL.
do $$ begin
  create policy v11_site_assets_public_read on storage.objects
    for select using (bucket_id='site-assets');
exception when duplicate_object then null; end $$;

-- Only database admins can upload/change/delete objects in this bucket.
do $$ begin
  create policy v11_site_assets_admin_insert on storage.objects
    for insert to authenticated
    with check (bucket_id='site-assets' and public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy v11_site_assets_admin_update on storage.objects
    for update to authenticated
    using (bucket_id='site-assets' and public.is_admin())
    with check (bucket_id='site-assets' and public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy v11_site_assets_admin_delete on storage.objects
    for delete to authenticated
    using (bucket_id='site-assets' and public.is_admin());
exception when duplicate_object then null; end $$;

-- Optional cleanup helper: old objects can be deleted manually from Storage.
-- The app intentionally does not auto-delete uploads because the saved banner/video URLs must remain valid.
