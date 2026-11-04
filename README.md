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

**This is a design preview, not an operating booking service.** The three stays and comparison prices are fictional examples with representative photography. Prices exclude taxes and fees and do not imply availability. Checkout charges nothing, and confirmed bookings are stored only on the guest’s phone: no property is notified and no inventory is held. Profile does not yet provide sign-in. Database/backend work is deferred at the user's request; authentication, live inventory, payments, reservations, refunds and notifications are not connected. The admin dashboard and hotel management app remain planned products.

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

## Database (Supabase)

`supabase/migrations/` holds the shared schema for the customer app, hotel app and admin dashboard: profiles, platform admins, properties with private exact locations, hotel team memberships and invitations, room types, daily rates, inventory blocks, photos, amenities, offers, attractions, reservations with per-night prices, payments, reviews and an audit log. Row level security limits customers to their own bookings, hotel teams to their own properties, and publishing to admins. Bookings go through `create_reservation`, which prices the stay and checks availability in the database; `cancel_reservation`, `update_reservation_status`, `accept_property_invitation` and `reservation_location` cover the rest of the lifecycle. Money is stored in paise.

`supabase/seed.sql` adds the three fictional demo stays for local development only. To make someone an admin, insert their auth user id into `platform_admins` from the SQL editor. The customer app is not yet connected to the database; it still stores bookings on the device.

## Later connected milestone

After the customer interface is approved and backend work is requested, build one complete workflow across the three products: an admin onboards a hotel and invites its manager; the manager uses the separate hotel app to enter rooms, rates, and availability; the admin publishes the listing; a customer receives a server quote and completes a reservation through a verified payment flow.

The admin dashboard will use Next.js, JavaScript, and Tailwind CSS. The hotel app will use React Native + Expo for iOS and Android. Every hotel uses the same partner app with property-scoped permissions. Both apps and the customer app will share one inventory and reservation system.

Backend/authentication, hosting, payments, and notification providers remain to be selected and configured. No backend credentials are needed to run this preview. Real listing content and image rights, merchant onboarding, policy/tax requirements, and developer accounts are dependencies for live operation and distribution.

Legacy wishlist/plan storage is no longer read or written by the live app. Existing records are left untouched, and their compatibility helpers remain tested. Location coordinates are not persisted or uploaded. Confirmed bookings, including guest contact details, are stored locally under `@vagago/bookings:v1` and never uploaded.

## Project references

- [Product plan](docs/product-plan.md) — journeys, milestones, logical data model, and external dependencies.
- [Design direction](docs/design-direction.md) — current visual tokens and screen composition.
- [Research](docs/research.md) — official travel-product and Vagamon references.
- [Architecture](docs/architecture.md) — proposed API and transactional booking contracts.
- [Photography credits](docs/asset-credits.md) — image sources, licenses, and representative-use limits.
- [Shared domain package](packages/domain/README.md) — current validation and estimate contracts.
- [Verification record](docs/verification.md) — completed checks, evidence, and remaining launch blockers.
