# Void Walkers — site guide

A static website: plain HTML, CSS and JavaScript. **No backend, no database.**
Everything that changes lives in small JSON files you edit by hand.

## Where to edit what

| I want to… | Edit this file | Images go in |
|---|---|---|
| Change a name / photo in the hierarchy or the home-page core team | `data/team.json` | `assets/img/team/` |
| Choose which groups show on the home page (founders / management / department heads …) | `data/team.json` → `home.show` | |
| Add an upcoming event (organising or participating) | `data/events.json` | `assets/img/events/` |
| Add a past event to the Hall of Fame (poster, details, team, gallery, reviews) | `data/hall-of-fame.json` | `assets/img/hall-of-fame/` |
| Change email / Instagram / Discord / logo / domain list | `data/site.json` | `assets/img/logo.png` |
| Add or remove background songs | `data/playlist.json` | `assets/audio/` |
| Add merch products / flip the store live | `merch/data/products.json`, `merch/data/status.json` | `assets/img/merch/` |

Every JSON file starts with a `_readme` line explaining its fields. Keep the keys, change the values, and keep the commas/quotes valid
(paste into jsonlint.com if something stops loading). A missing image never breaks a page — people fall back to an initial, posters to a generated card.

## Forms → your inbox
Contact, **Join us** (with CV), Hall of Fame reviews and the merch waitlist all go to `off.voidwalker@gmail.com`.
`data/site.json → forms.endpoint` points at FormSubmit (`https://formsubmit.co/ajax/<email>`).

1. Deploy, then submit each form **once yourself**. FormSubmit emails a confirmation link to the inbox — click it to activate.
2. If the service is unreachable or rejects a submission, the visitor's email app opens with the message pre-filled, so nothing is lost
   (for CVs the email asks them to attach the file manually).
3. Want a different service (Formspree, Web3Forms, your own server)? Change only the `endpoint` URL.

Reviews are moderated by design: they arrive by email, and you paste the good ones into `hall-of-fame.json → reviews`.

## Folder map
```
index.html · hierarchy.html · events.html · hall-of-fame.html · join.html · contact.html · help.html
data/            ← the files you edit (above)
assets/          img/ (team, hall-of-fame, events, merch, logo) · audio/
css/             variables · global · components · pages · settings
js/              i18n · data · forms · settings (music + drawer) · starfield · transitions · blackhole (WebGL)
                 people · home · events · hof · join · icons · main
merch/           separate store sub-system (own pages, css, js, data) — see merch/README.md
```

## Deploying
Upload the folder to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages). Notes:
- **Remove the old `vercel.json` rewrite** that sent `/(.*)` to `/api` — there is no API any more. The Go/Supabase backend is no longer used.
- The host must support HTTP range requests (all of the above do) so music can resume between pages.
- Locally: `python3 -m http.server 8080` works for browsing, but its audio seeking is limited.

## Notes
- **Black hole:** WebGL ray-tracer in `js/blackhole.js`. It auto-lowers its render resolution on slow GPUs; Settings → Visual effects → *Reduced* shows a still frame. No WebGL → a CSS ring fallback.
- **Music:** shuffled playlist, plays track after track, reshuffles when the round ends; position carries across pages. The four bundled tracks are generated placeholders — replace with music you have the rights to.
- **Languages:** English / हिन्दी / বাংলা. Navigation, headings, forms and settings are translated; longer copy (FAQ answers, org-chart tile text, merch page) is English until you add keys in `js/i18n.js`.
- **Logo:** put your black & violet logo at `assets/img/logo.png` (or change the path in `data/site.json`). Until then a violet/black placeholder shows.
- **Discord link:** add the invite URL at `data/site.json → discord.url` (only the name is set now).
