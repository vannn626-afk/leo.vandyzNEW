# KING VANDYZ V6 — Static Banner + Global Theme CMS

The existing KING VANDYZ V6 app/API architecture is preserved. This revision changes the visual layer, removes the old animated banner, and adds admin-controlled banner/theme customization.

## Existing database
The production database can remain the Batch 1–6 database already installed in Supabase. **Do not rerun the old master migration over it.**

Run this one additional SQL patch once:

`supabase/theme-banner-patch.sql`

It adds banner image settings and a JSONB theme palette to `public.site_settings`, without replacing existing users, orders, tools, credits, VIP state, or RPCs.

## Banner
- Old `banner.mp4` and `banner.svg` are removed from the public build.
- The supplied static image is now `public/banner.jpg` in 16:9.
- Admin → Banner can change the image URL, upload an image, crop position, overlay opacity, and alt text.
- The app never auto-plays a banner video.

## Themes
Default theme: **Neo Brutalism**.

The four themes change the complete interface, including navigation, cards, buttons, forms, admin CMS, page surfaces, typography accents, borders, shadows, and banner treatment:
- Glassmorphism
- Neo Brutalism
- Modern City
- Comic Style

Admin → Themes can change the palette for each theme. The selected default theme and palettes are persisted in `site_settings.theme_config`.

## API / security
Existing routes and execution remain: `/api/proxy`, `/api/catalog`, `/api/upload-video`, `/api/upload-image`, `src/services/api.js`, `src/data/catalog.js`, response rendering, Supabase Auth, RLS, credits/VIP RPCs, orders, and Admin CMS. No service-role key is shipped to the browser.

## Vercel
Set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- existing API environment variables required by `/api/proxy`

Build with `npm run build`.


## V13 UI PATCH
- Removes Random category and its tools, plus Top Up category/tools from UI catalog.
- Category navigation opens the selected category.
- Adds game-style launcher UI for game categories.
- Keeps six themes and strengthens Paper theme surface cleanup.

## ADMIN + REAL VIP SESSION FIX
- Admin `kielvan` is restored/kept as ADMIN by the supplied safe SQL patch.
- Auth sessions now use per-tab `sessionStorage` instead of a shared `localStorage` session, preventing a customer login in another tab from replacing the admin session.
- Tool consumption now uses the canonical `consume_tool_v2` RPC only, so VIP access is enforced server-side from `vip_until` and ADMIN remains unlimited.
- `complete_order()` remains admin-only and grants purchased credits/VIP server-side.
- Apply `supabase/ADMIN-VIP-SESSION-FIX.sql` once in Supabase SQL Editor. Do NOT rerun `supabase/migration.sql`.


## V15.1 CMS + Drawing
- Admin Tools supports draft Hide/Visible + Maintenance + cost, with **SAVE ALL CHANGES** persisted in `tool_configs`.
- Sync preserves existing per-tool settings and adds the full current catalog.
- Added global **Drawing Studio** theme with reload-safe theme bootstrap and full-app styling.
- Optional Supabase patch: `supabase/V15.1-TOOL-CMS-DRAWING-PATCH.sql`.


## V15.3 FIXES
- Auth session persisted in localStorage and migrates V15.1 tab sessions.
- Admin Tools independently loads the live catalog and keeps hidden DB tool configs visible to Admin.
- HIDE/SHOW and per-tool Maintenance are saved to `public.tool_configs`.
- Drawing theme remains available from client defaults even when theme_config is empty.
