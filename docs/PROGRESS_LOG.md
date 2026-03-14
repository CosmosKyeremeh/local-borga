# Local Borga — Full Progress Log

> Last updated: March 2026
> Live URL: https://local-borga.vercel.app
> Owner: Cosmos Kyeremeh, Accra Ghana
> Status: Phase II Complete — On exam break, resuming ~May 2026

---

## How to Resume in May

Open a new Claude chat and paste this:

> "I'm back to continue building Local Borga — my Ghanaian e-commerce platform. Here is my progress log."

Then attach this file + the README.md. That is all Claude needs to get fully up to speed.

---

## Session 1 — Foundation (Early Stage)

### Backend (API) Infrastructure
- **Clean Slate Rebuild**: Wiped and recreated a clean server environment to resolve configuration conflicts
- **TypeScript & ESM Configuration**: Configured `package.json` and `tsconfig.json` for modern ECMAScript Modules (ESM) using `NodeNext` settings
- **Live API Endpoint**: Built a working Express server with a GET route at `http://localhost:5000/api/products` serving JSON data

### Frontend (Web-Client) Integration
- **Full-Stack Connection**: Updated `web-client/app/page.tsx` to fetch live data from the backend instead of static text
- **Dynamic UI Display**: Successfully rendered products on the website at `http://localhost:3000`

### Development Workflow & Tools
- **Multi-Terminal Mastery**: Learned to manage two simultaneous terminal processes (API + website)
- **Automated Development**: Implemented `tsx watch` for automatic server refresh on save
- **Version Control**: Created `.gitignore` and committed the working baseline to Git

### Error Resolution
- **Pathing & ENOENT**: Always `cd web-client` before running npm commands — package.json lives there, not at the repo root
- **Connection Fix**: Resolved "Site can't be reached" by ensuring backend was active and ports (5000 and 3000) were correctly mapped

---

## Session 2 — Full Platform Build (March 2026)

This session migrated away from the Express backend entirely. The project is now a **pure Next.js 16 App Router** application — API routes live inside Next.js itself (`app/api/`), removing the need for a separate Express server. Supabase replaced the local database.

### Stack at End of Session 2
```
Frontend        Next.js 16 (App Router) + TypeScript
Styling         Tailwind CSS v4
Animations      Framer Motion
UI              Lucide React, Sonner (toasts), Recharts
Database        Supabase (PostgreSQL + Realtime + Auth)
Payments        Paystack (server-side initialize + verify)
Notifications   Twilio (SMS + WhatsApp Business API)
Deployment      Vercel
Dev command     cd web-client && npm run dev
```

---

### Deployment Fix
- **Root cause**: `vercel.json` had build commands pointing to `web-client/` but Vercel's Root Directory was blank
- **Fix**: Set `vercel.json` at repo root with explicit `installCommand`, `buildCommand`, `outputDirectory`
- **Rule**: Always leave Vercel dashboard Root Directory **blank** — let `vercel.json` handle it
- **TypeScript fix**: All API routes now use `err: unknown` + `toMessage()` helper instead of `err: any`

```json
{
  "framework": "nextjs",
  "installCommand": "cd web-client && npm install",
  "buildCommand": "cd web-client && npm run build",
  "outputDirectory": "web-client/.next"
}
```

---

### Feature 1 — Authentication Page (`/auth`)
- **File**: `web-client/app/auth/page.tsx`
- Email/password sign in and sign up
- Google OAuth via `supabaseBrowser.auth.signInWithOAuth`
- Forgot password with `resetPasswordForEmail`
- Reads `?redirect=` param and bounces logged-in users away
- Email confirmation screen after sign up
- `useSearchParams()` wrapped in `<Suspense>` (required by Next.js)
- **Supabase setup needed**: Auth → Providers → enable Google, add OAuth credentials

---

### Feature 2 — Customer Account Page (`/account`)
- **Files**: `web-client/app/account/page.tsx`, `web-client/app/api/account/orders/route.ts`
- Redirects to `/auth?redirect=/account` if no session
- Profile header with avatar initial, full_name, email, Sign Out
- Order history fetched by `userId` from `/api/account/orders`
- Collapsible order rows: items, shipping address, "Track this order →" link
- Realtime subscription: status updates live + toast notification
- Empty state with "Start Shopping" CTA

---

### Feature 3 — Real Paystack Payments
- **Files**: `web-client/app/api/payment/initialize/route.ts`, `web-client/app/api/payment/verify/route.ts`
- Replaced the demo card form with real Paystack inline popup
- Secret key **never** leaves the server
- Flow: client calls `/api/payment/initialize` → gets reference → Paystack popup → user pays → client calls `/api/payment/verify` → server confirms status + amount → order created
- **Env vars needed**: `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

---

### Feature 4 — Farm Tools Storefront (`/farm-tools`)
- **Files**: `web-client/app/farm-tools/page.tsx`, updated `CartContext.tsx`, updated `products` API
- Shared cart with food storefront — `ItemType = 'SHELF' | 'CUSTOM_MILLING' | 'FARM_TOOL'`
- Farm tool product IDs prefixed `ft-{id}` to avoid collision with food product IDs
- `GET /api/products?section=farm_tools` filters by section; default returns `section='staples'`
- **Design**: dark industrial — slate-950 bg, green-600 accents, amber CTAs
- **Effects**: auto-rotating spotlight hero carousel, live viewer counter, 3D tilt cards, animated stat counters, staggered scroll reveal
- **Database**: run `supabase/farm-tools-seed.sql` — adds `section` column, seeds 12 farm tools
- Farm tool categories seeded: Hand Tools, Spraying, Irrigation, Machinery, Transport, Protective

---

### Feature 5 — Stock Quantity Tracking
- **SQL**: `supabase/stock-migration.sql` — adds `stock_quantity` integer column (default 50)
- **Stored function**: `deduct_stock(items jsonb)` — atomically deducts stock, raises exception if any item is short, all-or-nothing
- **Orders route**: calls `deduct_stock()` after order insert; rolls back order on stock conflict (returns 409)
- **ProductCard UI**: green dot "In Stock", red pulsing dot "Only N left" (≤5), greyscale + frosted overlay + disabled button when out of stock
- Farm tool `ft-` prefix is stripped before querying products table in the function

---

### Feature 6 — Individual Product Detail Pages (`/products/[id]`)
- **Files**: `web-client/app/products/[id]/page.tsx`, `web-client/app/api/products/[id]/route.ts`
- API route: GET (single product), PATCH (admin update), DELETE (admin delete)
- **Page features**:
  - Parallax hero image (scrolls at different speed via Framer Motion `useScroll` + `useTransform`)
  - Two-column layout: identity left, sticky purchase panel right
  - Stock badge, quantity selector (capped at stock level), animated Add to Cart
  - Works for both storefronts — checks `product.section`, routes farm tools with `ft-` prefix
  - Related products: same category first, fills from same section if category is thin
- **ProductCard patch**: image and product name are now `<Link href="/products/[id]">` — `+` button still adds directly without navigating
- **React 19 fix**: `useState(true)` for initial loading state — do NOT call `setIsLoading(true)` inside `useEffect` (triggers cascading renders warning)

---

### Feature 7 — SMS + WhatsApp Notifications
- **File**: `web-client/src/lib/notify.ts`
- Uses Twilio REST API directly (no SDK dependency) — `fetch` with Basic Auth
- Graceful degradation: silently skips if env vars not set — orders never fail due to notification errors
- `notify({ to, sms?, whatsapp? })` — call with either or both channels
- Pre-built templates: `messages.orderPlaced()`, `messages.statusUpdated()`, `messages.adminAlert()`
- **Triggers**:
  - Order placed → customer gets SMS + WhatsApp; admin gets SMS
  - Admin updates order status → customer gets SMS + WhatsApp
- All notification calls use `Promise.allSettled` (non-blocking, fire-and-forget)
- **WhatsApp note**: requires customer to opt-in to sandbox first; production needs Twilio WhatsApp Business sender approval (1–2 days)

**Env vars needed**:
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN       ← ROTATE THIS — was exposed in a screenshot during session
TWILIO_PHONE_NUMBER     → Twilio Console → Phone Numbers → Active Numbers
TWILIO_WHATSAPP_NUMBER  → Twilio Console → Messaging → WhatsApp sandbox (+14155238886)
ADMIN_PHONE_NUMBER      → your own number e.g. +233XXXXXXXXX
```

---

### Feature 8 — Navbar Farm Tools Link
- Added `<Tractor>` icon import from lucide-react
- Green pill link in desktop nav and mobile nav pointing to `/farm-tools`
- Visually distinct from regular anchor links — signals a separate storefront

---

### Feature 9 — Shipping Calculator
- **File**: `web-client/src/lib/shipping.ts`
- Zone-based rates: base fee + per-item surcharge, no external API
- 7 zones matching the checkout country `<select>` exactly: Ghana (free), UK, US, Canada, Germany, Netherlands, Other
- `calculateShipping(country, itemCount)` returns `{ cost, zone, eta, emoji, isFree }`
- **Checkout integration**:
  - `useEffect` recalculates on every country or cart size change (instant, no API call)
  - Step 1 (details): cart summary shows subtotal + shipping line + ETA + grand total
  - Step 2 (payment): amber box shows full breakdown
  - `grandTotal = totalAmount + shippingQuote.cost` used everywhere instead of `totalAmount`
  - Order payload includes `subtotal`, `shippingCost`, `shippingZone`
  - Receipt prints with shipping line itemised
- **SQL**: `supabase/shipping-migration.sql` — adds `subtotal`, `shipping_cost`, `shipping_zone` to orders table

---

### Feature 10 — SEO + PWA
- **`layout.tsx`**: complete rewrite with full Next.js 16 metadata API
  - Title template: `'%s | Local Borga'`
  - 36 targeted keywords across: brand, staples, farm tools, custom milling, diaspora, geo/intent
  - Open Graph (Facebook, WhatsApp, LinkedIn previews)
  - Twitter/X card with large image
  - Robots: index + follow, max-image-preview large
  - `viewport` exported separately (Next.js 16 requirement) with `themeColor: '#f59e0b'`
- **`public/manifest.json`**: PWA manifest
  - `display: standalone` — opens like a native app
  - 3 app shortcuts: Shop Staples, Farm Tools, Track Order
  - Icons at 8 sizes (72 → 512px) — **still need to generate icons**, use realfavicongenerator.net with logo.jpg
- **`public/sw.js`**: manual service worker (no next-pwa — incompatible with Next.js 16)
  - Cache First: `/_next/static/`, `/images/`, `/icons/`, fonts
  - Network First + offline fallback: pages
  - Network Only: `/api/*` routes (never serve stale order data)
  - Pre-caches: `/`, `/offline`, `/manifest.json`, `/logo.jpg` on install
- **`src/components/ServiceWorkerRegister.tsx`**: client component, registers SW silently on mount
- **`app/offline/page.tsx`**: branded offline fallback page shown when fully offline + no cache
- **Google Search Console**: go to "Other verification methods" → "HTML tag" → copy the `content=` string → paste into `layout.tsx` verification block (NOT the HTML file method)

---

## Database Schema (current — end of Session 2)

### `products`
| Column | Type | Notes |
|---|---|---|
| id | serial | Primary key |
| name | text | |
| price | numeric | USD |
| category | text | e.g. GARI, FLOUR, HAND TOOLS |
| description | text | |
| image | text | Path to `/public/images/` — case-sensitive |
| is_premium | boolean | Shows "Limited Edition" badge |
| section | text | `staples` or `farm_tools` |
| stock_quantity | integer | Default 50, decremented by deduct_stock() |
| created_at | timestamptz | |

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | bigserial | Primary key / tracking ID shown to customer |
| item_name | text | |
| order_type | text | `shelf`, `custom_milling`, `farm_tool` |
| milling_style | text | Fine / Medium / Coarse |
| weight_kg | numeric | |
| total_price | numeric | Grand total incl. shipping |
| subtotal | numeric | Cart items total excl. shipping |
| shipping_cost | numeric | |
| shipping_zone | text | e.g. "United Kingdom" |
| status | text | pending → milling → completed → shipped |
| cart_items | jsonb | Array of {name, quantity, price} |
| customer_name | text | |
| customer_email | text | |
| customer_phone | text | E.164 format — used for Twilio |
| shipping_address | jsonb | {address, city, country} |
| user_id | uuid | Links to Supabase Auth user |
| paystack_reference | text | For payment reconciliation |
| created_at | timestamptz | |

---

## Environment Variables (full list)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin panel
ADMIN_PASSWORD=
JWT_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://local-borga.vercel.app

# Paystack
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=

# Twilio (ROTATE AUTH TOKEN — was exposed in screenshot)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=
ADMIN_PHONE_NUMBER=
```

---

## Files Produced This Session (saved in outputs)

| Output File | Destination in Project |
|---|---|
| `auth-page.tsx` | `web-client/app/auth/page.tsx` |
| `account-page.tsx` | `web-client/app/account/page.tsx` |
| `account-orders-route.ts` | `web-client/app/api/account/orders/route.ts` |
| `payment-initialize-route.ts` | `web-client/app/api/payment/initialize/route.ts` |
| `payment-verify-route.ts` | `web-client/app/api/payment/verify/route.ts` |
| `farm-tools-page.tsx` | `web-client/app/farm-tools/page.tsx` |
| `CartContext.tsx` | `web-client/src/context/CartContext.tsx` |
| `farm-tools-seed.sql` | `supabase/farm-tools-seed.sql` |
| `stock-migration.sql` | `supabase/stock-migration.sql` |
| `orders-route-stock.ts` | `web-client/app/api/orders/route.ts` |
| `product-detail-page.tsx` | `web-client/app/products/[id]/page.tsx` |
| `product-id-route.ts` | `web-client/app/api/products/[id]/route.ts` |
| `productcard-link-patch.tsx` | patch applied to bottom of `web-client/app/page.tsx` |
| `notify.ts` | `web-client/src/lib/notify.ts` |
| `orders-id-route-notify.ts` | `web-client/app/api/orders/[id]/route.ts` |
| `navbar-farmtools-patch.tsx` | patch applied to navbar in `web-client/app/page.tsx` |
| `shipping.ts` | `web-client/src/lib/shipping.ts` |
| `shipping-migration.sql` | `supabase/shipping-migration.sql` |
| `orders-route-shipping.ts` | `web-client/app/api/orders/route.ts` |
| `layout.tsx` | `web-client/app/layout.tsx` |
| `manifest.json` | `web-client/public/manifest.json` |
| `sw.js` | `web-client/public/sw.js` |
| `ServiceWorkerRegister.tsx` | `web-client/src/components/ServiceWorkerRegister.tsx` |
| `offline-page.tsx` | `web-client/app/offline/page.tsx` |
| `README.md` | `local-borga/README.md` |
| `Local_Borga_Project_Guide.docx` | Keep locally — full project reference document |

---

## Next Session Agenda (May 2026)

### Priority 1 — Critical Gaps (do these first)
- [ ] **Paystack Webhooks** — handle `charge.success` event server-side so orders are created even if the browser closes after payment. Route: `web-client/app/api/payment/webhook/route.ts`
- [ ] **Zod validation** — add input schema validation to all POST/PATCH API routes. Install: `npm install zod`
- [ ] **Rate limiting** — protect `/api/orders` and `/api/payment/initialize` from spam. Use Vercel Edge middleware or Upstash Redis
- [ ] **Password reset page** — `/auth/reset-password` page that Supabase redirects to after the forgot password email is clicked. Currently the link goes nowhere

### Priority 2 — Important
- [ ] **Email receipts** — send HTML order confirmation email via Resend (resend.com). Free tier is generous
- [ ] **RLS review** — verify no client-side code accidentally uses the service role key
- [ ] **Error boundary** — wrap key page sections so a component crash doesn't white-screen the whole page
- [ ] **Image optimisation** — convert product images to WebP, configure Next.js image domains

### Priority 3 — Growth
- [ ] **Product reviews** — star ratings on product detail pages
- [ ] **Discount codes** — Paystack supports promo codes natively
- [ ] **Multi-currency display** — show GHS / GBP / USD with live rates
- [ ] **WhatsApp Business dedicated sender** — apply through Twilio (takes 1–2 days approval)
- [ ] **Google Search Console verification** — paste content= string from HTML tag method into layout.tsx verification block
- [ ] **PWA icons** — generate at all sizes using realfavicongenerator.net, drop into `/public/icons/`

---

## Known Issues & Reminders

- **Twilio Auth Token exposed in screenshot** — rotate it immediately in Twilio Console before next session
- **`cd web-client` first** — always run npm commands from inside `web-client/`, never from repo root
- **Image paths are case-sensitive** — `product.image` in Supabase must match exactly with filenames in `/public/images/`
- **WhatsApp sandbox opt-in** — customers must text the sandbox number first before they can receive WhatsApp messages
- **Farm tools images** — placeholder paths used (`/images/farm-tools/*.jpg`), real images still needed in `/public/images/farm-tools/`
- **React 19** — do not call `setState` synchronously inside `useEffect`. Initialise state as `true` instead of setting it at the top of an effect

---

*Local Borga — Built with obsessive attention to detail. © 2026 Cosmos Kyeremeh*
