# Void Walkers — Setup Guide

This covers three things: running the site, wiring it to Supabase through the
Go/Echo backend, and adding a member so a card actually shows up on the home
page.

## 1. Project structure

```
void-walkers/
├── index.html          Home — black hole hero + members grid (GET /api/Members)
├── hierarchy.html      Community management hierarchy
├── contact.html        Contact form (client-side only)
├── help.html           FAQ accordion
├── database.html       Event tracker table (GET /api/Events)
├── assets/
│   └── audio/ambient-loop.mp3   background track (replace with your own, same filename)
├── css/
│   ├── variables.css   tokens: palette, accent colours, type, spacing, motion
│   ├── global.css      reset, space backdrop, typography, page transitions
│   ├── components.css  navbar, buttons, hero, cards, forms, table, org chart, footer
│   └── settings.css    settings drawer (switches, slider, segmented controls)
├── js/
│   ├── i18n.js         dictionary + translator (EN / हिन्दी / বাংলা)
│   ├── settings.js     saved settings + the single <audio> element + drawer UI
│   ├── starfield.js    seeded star + galactic-band canvas behind every page
│   ├── transitions.js  page-leave animation fallback + link prefetch
│   ├── blackhole.js    interactive hero canvas (index only)
│   ├── icons.js        social SVGs (index only)
│   ├── api.js          fetchMembers() / fetchEvents()
│   ├── roles.js        hierarchy rank/tier config (index only)
│   └── main.js         rendering, spotlight hover, accordion, contact form
└── SETUP.md
```

**Script order matters** (all `defer`): `i18n → settings → starfield → transitions → [icons] → api → [roles → blackhole] → main`.

### Changing things
- **Music:** drop your own licensed file at `assets/audio/ambient-loop.mp3` (or change `AUDIO_SRC` in `js/settings.js`). The bundled loop is a generated placeholder.
- **Accent colours:** edit the three RGB triplets in `css/variables.css` (and the matching `.swatch--*` in `css/settings.css`).
- **Languages:** add an object to `DICT` in `js/i18n.js` and one `<label>` in `buildDialog()` in `js/settings.js`. Elements opt in with `data-i18n="key"`; FAQ answers and org-chart tile text are still English-only until you add keys for them.
- **Fonts:** Doto (dot-matrix headings) + Space Grotesk (body) load from Google Fonts in each page `<head>`; self-host them if you need to avoid third-party requests.

## 2. Run it locally

Any static file server works, since everything is plain HTML/CSS/JS:

```bash
cd void-walkers
python3 -m http.server 8080
# or: npx serve .
```

Open `http://localhost:8080`. The members grid and the events table will
show their error state until `/api/Members` and `/api/Events` are reachable
— that's expected without a running backend, and confirms the error-banner
path works.

To develop against a live backend, run `vercel dev` from the project root
once `vercel.json` and the Go functions are in place, so `/api/*` rewrites
resolve to your local Go handlers instead of 404ing.

## 3. Supabase: table schema

Create a `mem_list` table for members. This matches the struct from the
brief, plus a `role` column — **new, required for the hierarchy ordering
and the role pill on each card** to work; it isn't in the original struct.

```sql
create table mem_list (
  id bigint generated always as identity primary key,
  u_name text not null,
  role text,                    -- e.g. 'Founder / Executive', 'Team Lead'
  category text[] default '{}', -- e.g. {"Cybersecurity & Ethical Hacking","CTF"}
  description text,
  socials jsonb default '{}',   -- e.g. {"twitter": "https://...", "github": "https://..."}
  created_at timestamptz default now()
);
```

Valid `role` values are the ones defined in `js/roles.js` — anything else
still renders, just sorts to the bottom as a plain "Team Member". Keep the
two lists in sync if the org structure changes.

For the events table backing `database.html`:

```sql
create table ctf_events (
  id bigint generated always as identity primary key,
  name text not null,
  format text,                  -- 'Jeopardy' | 'Attack-Defense'
  start_date date,
  status text,                  -- 'upcoming' | 'live' | 'concluded'
  rank int,
  points int,
  url text
);
```

`js/main.js` reads `startDate`/`start_date` and both `name`/`title`, so
either naming convention from the API works without a frontend change.

## 4. Supabase: credentials

In your Supabase project: **Settings → API**. You'll need:

- `Project URL` (e.g. `https://xxxx.supabase.co`)
- `service_role` key (server-side only — never ship this to the browser)

In Vercel: **Project Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `SUPABASE_URL` | your project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |

Redeploy after adding env vars — Vercel only injects them into new builds.

## 5. Go handler sketch

Reference shape for the `/api/Members` function, using the Supabase REST
endpoint directly (works with any Go HTTP client, no SDK required):

```go
package handler

import (
    "encoding/json"
    "net/http"
    "os"
)

func Members(w http.ResponseWriter, r *http.Request) {
    url := os.Getenv("SUPABASE_URL") + "/rest/v1/mem_list?select=*"
    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("apikey", os.Getenv("SUPABASE_SERVICE_ROLE_KEY"))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("SUPABASE_SERVICE_ROLE_KEY"))

    resp, err := http.DefaultClient.Do(req)
    if err != nil || resp.StatusCode >= 500 {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{
            "error": "Supabase client could not be reached.",
        })
        return
    }
    defer resp.Body.Close()

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(resp.StatusCode)
    // Supabase returns snake_case columns (u_name, created_at); map them to
    // the camelCase shape the frontend expects (uName) before writing out,
    // or add column aliases in the select query above.
    _, _ = w.Write(mustReadAll(resp.Body))
}
```

Mirror this for `/api/Events` against the `ctf_events` table. The frontend's
`js/api.js` already treats any non-2xx response, especially 500, as a
server error and renders the styled error banner — so returning a non-2xx
status with a JSON `{"error": "..."}` body is enough on the backend side.

## 6. Add a member (make a card appear)

Once the handler above is live, a member card appears the moment a row
exists in `mem_list`. Easiest path: Supabase dashboard → **Table Editor** →
`mem_list` → **Insert row**:

- `u_name`: `Saber`
- `role`: `Founder / Executive`
- `category`: `{"Leadership","Strategy"}`
- `description`: a short bio
- `socials`: `{"twitter": "https://x.com/...", "github": "https://github.com/..."}`

Repeat for `Godspeed` with the same `role`. Because the members grid sorts
by hierarchy rank (`js/roles.js`), anyone with `role = "Founder / Executive"`
sorts to the very top automatically — no special-casing of names in the
code, so it stays correct as the roster changes.

Refresh `index.html` (or redeploy) and the new card appears, animated in
with the rest of the grid.
