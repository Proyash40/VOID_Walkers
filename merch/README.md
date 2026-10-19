# Merch — sub-system

Self-contained so the store can grow without touching the main site.

```
merch/
├── index.html      storefront shell (status board now → product grid when live)
├── product.html    product detail   (?id=…)
├── cart.html       basket
├── checkout.html   address + payment
├── account.html    sign in / sign up / saved addresses
├── orders.html     order history + tracking
├── css/merch.css   store-only styles (global tokens come from ../css)
├── js/merch.js     status board, product grid, waitlist
└── data/
    ├── status.json     under-construction flag + per-module state
    └── products.json   catalogue (empty for now)
```

## Going live, step by step
1. Add products to `data/products.json` (+ photos in `../assets/img/merch/`) → the slot grid is replaced by real cards.
2. Flip each module in `data/status.json` from `queued` → `building` → `live`; set `"state": "live"` when ready.
3. Each stub page (`cart`, `checkout`, `account`, `orders`) becomes a real module. A static site can't safely hold
   payments or accounts on its own, so those need a small backend when you get there. Typical split:
   - **Accounts + orders database:** a hosted service (Supabase, Firebase, …).
   - **Payments:** an India-friendly gateway (e.g. Razorpay, Cashfree) — the gateway hosts the card/UPI step; you never touch card data.
   - **Order emails / notifications:** the same mailbox the site already uses, or a transactional-mail provider.
4. Keep everything merch-specific inside this folder so the main site stays unaffected.
