# VagaGo reference notes

Reviewed 1 November 2026. The user requested a conventional customer booking app like Airbnb and OYO. The design uses familiar search and booking steps with VagaGo branding. It does not copy competitor artwork or claim feature parity.

## Product references

| Primary source | Reference pattern | VagaGo design decision |
| --- | --- | --- |
| [Airbnb: using search filters](https://www.airbnb.com/help/article/479) | Start with destination, check-in/check-out, and guests; refine the search with filters. | Make dates and guests immediately accessible, with property type and budget in the search form. Vagamon is the fixed destination. |
| [OYO's iPhone app listing](https://apps.apple.com/us/app/oyo-hotel-booking-app-deals/id988141624) | A dedicated mobile hotel-booking product emphasizing a short path to a stay. | Use a compact stay feed, practical detail screen, accommodation selection, and persistent review action. These are VagaGo's design choices, not a claim about an exact OYO screen layout. |
| [Booking.com: how we work](https://www.booking.com/content/how_we_work.html) | Search, filters, sorting, and ranking help narrow accommodation choices. | Show the current search criteria and useful property facts. Do not imply that static sample results establish availability. |

These references support general interaction patterns. We have not conducted a comprehensive competitor usability study or verified every regional app variant. The four-tab navigation—Explore, Wishlist, Trips, Profile—is VagaGo's own information architecture.

## Applied direction

Search leads directly to a stay feed. Property photography supports comparison rather than a large destination hero. Details lead to accommodation selection and review. Wishlist entries and saved plans serve different purposes; starting a new search must not replace a saved plan. The browser keeps a phone-width app preview instead of introducing a desktop customer website.

The current implementation uses sample properties and local persistence. It cannot make reservations, take payments, confirm availability, or establish the usefulness of real hotel operations. Those require the planned admin onboarding dashboard, hotel management app, and shared booking backend.

## Place and photography

[Kerala Tourism's Vagamon overview](https://www.keralatourism.org/campaigns/kerala365/vagamon-hills-idukki) describes the destination's hills, meadows, and pine landscapes. This supports local visual context, not claims about any sample property, operator, rate, or available activity.

Record the origin and usage basis of bundled images. Label stock photography as representative and replace it with authorized hotel photography before publishing real listings. Avoid fabricated ratings, review counts, discounts, booking urgency, or policy claims. See [photography credits](asset-credits.md).
