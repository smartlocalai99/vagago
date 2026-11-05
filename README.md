# VagaGo

A Vagamon-only booking platform, beginning with a native React Native + Expo customer app for iOS and Android. The latest user-supplied screenshot guides the clean, familiar booking-app layout: a full-width search field, compact date/guest controls, photo-led property cards, and direct checkout. The Explore header has no logo or location row. The browser displays a phone-width preview of the same components, including on desktop.

## What is implemented

- Four customer tabs: Explore, Offers, Bookings, and Profile. There is no wishlist or saved-plan journey.
- Full-width search, calendar dates, guests, property filters for cottages, homestays and villas, and an indicative nightly budget.
- Photo galleries that advance automatically and support swiping, with small thumbnail previews on cards and details and no visible play/pause controls.
- Sample comparison pricing with the higher amount struck through in red. These illustrative figures are not historical prices or published promotions; Offers has an honest empty state until real offers exist.
- Explore uses a live search bar (stay names and areas such as “pine forest”), date/guest chips, and edge-to-edge photo listings.
- Property details, accommodation selection, approximate road distance and drive time to ten Vagamon attractions, and a fixed “Book now” action. Exact addresses and directions stay hidden until the guest books.
- Booking review with required guest name/mobile, optional email, dates/guests editing, and estimated prices before taxes. Guest details are saved with the confirmed booking on the phone.
- “Pay at the stay” confirmation that saves the booking on the phone. The booking page shows the exact address, a “Get directions” link to Apple/Google Maps, nearby attractions with directions, and cancellation. Bookings lists Upcoming, Past and Cancelled stays.
- An animated splash using the provided logo, plus an optional first-launch foreground location request. Profile shows the approximate distance to Vagamon when location is shared.
- Shared JavaScript rules for date validation, filtering, and illustrative accommodation subtotals.

**Status:** the customer app, the website and the admin dashboard share one Supabase project for listings, availability and reservations. The three demo stays are fictional examples with representative photography. Guests pay at the stay; online payments, refunds and notifications are not connected yet, and the hotel management app is still planned.

## Run the customer app

Use a supported Node.js LTS release and npm. From the repository root:

```sh
npm install
npm start
```

Open the QR code shown by Expo in Expo Go for an initial device preview. The development machine and phone must be able to reach each other on the network. For platform-specific launch commands:

| Command | Purpose |
| --- | --- |
| `npm start` | Start the customer Metro/Expo development server |
| `npm run web` | Start the browser preview of the customer app |
| `npm run ios` | Start Expo and open an available iOS simulator; requires macOS and simulator setup |
| `npm run android` | Start Expo and open an available Android emulator/device |
| `npm run typecheck` | Check customer TypeScript types |
| `npm test` | Run domain and legacy-record compatibility tests |
| `npm run lint` | Run customer lint checks |
| `npm run export` | Export customer JavaScript/assets for iOS, Android, and web |

To run only legacy-record compatibility tests:

```sh
node --test apps/customer/src/state/storage-records.test.mjs
```

An Expo export is not a signed installable app, store submission, or deployment. The commands above describe how to verify the project; they do not imply that every device or production integration has been tested.

For a localhost-only simulator session on machines that resolve `localhost` to IPv6 first, use `NODE_OPTIONS=--dns-result-order=ipv4first npm run ios --workspace @vagago/customer -- --localhost`. The default LAN workflow is intended for physical-device previews.

### Why Expo SDK 57

The customer app uses SDK 57 for the initial Expo Go device workflow. As checked on 1 November 2026, Expo's [project setup guidance](https://docs.expo.dev/get-started/create-a-project/) recommends SDK 57 for physical-device Expo Go during the SDK 58 transition. Recheck compatibility before upgrading. Expo Go is useful for this early preview; custom native integrations and production preparation should use a development build, as explained in [Expo's environment guide](https://docs.expo.dev/get-started/set-up-your-environment/).

## Repository structure

```text
apps/customer/
  src/app/                 Expo Router screens and navigation layouts
  src/components/          Shared native UI and booking-flow controls
  src/data/                Explicitly labeled sample stay concepts
  src/state/               Session booking/guest state, optional location, legacy record helpers
  src/theme.ts             Shared customer colour and font tokens
  assets/                  Bundled photos and app artwork
packages/domain/
  src/                     Framework-independent validation and discovery rules
  test/                    Date, filter, and estimate tests
docs/                      Product plan, design, research, and future architecture
```

The shared package is available to workspace clients as `@vagago/domain`. Its current estimates and filters are for the preview only; future booking APIs must calculate authoritative prices and enforce inventory on the server.

## Website and admin dashboard (`apps/web`)

One Next.js (Pages Router) site holds the public booking website and, under `/admin`, the staff dashboard.

**Public website** (`/`): home with search, "Stays at the best price" and places to visit with distances; `/stays` results with sort; `/stays/<slug>` with photo gallery, live availability for the chosen dates, room choice, nearby places and stay rules; `/book` checkout (name and mobile, pay at the stay); `/trips` and `/trips/<id>` for the guest's bookings, where the exact address, directions and the property's number appear after booking. Guests book without an account, exactly like the app (anonymous sign-in, which must be enabled in Supabase). Listing pages are pre-rendered and refreshed in the background every five minutes, so new or edited hotels appear without a redeploy and visitors never hit the database directly for browsing.

**Admin dashboard** (`/admin`): not linked anywhere on the site, sent with `X-Robots-Tag: noindex`, and protected by sign-in. It is phone-sized and installable with **Add to Home Screen** from `/admin/` (manifest and service worker are scoped to `/admin/`).

- **Sign in:** username + 4-digit PIN. Accounts live in Supabase Auth as `<username>@admin.vagago.app` with the PIN expanded to `vagago-admin-pin-<PIN>`, and must be listed in `platform_admins`.
- **Home:** arrivals today, guests in-house, next 7 days, live hotels, latest bookings.
- **Bookings:** upcoming / in-house / past / cancelled with search; call or WhatsApp the guest; check in, check out, no-show, cancel. New bookings arrive live over Supabase Realtime with a banner, with no polling.
- **Hotels:** list by status and a six-step onboarding flow: basics, exact location (current GPS or a pasted Google Maps link), room types and prices, photos, amenities, then publish. Admins publish, unpublish, suspend and reinstate.
- **Photos:** resized in the browser to 1600px plus a 480px thumbnail (`<id>.thumb.webp`), then uploaded to the public `property-photos` bucket under `<property_id>/`.

```sh
npm run dev --workspace @vagago/web      # http://localhost:3001 (admin at /admin/)
npm run build --workspace @vagago/web
```

**Hosting on Vercel:** import the GitHub repository at vercel.com/new and set **Root Directory** to `apps/web` (framework: Next.js). No environment variables are required; the public Supabase URL and publishable key have defaults in `next.config.mjs`. Every push to `main` then redeploys the site.

### Keeping database traffic low

- Customer app: one request loads every published listing with rooms, photos and amenities; it is cached on the device and refreshed after 10 minutes or on pull-to-refresh. Attractions load once per launch. Bookings refresh at most once a minute, exact addresses are fetched once per booking, and photos use the device image cache with small thumbnails in lists.
- Website: listing pages are cached HTML regenerated at most every five minutes; availability is checked once per change of dates or room.
- Admin: one request per list (SWR, no refetch on focus), saves patch the cache instead of reloading, and realtime keeps bookings current.

## Database (Supabase)

`supabase/migrations/` holds the shared schema for the customer app, hotel app and admin dashboard: profiles, platform admins, properties with private exact locations, hotel team memberships and invitations, room types, daily rates, inventory blocks, photos, amenities, offers, attractions, reservations with per-night prices, payments, reviews and an audit log. Row level security limits customers to their own bookings, hotel teams to their own properties, and publishing to admins. Bookings go through `create_reservation`, which prices the stay and checks availability in the database; `cancel_reservation`, `update_reservation_status`, `accept_property_invitation` and `reservation_location` cover the rest of the lifecycle. Money is stored in paise.

`supabase/seed.sql` adds the three fictional demo stays for local development only. To make someone an admin, insert their auth user id into `platform_admins` from the SQL editor. The customer app connects to the hosted project (`rjdnsyhvemywztlngqvs`) through `apps/customer/src/lib/supabase.ts`, using `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `apps/customer/.env` locally and `eas.json` for cloud builds. These are public client values; never put the secret or service-role key in the app. Listings, attractions and bookings come from the database. Guests book without an account: the first booking signs the device in anonymously (requires anonymous sign-ins enabled in the project), and their bookings follow that device session. Regenerate types with `npx supabase gen types --remote --lang typescript --schema public > apps/customer/src/lib/database.types.ts`.

## Later connected milestone

After the customer interface is approved and backend work is requested, build one complete workflow across the three products: an admin onboards a hotel and invites its manager; the manager uses the separate hotel app to enter rooms, rates, and availability; the admin publishes the listing; a customer receives a server quote and completes a reservation through a verified payment flow.

The admin dashboard will use Next.js, JavaScript, and Tailwind CSS. The hotel app will use React Native + Expo for iOS and Android. Every hotel uses the same partner app with property-scoped permissions. Both apps and the customer app will share one inventory and reservation system.

Backend/authentication, hosting, payments, and notification providers remain to be selected and configured. No backend credentials are needed to run this preview. Real listing content and image rights, merchant onboarding, policy/tax requirements, and developer accounts are dependencies for live operation and distribution.

Legacy wishlist/plan storage is no longer read or written by the live app. Existing records are left untouched, and their compatibility helpers remain tested. The guest's device location is not persisted or uploaded. Bookings are stored in Supabase and cached on the device.

## Project references

- [Product plan](docs/product-plan.md) — journeys, milestones, logical data model, and external dependencies.
- [Design direction](docs/design-direction.md) — current visual tokens and screen composition.
- [Research](docs/research.md) — official travel-product and Vagamon references.
- [Architecture](docs/architecture.md) — proposed API and transactional booking contracts.
- [Photography credits](docs/asset-credits.md) — image sources, licenses, and representative-use limits.
- [Shared domain package](packages/domain/README.md) — current validation and estimate contracts.
- [Verification record](docs/verification.md) — completed checks, evidence, and remaining launch blockers.
