# FreshPoint — Your Everyday Fresh Market

A installable PWA and marketing site for **OrganicPoint / FreshPoint**, an agricultural marketplace operating under OnePlan Enterprise. FreshPoint connects farmers, trusted suppliers and consumers through retail and wholesale shopping, reliable sourcing and doorstep delivery across South Sudan.

The app includes:

- A full landing page: hero, product categories, fresh picks, why FreshPoint, how it works, wholesale CTA and contact details.
- Password login with **phone**, **email** or **username**, and signup that sets the password. The phone country selector defaults to **South Sudan (+211)**.
- SMS one-time-code verification powered by Supabase Auth.
- A mobile-first customer app after login: dashboard, shop, basket/checkout, order history and profile.
- A separate admin console at `/admin`: overview, order management, products and customers.
- Installable PWA support with an offline-capable service worker, web manifest and app icons.

## Quick start

```bash
npm install
cp .env.example .env
# Add your Supabase URL and anon key to .env
npm run dev
```

Open http://localhost:5173.

Without Supabase credentials the site still loads, but sending/verifying a code will show a generic error to the user. Auth errors are never surfaced verbatim to customers.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com) and copy its URL and anon key into `.env`.
2. Keep **Authentication → Providers → Email** enabled. Signup confirmation codes are delivered by Resend, so no SMS provider is needed. Phone sign-in can be added later if you enable a phone provider.
3. In **Authentication → URL Configuration**, add your site URL (e.g. `http://localhost:5173` locally, your deployed domain in production), and add `http://localhost:5173/**` / `https://your-domain/**` to the redirect allow list.
4. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor. It creates `profiles`, `products`, `orders` and `order_items`, their RLS policies and admin checks, `updated_at` triggers, and the two lookup functions used for username availability and username/password login.
5. Optionally run [`supabase/seed.sql`](supabase/seed.sql) to load the starter catalogue. Product `image` values are Cloudflare R2 object keys and can be filled in later.
6. Set Site URL in Supabase to your production domain before going live.

### Auth flow

- **Signup:** email and password are required; phone is optional and may be added for phone sign-in later. After signup, Resend emails a 6-digit confirmation code. Entering it confirms the address, saves the profile, signs the user in, and sends a designed welcome email.
- **Login:** choose **Phone**, **Email** or **Username** and enter the password. Username is resolved to the linked email (or phone) through a safe SQL function. Phone login also resolves the linked email first, so it keeps working even if a project has not enabled Supabase phone sign-in; direct phone-password auth is used when no linked email exists.
- Authentication errors are never shown verbatim to customers — the UI uses friendly, generic messages.
- The country selector builds E.164 numbers (for example `+211900123456`). South Sudan is the default; 40+ countries are included in [`src/lib/countries.ts`](src/lib/countries.ts).
- Signed-in visitors are taken to their account instead of seeing the login form again.
- The UI is mobile-first: single-column layouts and 48px+ touch targets by default, with wider layouts added at larger breakpoints.

### Cloudflare R2 images

- Create an R2 bucket and enable public access through a custom domain (recommended, e.g. `https://images.freshpoint.ss`) or its `r2.dev` URL.
- Set `VITE_R2_PUBLIC_BASE_URL` to that base URL, with no trailing slash, in `.env` and in Vercel’s build-time environment variables.
- Upload the hero photo as `hero-market.jpg` and set `VITE_R2_HERO_KEY` to that key. If either variable is blank, the bundled `/images/hero-market.jpg` is used instead.
- Product images are R2 object keys such as `products/tomatoes.jpg`. Enter the key in the admin product form; a full `https://` URL also works. With no key, the emoji tile is shown.
- The SQL tables store only keys/URLs, never image binaries. Logos and PWA icons stay in `public/` so installation and offline UI keep working.

The project bucket is `freshpoint` (account `1a5b866551a41273b73330df9fdd06f5`). S3 credentials are stored in the gitignored `.env.local` and are used only by the upload script:

```bash
npm run r2:upload -- public/images/hero-market.jpg hero-market.jpg
npm run r2:upload -- ./tomatoes.jpg products/tomatoes.jpg
```

Public access is enabled at `https://pub-02d90611e0b0445387154d48c4ce9521.r2.dev`, which is set as `VITE_R2_PUBLIC_BASE_URL` locally and in Vercel. If it is ever unavailable, the app falls back to its bundled images/emoji tiles.

### Resend email

Confirmation codes and the welcome email are sent by serverless API routes that call Resend directly. The browser never receives the Resend or Supabase secret keys.

- `api/signup.ts` creates the Supabase Auth user, stores a hashed code in the server-only `email_confirmations` table, and emails the code.
- `api/verify-email.ts` checks the code, confirms the email, saves the profile, starts a Supabase session and sends the branded welcome email.
- `api/resend-code.ts` issues a fresh code with a 30-second cooldown.
- Set `RESEND_API_KEY`, `SUPABASE_SECRET_KEY` (both sensitive), `RESEND_FROM_EMAIL` and `SITE_URL` in Vercel. `SITE_URL` builds the welcome email’s “Start shopping” link.
- While testing, `RESEND_FROM_EMAIL` can be `FreshPoint <onboarding@resend.dev>`. Resend limits those messages to the account owner’s address, so verify a sending domain and switch to an address on it before launch.

### Customer app and admin console

- Signed-in customers land at `/app`. Tabs cover **Home** (overview), **Shop** (searchable catalogue), **Basket** (quantity controls and checkout), **Orders** and **Account**.
- Placing an order adds it to order history and creates a customer record if needed. Products, orders and customers persist in the browser via `localStorage` for now; swapping in Supabase tables later only requires changing `src/lib/data-context.tsx`.
- `/admin/login` is a separate, chrome-free sign-in for staff. After sign-in, the console is at `/admin` with orders, products and customers screens.
- Admin access is granted by setting `app_metadata.role = 'admin'` on the Supabase auth user (the `profiles.role` column mirrors it for reporting). Non-admin users are redirected away from `/admin`. Seed the admin credential when ready.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |
| `npm run r2:upload -- <file> <key>` | Upload an image to the `freshpoint` R2 bucket |

## PWA / deployment

The production build is generated in `dist/`. `vite-plugin-pwa` generates the service worker and manifest automatically. The manifest `start_url` is `/login`, so an installed PWA opens straight to the login screen. Set the `VITE_*` variables at build time and users can install FreshPoint from their browser’s “Add to home screen” action. Signup needs the `/api/*` serverless routes, so deploy to a host that runs them (Vercel is configured); a purely static host will only serve the UI.

## Customise before launch

- Update `config.ts` with real contact details — the phone number and email there are placeholders.
- Replace `public/images/hero-market.jpg` with your own farm/produce photography, or upload it to R2 and set `VITE_R2_HERO_KEY`. The local file remains the offline fallback.
- Prices in the “Fresh picks” section are indicative examples in South Sudanese pounds (SSP) and should be connected to a live catalog when one exists.
- Extend `src/lib/countries.ts` if a customer country is missing.
- Brand assets live in `public/`: `logo.png` (header), `logo-light.png` (dark surfaces), `favicon.png`, and `icons/` (PWA icons generated from the supplied FreshPoint logo).

## Structure

```
api/             Serverless signup, email verification and code resend routes
server/          Shared Supabase/Resend helpers and branded email templates
src/
  components/    Header, Footer, Layout, Logo, auth/customer/admin shells, guards
  lib/           Supabase client, auth/store contexts, R2 asset helper, country helpers, demo data
  pages/user/    Dashboard, Shop, Cart, Orders, Profile
  pages/admin/   Admin login, Dashboard, Orders, Products, Customers
  pages/         Home, Login, Signup, Verify, 404
  config.ts      Brand and contact details
  index.css      Design system and responsive styles
public/images/   Bundled hero fallback
public/icons/    PWA app icons
supabase/        Database schema and optional starter catalogue
```

© FreshPoint — A OnePlan Enterprise brand.
