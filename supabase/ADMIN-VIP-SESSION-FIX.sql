-- KING VANDYZ — ADMIN SESSION + REAL VIP FIX
-- Safe patch: does NOT drop/reset tables and does NOT recreate the whole migration.

-- 1) Restore the known admin account without touching its password or auth identity.
update public.profiles
set role = 'admin',
    disabled = false
where lower(username) = 'kielvan';

-- 2) Canonical server-side VIP/tool access check.
-- VIP is valid only while vip_until is in the future. ADMIN is unlimited forever.
create or replace function public.consume_tool_v2(p_tool_id text, p_cost integer default 10)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  p public.profiles%rowtype;
  c integer := 0;
  f integer := 0;
  r integer := 0;
begin
  if coalesce(p_cost,0) < 0 then raise exception 'INVALID_COST'; end if;

  select * into p
  from public.profiles
  where id=auth.uid()
  for update;

  if p.id is null then raise exception 'SESSION_EXPIRED'; end if;
  if coalesce(p.disabled,false) then raise exception 'ACCOUNT_DISABLED'; end if;

  -- Expired VIP is immediately downgraded server-side.
  if lower(coalesce(p.role,'user'))='vip'
     and (p.vip_until is null or p.vip_until<=now()) then
    update public.profiles set role='user' where id=p.id;
    p.role='user';
  end if;

  -- ADMIN and active VIP both cost 0 credits.
  if lower(coalesce(p.role,'user'))='admin' then
    c:=0;
  elsif p.vip_until is not null and p.vip_until>now() then
    c:=0;
  else
    if p.free_credits=0 and p.free_reset_at is not null and p.free_reset_at<=now() then
      p.free_credits:=100;
      p.free_reset_at:=null;
    end if;

    if p.free_credits >= p_cost then
      f:=p_cost;
      r:=0;
    elsif p.free_credits>0 then
      f:=p.free_credits;
      r:=p_cost-p.free_credits;
    else
      f:=0;
      r:=p_cost;
    end if;

    if p.purchased_credits < r then raise exception 'INSUFFICIENT_CREDITS'; end if;

    p.free_credits:=p.free_credits-f;
    p.purchased_credits:=p.purchased_credits-r;

    if p.free_credits=0 and p.free_reset_at is null then
      p.free_reset_at:=now()+interval '1 hour';
    end if;
    c:=p_cost;
  end if;

  update public.profiles
  set free_credits=p.free_credits,
      purchased_credits=p.purchased_credits,
      free_reset_at=p.free_reset_at,
      tool_uses=coalesce(p.tool_uses,0)+1,
      last_active=now()
  where id=p.id;

  insert into public.tool_usage(user_id,tool_id,credits_cost)
  values(auth.uid(),p_tool_id,c);

  return jsonb_build_object(
    'ok',true,
    'credits_cost',c,
    'free_credits',p.free_credits,
    'purchased_credits',p.purchased_credits,
    'vip_until',p.vip_until,
    'role',p.role
  );
end;
$$;

grant execute on function public.consume_tool_v2(text,integer) to authenticated;

-- 3) Make sync_access_state authoritative for expired VIP sessions.
create or replace function public.sync_access_state()
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  update public.profiles
  set role='user'
  where id=auth.uid()
    and lower(coalesce(role,'user'))='vip'
    and (vip_until is null or vip_until<=now());

  update public.profiles
  set free_credits=100, free_reset_at=null
  where id=auth.uid()
    and free_credits=0
    and free_reset_at is not null
    and free_reset_at<=now();
end;
$$;

grant execute on function public.sync_access_state() to authenticated;

-- 4) Keep order completion admin-only and grant purchased VIP from the server.
create or replace function public.complete_order(p_order_id text)
returns public.orders
language plpgsql
security definer
set search_path=public
as $$
declare
  o public.orders;
  v public.profiles%rowtype;
  admin_user public.profiles%rowtype;
begin
  select * into admin_user from public.profiles where id=auth.uid();
  if admin_user.id is null or lower(coalesce(admin_user.role,'user'))<>'admin' or coalesce(admin_user.disabled,false) then
    raise exception 'FORBIDDEN';
  end if;

  select * into o from public.orders where id=p_order_id for update;
  if o.id is null then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status='COMPLETED' then return o; end if;
  if o.status<>'PENDING' then raise exception 'ORDER_NOT_PENDING'; end if;

  select * into v from public.profiles where id=o.user_id for update;
  if v.id is null then raise exception 'USER_NOT_FOUND'; end if;

  update public.profiles
  set purchased_credits=coalesce(purchased_credits,0)+coalesce(o.credits,0),
      vip_until=case
        when coalesce(o.vip_days,0)>0
        then greatest(coalesce(vip_until,now()),now())+make_interval(days=>o.vip_days)
        else vip_until
      end,
      role=case
        when coalesce(o.vip_days,0)>0 and lower(coalesce(v.role,'user'))<>'admin' then 'vip'
        else v.role
      end
  where id=o.user_id;

  update public.orders
  set status='COMPLETED', completed_at=now()
  where id=o.id
  returning * into o;

  insert into public.admin_activity_logs(admin_id,admin_username,action,target_type,target_id,details)
  values(auth.uid(),admin_user.username,'completed order','order',o.id,
         jsonb_build_object('credits',o.credits,'vip_days',o.vip_days,'customer_user_id',o.user_id));

  return o;
end;
$$;

grant execute on function public.complete_order(text) to authenticated;

-- Verify kielvan after applying this patch.
select id, username, role, disabled, vip_until
from public.profiles
where lower(username)='kielvan';
