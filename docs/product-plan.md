# VagaGo product and implementation plan

Updated 1 November 2026. The current customer milestone follows the user's latest booking-app screenshot and booking-only requirements. Database/backend work is deferred. Future platform operations below are proposed contracts, not deployed services.

## Product boundary

VagaGo is exclusively for discovering and booking stays in Vagamon. It has three products sharing one backend:

| Product | Platform | Primary responsibility |
| --- | --- | --- |
| Customer | React Native + Expo, iOS and Android | Discover, compare, check out, and manage bookings |
| Admin | Next.js, JavaScript, Tailwind CSS | Onboard hotels, invite managers, verify and publish listings, oversee operations |
| Hotel management | Separate React Native + Expo app | Manage assigned properties, rooms, rates, inventory, and reservations |

All hotel managers use the same partner app. A membership assigns a manager to a property; onboarding does not create a new app. The customer browser build is a phone-width preview of the native components, including on desktop. The admin dashboard is the web product in the current scope.

## First milestone

Build a direct booking flow: search, compare stays, select accommodation, enter guest details, and choose a payment method. Airbnb/OYO interaction patterns and the user's screenshot guide the interface. VagaGo retains its own logo on the animated launch screen and its Vagamon focus; Explore begins immediately with search, without a logo/location header.

The three properties, photos and prices are explicit preview examples. Higher comparison amounts may appear struck through in red as sample price presentation; they are not historical selling prices or published offers. Hot deals remains empty until actual offers exist. No invented availability, reviews, verification, cancellation terms, charges or confirmed bookings are permitted. Wishlist, Trips and saved-plan features are outside the current product scope.

## Customer journey and screens

1. **Launch and location:** animate the supplied VagaGo logo, respecting reduced motion. After first launch, offer foreground location access with a usable “Not now” option. Approximate distance to Vagamon is visible in Profile; location is not required to browse or check out.
2. **Explore:** a full-width search field at the top, compact date/guest controls, property-type filters and a vertical stay feed. Cards show photography, capacity and sample nightly/comparison prices. No logo/location header, wishlist controls or desktop hero.
3. **Search:** Vagamon destination, calendar dates, guests, keyword, property type and nightly budget. Changes apply through “Show stays”; dismissing cancels them. When entered from checkout, change dates/guests and return to the same property and accommodation with guest contact fields intact.
4. **Stay details:** automatically advancing, swipeable photos with small thumbnail previews, both on cards and property details. No visible play/pause buttons. Show practical facts, amenities and accommodation selection. Cottages, homestays and villas currently represent whole properties. “Book now” leads to checkout. Exact address/directions stay hidden before confirmation.
5. **Review booking:** selected stay/accommodation, editable dates/guests, full name, Indian mobile number and optional email. Validate inputs and show an illustrative subtotal before taxes. “Continue to payment” opens payment selection. Guest contact details stay in session memory.
6. **Payment:** selectable UPI/card methods, booking summary, and a disabled final payment button. State “Online booking opens soon”; collect no card details and create no booking or charge.
7. **Hot deals:** published offers only. Until offers are supplied, show a clear empty state and a useful return to Explore. Sample comparison prices do not constitute published deals.
8. **Bookings:** Upcoming, Past and Cancelled tabs with real empty states. Only actual reservations may populate them when booking services are connected.
9. **Profile:** guest view with Bookings, Hot deals and Location preferences. Show the approximate distance after consent; do not present a working account sign-in flow yet.

Use four persistent tabs: **Explore, Hot deals, Bookings, Profile**. Search, property details, review and payment use native stack navigation. Native iOS/Android are the customer products; the browser is their phone-width preview.

## Design direction

Help a customer find and compare suitable accommodation quickly. Search controls and property facts lead the interface; Vagamon photography supports the listings. Avoid a large landing hero, mood-led entry screen, and editorial website layout.

### Compact design tokens

| Role | Direction |
| --- | --- |
| White | `#FFFFFF` — main canvas |
| Accent | `#D92848` — primary actions, selected controls and sample comparison-price treatment |
| Ink | `#222222` — primary text |
| Soft accent | `#FFF0F3` — subtle selected surfaces |
| Stone | `#EBEBEB` — borders and dividers |
| Secondary text | `#717171` |
| Typography | Manrope, regular through bold for headings, body, controls, and prices |
| Numbers | Tabular figures for dates, guests, and price comparisons |

Readable text contrast takes precedence over the aesthetic palette. Quiet colours must not be used as low-contrast body text. Phone layouts respect safe areas, touch target sizes, dynamic text, keyboard access on web, and reduced motion preferences.

### App layout

```text
[ Full-width search                     ]
[ Dates ]                     [ Guests ]
[ All · Cottages · Homestays · Villas ]

[ Automatically advancing stay photo ]
Name · capacity · sample price comparison
[ Automatically advancing stay photo ]
Name · capacity · sample price comparison

[ Explore | Hot deals | Bookings | Profile ]
```

Use compact spacing, clear separators, rounded cards and at least 44-point touch targets. Keep booking actions reachable without covering content. On desktop, retain the phone-width preview. Exact property addresses/coordinates must not be revealed publicly. Avoid invented weather, urgency, historical-price claims and verification badges. Automatic galleries stop for interaction, backgrounding and reduced-motion preferences.

VagaGo's distinction comes from useful Vagamon property information and a coherent booking journey. Familiar controls should make the service easier to use. The [design direction](design-direction.md) records the current screen composition in more detail.

## Proposed shared data model

This is a logical model for the backend phase, not an applied database migration.

| Entity | Purpose and important relationships |
| --- | --- |
| Users and profiles | Authentication subject, display preferences, consent; no client-assigned privileges |
| Property memberships | User + property + role; server-authorized owner, manager, or staff access |
| Properties | Draft/review/published/suspended status, address, location, contact, editorial details |
| Property claims and verification | Field or claim, owner evidence, reviewer, verification status and timestamp |
| Photos and amenities | Property/room association, ordering, caption, rights and attribution |
| Room types and room units | Capacity, occupancy rules, physical inventory, property association |
| Rate plans and daily rates | Cancellation policy, inclusions, currency, date overrides, occupancy pricing |
| Inventory days | Sellable, blocked, held, and reserved quantities per room type/date |
| Published offers | Property/rate association, terms, validity dates and reviewed publication state; distinct from illustrative comparison prices |
| Quotes | Server-calculated dated breakdown, tax/fee lines, expiration, policy snapshot |
| Reservation holds | Short-lived inventory commitment for the whole stay |
| Reservations and items | Guest, property, stay dates, rooms, immutable quote and policy snapshots |
| Payments, refunds, commissions | Provider identifiers, amounts in integer minor units, explicit lifecycle states |
| Webhook events | Unique provider event IDs for deduplication and safe retry |
| Notifications and audit events | Delivery state and actor-attributed operational history |
| Reviews | Eligible completed reservation, moderation status, authored rating and text |

Store hotel stay dates as local calendar dates with checkout exclusive. Store events as UTC timestamps; use the property's timezone for operational date boundaries. Keep money in integer minor units with currency. Do not let clients calculate an authoritative total or confirm their own payment.

### Permission boundary

- Customers read published listings and their own quotes, reservations and payment status; exact property address is released only for an eligible confirmed booking.
- Hotel users access only memberships' properties; they cannot publish themselves or grant platform privileges.
- Admins review, publish, and perform authorized platform operations with audit records.
- Public responses never expose staff membership, personal contact details, payment secrets, or unpublished instructions.

### Booking invariant

The server is the sole authority for availability. It revalidates a quote and atomically holds all requested nights inside a database transaction. Competing requests lock or conditionally update the same inventory records; partial stays cannot succeed. Holds expire and release inventory safely. Payment confirmation uses a verified, idempotent provider webhook; cancellation/refund workflows reconcile payment state with reservation state. A stale mobile screen can never bypass these checks.

## Implementation stages

1. **Customer design and native UI:** complete the screenshot-led search/listing layout, four booking-focused tabs, automatic galleries, animated launch, optional location, guest checkout and unavailable-payment states. Keep sample content explicit and contacts in memory. Legacy saved-plan/wishlist records remain untouched on disk but are unused by the live app.
2. **Connected pilot, when requested:** implement authentication and permissions, admin onboarding/invitations, partner room/rate/inventory editing, publication review, server quotes/holds, payment sandbox integration and customer reservations. Exercise simultaneous bookings and webhook retries. Database implementation is deliberately deferred until this stage.
3. **Operations:** cancellations, refunds, check-in/out, notifications, commission accounting, support, reviews, and operational reports.
4. **Launch readiness:** real property content and permissions, accessibility and device testing, error monitoring, backups/recovery, payment reconciliation, store metadata and release builds. Deploy only under the user's launch instruction.

## External dependencies before live transactions

- Backend hosting, database, authentication provider configuration, and server secrets.
- Payment provider merchant account and approved credentials, webhook endpoint and secrets; test and live environments must remain separate.
- Real hotel agreements, property content/photo rights, inventory and rate ownership, cancellation policies, and tax/fee requirements.
- Email/SMS and push notification credentials for the channels selected.
- Apple and Google developer accounts for store distribution; an Expo account if EAS services are selected.
- A map/directions provider configuration if embedded maps are used.

No credentials belong in the mobile bundle or repository. Provider selection and exact integration contracts are part of the connected pilot; this design milestone does not claim they exist.
