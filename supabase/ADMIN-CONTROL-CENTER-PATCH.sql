-- KING VANDYZ — ADMIN CONTROL CENTER PATCH
-- Run ONCE in Supabase SQL Editor after the V9/V10 frontend.
-- This patch does not recreate or delete existing tables.

-- 1) Reject pending orders through a real admin-only RPC.
create or replace function public.reject_order(p_order_id text)
returns public.orders
language plpgsql security definer set search_path=public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into o from public.orders where id=p_order_id for update;
  if o.id is null then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status='REJECTED' then return o; end if;
  if o.status<>'PENDING' then raise exception 'ORDER_NOT_PENDING'; end if;
  update public.orders set status='REJECTED' where id=o.id returning * into o;
  insert into public.admin_activity_logs(admin_id,admin_username,action,target_type,target_id,details)
  select auth.uid(),username,'rejected order','order',o.id,jsonb_build_object('product',o.product,'price',o.price)
  from public.profiles where id=auth.uid();
  return o;
end; $$;

-- 2) Disable/enable accounts through an admin-only RPC.
create or replace function public.set_user_disabled(p_user_id uuid,p_disabled boolean)
returns public.profiles
language plpgsql security definer set search_path=public as $$
declare p public.profiles;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_user_id=auth.uid() and p_disabled then raise exception 'CANNOT_DISABLE_SELF'; end if;
  update public.profiles set disabled=coalesce(p_disabled,false) where id=p_user_id returning * into p;
  if p.id is null then raise exception 'USER_NOT_FOUND'; end if;
  insert into public.admin_activity_logs(admin_id,admin_username,action,target_type,target_id,details)
  select auth.uid(),username,case when p_disabled then 'disabled user' else 'enabled user' end,'user',p.id::text,jsonb_build_object('username',p.username)
  from public.profiles where id=auth.uid();
  return p;
end; $$;

-- 3) Role management for the Users screen.
create or replace function public.set_user_role(p_user_id uuid,p_role text)
returns public.profiles
language plpgsql security definer set search_path=public as $$
declare p public.profiles; r text:=upper(trim(p_role));
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if r not in ('USER','VIP','ADMIN') then raise exception 'INVALID_ROLE'; end if;
  if p_user_id=auth.uid() and r<>'ADMIN' then raise exception 'CANNOT_DEMOTE_SELF'; end if;
  update public.profiles
  set role=case when r='ADMIN' then 'admin' when r='VIP' then 'vip' else 'user' end,
      vip_until=case when r='VIP' and (vip_until is null or vip_until<=now()) then now()+interval '30 days' when r<>'VIP' then null else vip_until end
  where id=p_user_id returning * into p;
  if p.id is null then raise exception 'USER_NOT_FOUND'; end if;
  insert into public.admin_activity_logs(admin_id,admin_username,action,target_type,target_id,details)
  select auth.uid(),username,'changed user role','user',p.id::text,jsonb_build_object('username',p.username,'role',p.role)
  from public.profiles where id=auth.uid();
  return p;
end; $$;

-- 4) Make checkout use the LIVE pricing table instead of trusting a browser-supplied price/credits.
create or replace function public.create_order(p_product text,p_price integer,p_credits integer default 0,p_vip_days integer default 0)
returns public.orders
language plpgsql security definer set search_path=public as $$
declare u public.profiles%rowtype; o public.orders; pr public.pricing%rowtype; final_price integer; final_credits integer; final_vip integer;
begin
  select * into u from public.profiles where id=auth.uid();
  if u.id is null then raise exception 'SESSION_EXPIRED'; end if;
  if u.disabled then raise exception 'ACCOUNT_DISABLED'; end if;

  select * into pr from public.pricing
  where (id=p_product or title=p_product) and active=true
  order by sort_order asc limit 1;
  if pr.id is null then raise exception 'PRODUCT_NOT_AVAILABLE'; end if;

  final_price:=case when pr.promo_active then pr.promo_price else pr.normal_price end;
  final_credits:=coalesce(pr.credits,0);
  final_vip:=coalesce(pr.vip_days,0);

  insert into public.orders(user_id,username,product,price,credits,vip_days)
  values(auth.uid(),u.username,pr.title,final_price,final_credits,final_vip)
  returning * into o;
  return o;
end; $$;

-- 5) Give the new RPCs the same authenticated access style as the existing admin RPCs.
grant execute on function public.reject_order(text) to authenticated;
grant execute on function public.set_user_disabled(uuid,boolean) to authenticated;
grant execute on function public.set_user_role(uuid,text) to authenticated;
grant execute on function public.create_order(text,integer,integer,integer) to authenticated;

-- Quick verification (safe to run):
select proname from pg_proc where proname in ('reject_order','set_user_disabled','set_user_role','create_order') order by proname;
