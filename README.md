# FreshPoint — Your Everyday Fresh Market

A installable PWA and marketing site for **OrganicPoint / FreshPoint**, an agricultural marketplace operating under OnePlan Enterprise. FreshPoint connects farmers, trusted suppliers and consumers through retail and wholesale shopping, reliable sourcing and doorstep delivery across South Sudan.

The app includes:

- A full landing page: hero, product categories, fresh picks, why FreshPoint, how it works, wholesale CTA and contact details.
- Phone-based login and signup with a country selector that defaults to **South Sudan (+211)** and can be changed to any supported country.
- SMS one-time-code verification powered by Supabase Auth.
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
2. In **Authentication → Providers → Phone**, enable phone sign-in. Connect an SMS provider (Twilio, MessageBird or Vonage) and add credits — SMS OTP messages are billable.
3. In **Authentication → URL Configuration**, add your site URL (e.g. `http://localhost:5173` locally, your deployed domain in production), and add `http://localhost:5173/**` / `https://your-domain/**` to the redirect allow list.
4. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor. It creates the `profiles` table and row-level security policies so signup details (name, account type, phone) are saved after verification.
5. Set Site URL in Supabase to your production domain before going live.

### Auth flow

- **Login:** phone number → Supabase sends SMS OTP → 6-digit verification → account page.
- **Signup:** name, phone, account type (household / retail / restaurant / wholesale) and terms → SMS OTP → verification → profile is upserted → account page.
- The country selector builds E.164 numbers (for example `+211900123456`). South Sudan is the default; 40+ countries are included in [`src/lib/countries.ts`](src/lib/countries.ts).
- Signed-in visitors are taken to their account instead of seeing the login form again.
- The UI is mobile-first: single-column layouts and 48px+ touch targets by default, with wider layouts added at larger breakpoints.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |

## PWA / deployment

The production build is generated in `dist/`. `vite-plugin-pwa` generates the service worker and manifest automatically. The manifest `start_url` is `/login`, so an installed PWA opens straight to the login screen. Deploy to any static host (Vercel, Netlify, Cloudflare Pages) over HTTPS, set the two `VITE_SUPABASE_*` environment variables at build time, and users can install FreshPoint from their browser’s “Add to home screen” action.

## Customise before launch

- Update `config.ts` with real contact details — the phone number and email there are placeholders.
- Replace `hero__photo`’s Unsplash background with your own farm/produce photography for stronger branding.
- Prices in the “Fresh picks” section are indicative examples in South Sudanese pounds (SSP) and should be connected to a live catalog when one exists.
- Extend `src/lib/countries.ts` if a customer country is missing.
- Brand assets live in `public/`: `logo.png` (header), `logo-light.png` (dark surfaces), `favicon.png`, and `icons/` (PWA icons generated from the supplied FreshPoint logo).

## Structure

```
src/
  components/    Header, Footer, Layout, Logo, phone/OTP fields, auth shell
  lib/           Supabase client, auth context, country/dial-code helpers
  pages/         Home, Login, Signup, Verify, Account, 404
  config.ts      Brand and contact details
  index.css      Design system and responsive styles
public/icons/    PWA app icons
supabase/        Database schema for user profiles
```

© FreshPoint — A OnePlan Enterprise brand.
