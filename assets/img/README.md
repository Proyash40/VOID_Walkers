# Images

Drop files here and reference them from the JSON files in `data/`.

| Folder | Used by | Notes |
|---|---|---|
| `logo.png` | navbar + footer (`data/site.json → logo`) | Your black & violet logo. Square, transparent or dark background, ≥ 256 px. Until it exists, `logo-placeholder.svg` is shown. |
| `team/` | `data/team.json` | Portrait photos, ~600×800 (3:4) works best. |
| `hall-of-fame/` | `data/hall-of-fame.json` | Event posters (portrait) + gallery photos. |
| `events/` | `data/events.json` | Optional event posters. |
| `merch/` | `merch/data/products.json` | Product photos. |

A missing image never breaks a page — people fall back to an initial, posters to a generated card.
Keep files small (≤ 300 KB; use WebP/JPEG) so pages stay fast.
