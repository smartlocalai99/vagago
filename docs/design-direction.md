# VagaGo customer app design

The latest user-supplied screenshot sets the visual direction: a clean native booking app for iOS and Android, with a full-width search field and photo-led stays. Airbnb/OYO provide familiar interaction references. The customer product is a booking journey; wishlist, Trips and saved-plan features are removed.

## Screen structure

- **Launch:** use the provided VagaGo logo in a short animated splash. Respect reduced motion and wait for essential fonts/state before revealing the interface. Keep the logo out of the Explore header.
- **Optional location:** offer foreground access after first launch, with an equally usable “Not now” path. Explain the approximate distance benefit. Profile's Location preferences subtitle shows the resulting distance label; no location row appears above Explore search.
- **Explore:** start with a clean full-width search bar, compact dates/guests and property categories. No header logo, location block, marketing hero or desktop sidebar. Use All stays, Cottages, Homestays and Villas. “Cloudline Homestay” is the public sample name; its legacy internal ID remains unchanged.
- **Listing cards:** let the property image lead. Galleries automatically advance through a short cycle, support swipe/touch navigation and retain small thumbnail previews. Remove visible play/pause buttons. Follow the image with name, capacity and a compact nightly-price comparison.
- **Sample price comparison:** show the higher illustrative amount struck through in red beside the current sample nightly price. Clearly identify preview pricing; do not imply a historical rate, live promotion or verified saving. These samples do not populate Hot deals.
- **Search:** Vagamon is the fixed destination. Edit dates, guests, keyword, property type and nightly budget; dismissing cancels unsubmitted changes. Checkout editing focuses on dates/guests, retains the selected property/accommodation and contact details, and returns to booking review.
- **Property details:** photos, practical property facts, amenities and accommodation selection. Current cottages, homestays and villas represent entire properties. A fixed price and “Book now” action lead to checkout. Keep exact address and directions hidden before a confirmed booking.
- **Review booking:** selected accommodation, dates, guests and estimated subtotal before taxes. Collect full name and Indian mobile number; email is optional. Show useful inline validation and preserve session fields when editing dates. “Continue to payment” advances without saving a plan.
- **Payment:** UPI/card choices, booking summary and honest unavailable state. Display “Online booking opens soon”; disable the final payment action and collect no card details. Do not fabricate a reservation or payment success.
- **Hot deals:** show only genuine published offers. Until they exist, use an empty state with a clear return to Explore.
- **Bookings:** Upcoming, Past and Cancelled tabs show actual empty states until reservations exist. No fabricated status cards.
- **Profile:** guest view with Bookings, Hot deals and Location preferences. Account access is not connected yet.

The four persistent tabs are **Explore · Hot deals · Bookings · Profile**. Search, property details, checkout, payment and location use native stack routes. The browser is a phone-width preview of the same React Native components, including on desktop. The future admin dashboard is a separate web product; hotel staff receive a separate mobile app.

## Visual system

| Role | Value / use |
| --- | --- |
| Accent | `#D92848` — primary actions, selected controls, red sample comparison pricing |
| Ink | `#222222` — primary text |
| Secondary text | `#717171` |
| Soft accent | `#FFF0F3` — selected/supporting surfaces |
| Divider | `#EBEBEB` |
| White | `#FFFFFF` — main canvas |
| Manrope | Regular through bold for headings, body, controls and prices |

Use compact spacing, clear separators, rounded photo cards and at least 44-point touch targets. Headings stay compact and prices remain easy to scan. Respect safe areas, device font scaling and keyboard access. Fixed checkout actions must not cover scrollable content. Automatic gallery motion pauses on interaction/backgrounding and respects reduced motion; thumbnails remain usable without animation.

## Data and implementation boundaries

The properties, photos and comparison prices are labeled samples. Estimates exclude taxes and fees, and date selection does not check availability. Exact addresses are hidden. No reviews, urgency, verified status, historical-price claims, cancellation promises or successful bookings are invented.

The active app keeps booking criteria and guest contact fields in memory. It does not load or save legacy wishlist/plan records; existing records remain untouched. Optional location coordinates are used only in the current session and are not uploaded. Only the location-prompt-seen flag is persisted.

Database/backend work is deferred at the user's request. Live checkout later requires approved property data, authenticated permissions, server-controlled inventory and quotes, final tax/fee and policy details, and a verified payment flow. Product screens explain availability simply without exposing implementation details.
