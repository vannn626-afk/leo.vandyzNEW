-- KING VANDYZ V15.1 — TOOL CMS SAVE + DRAWING THEME
-- Safe patch: no DROP, no reset, no table recreation.
-- Existing RLS already restricts tool_configs writes to public.is_admin().

-- Ensure the current tool config table has the expected fields on older installs.
alter table public.tool_configs add column if not exists maintenance boolean not null default false;
alter table public.tool_configs add column if not exists enabled boolean not null default true;

-- Ensure Drawing is available in the persisted global theme config.
update public.site_settings
set theme_config = coalesce(theme_config,'{}'::jsonb) || jsonb_build_object(
  'drawing', jsonb_build_object(
    'bg','#f8f4ea',
    'surface','#fffdf7',
    'surface2','#f2ead8',
    'text','#2b241e',
    'muted','#766b5f',
    'border','#3b3027',
    'primary','#3157d5',
    'secondary','#9b59b6',
    'accent','#ef6b4f',
    'highlight','#f4c95d',
    'shadow','#3b3027'
  )
)
where id=true;

-- Keep timestamps current for direct CMS edits.
create or replace function public.touch_tool_config_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at=now();
  if auth.uid() is not null then new.updated_by=auth.uid(); end if;
  return new;
end;
$$;

drop trigger if exists tool_configs_updated_at on public.tool_configs;
create trigger tool_configs_updated_at
before insert or update on public.tool_configs
for each row execute function public.touch_tool_config_updated_at();
