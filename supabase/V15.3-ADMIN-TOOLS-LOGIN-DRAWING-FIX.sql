-- KING VANDYZ V15.3 — ADMIN TOOLS / PERSISTENT LOGIN / DRAWING SAFETY PATCH
-- Safe: no table drops, no user deletion, no auth password changes.

alter table public.tool_configs add column if not exists maintenance boolean not null default false;
alter table public.tool_configs add column if not exists enabled boolean not null default true;

-- Keep Drawing available even if the existing theme_config JSON is empty.
update public.site_settings
set theme_config = coalesce(theme_config,'{}'::jsonb) || jsonb_build_object(
  'drawing', jsonb_build_object(
    'bg','#f8f4ea','surface','#fffdf7','surface2','#f2ead8','text','#2b241e',
    'muted','#766b5f','border','#3b3027','primary','#3157d5','secondary','#9b59b6',
    'accent','#ef6b4f','highlight','#f4c95d','shadow','#3b3027'
  )
)
where id=true;
