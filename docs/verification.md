# Customer booking app — verification

Checked 1 November 2026. This record covers the native customer interface with Explore, Hot deals, Bookings, and Profile. Listings and prices are illustrative; this is not a live booking service.

## Automated checks

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: 25 tests passed (11 domain, 14 legacy persistence-record tests).
- `npm run export`: iOS and Android Hermes bundles and the web bundle exported successfully. These are JavaScript/assets, not signed store binaries.
- `npx expo-doctor`: passed 21/21 checks, including the newly added location and splash packages.

Tests cover strict calendar dates, Kolkata date boundaries, reversed/past/overlong stays, guest/budget bounds, combined preview filters, estimate limitations, accommodation ownership/capacity, and legacy record compatibility. Legacy records migrate the old cabin category to homestay. The current interface does not expose Wishlist or saved plans; checkout information stays in memory for the current session.

## Interface and browser checks

Chromium through Playwright, using the actual Expo components rendered by React Native Web:

- Reviewed phone layouts at 390×844 and 320×740. Desktop preview uses the same app in a 480-pixel frame.
- Home uses a full-width search bar, icon categories, large property images, and four bottom tabs. No separate filter button, header logo, or header location row remains.
- Categories include Homestays instead of Cabins. Property filtering and ascending/descending sample price ordering work.
- Search supports names, dates, guests, property type, and budget. Booking edits show only dates and guests and retain the selected property, accommodation, and guest details.
- Final 320-pixel checks confirmed Homestays and the keyword `homestay` each return Cloudline Homestay; resetting restores all three stays. Home, Search, Hot deals, and Bookings have no horizontal overflow. The fresh browser session reported zero errors and zero warnings.
- Galleries have swipe navigation, dots, and thumbnails without play/pause buttons. They advance once after four seconds; manual interaction stops automatic movement. Reduced-motion preference prevents autoplay. Gallery selection survives viewport resizing.
- Comparison prices are struck through, with red sample rates and calculated percentage labels. These illustrative comparisons do not populate Hot deals.
- Hot deals is empty until published offers are supplied. Bookings has Upcoming, Past, and Cancelled empty states without fabricated reservations.
- Property details conceal the exact address using a locked, blurred placeholder. No actual street address or coordinates are supplied to the component or its accessibility labels.
- Checkout validates name, Indian mobile number, and optional email. Editing dates/guests preserves contact and room selection and recalculates the sample subtotal.
- UPI/card selection works in the payment preview. Payment submission remains disabled; no money is collected and no booking is confirmed.
- First-launch location rationale, skip, persisted prompt choice, and a browser location fixture were checked. Only the prompt-seen marker is persisted; coordinates stay in memory.
- Checkout, payment, gallery, and Profile were checked at 320 pixels without horizontal overflow. The calendar month heading fits the narrow layout.

## Native iOS checks

Launched Expo Go 57.0.9 on the iPhone 17 Pro Max simulator, iOS 26.3. Checked the native home, search modal, property detail, bundled images, fonts, safe areas, bottom navigation, and fixed booking footer. The opening logo uses a 650 ms animation with a reduced-motion alternative.

Native location interaction checks passed:

- First launch → Not now → Explore.
- Profile → location preferences → system Don't Allow → explanation and Continue to stays.
- Opening iOS location settings from the app.
- Allow Once with simulated Kochi coordinates → approximate distance of 75 km from Vagamon displayed in Profile.

The Expo Go floating developer button was disabled for the clean simulator preview. A clean Metro cache and Expo Go restart resolved development-session native-module/context errors. Final home capture has no developer overlay.

For a local simulator preview:

```sh
cd apps/customer
NODE_OPTIONS=--dns-result-order=ipv4first npx expo start --localhost --clear
```

Open the printed `exp://` address in Expo Go. Use the normal LAN launch for a physical phone. The native splash plugin configuration still needs verification in a standalone build; Expo Go is not a signed VagaGo binary.

## Evidence

Local screenshots are ignored artifacts under `output/playwright/`:

- `reference-ios-home.png` — final native home.
- `reference-home-390.png`, `reference-home-320.png` — reference-based browser layouts.
- `booking-gallery-320.png`, `booking-gallery-390.png`, `booking-hidden-location-390.png`.
- `checkout-validation-390.png`, `payment-390.png`, `payment-320.png`.
- `location-native-first-launch.png`, `location-native-denied.png`, `location-native-settings.png`, `location-native-granted.png`.
- `profile-location-320.png`.

Older scenic, Wishlist, and saved-plan screenshots are historical artifacts and do not represent the current interface.

## Remaining boundaries

- Android bundles export; no Android emulator or physical-device run has been performed.
- Physical iPhone, larger accessibility text, VoiceOver/TalkBack, full native checkout automation, and network-failure scenarios remain before release.
- Photos, amenities, and rates are samples. Date selection does not check live availability.
- Backend, accounts, inventory, real offers, payments, notifications, admin dashboard, hotel management app, and store distribution remain future milestones.
- The initial dependency audit reported 29 entries, including five high-severity entries across transitive Router URL-decoding and Expo CLI/Zod chains. This is a historical audit, not a fresh clean-audit claim. Re-audit compatible upstream versions before public distribution; avoid incompatible `npm audit fix --force` changes. Advisory: https://github.com/advisories/GHSA-qr28-fpjm-wq7f.
- Node prints an ESM inference warning for the legacy JavaScript persistence helper during tests; tests pass.
