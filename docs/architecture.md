# Shared platform architecture

Status: proposal for the connected pilot. There is no backend service or database migration in the first customer UI milestone. The contracts below define intended behaviour, not working endpoints.

## Product and data ownership

The customer Expo app, Next.js admin dashboard, and separate Expo hotel app call one authenticated API. A shared database is the source of truth for publication, inventory, rates, reservations, and payment state. Clients may cache responses but cannot commit inventory, grant themselves privileges, or mark a payment successful.

`packages/domain` currently owns pure validation and sample-discovery helpers. Its indicative estimates must never become the authority for checkout. The server will reuse appropriate validation rules while independently checking identity, property access, current prices, inventory, and policy versions.

The current customer app has Explore, Hot deals, Bookings and Profile tabs, with search, property detail, booking review, payment and optional location routes. The user's screenshot guides a full-width search header with no logo/location row. Photo galleries advance automatically, support swiping and retain small thumbnail previews on cards/details; there are no visible play/pause controls. The browser remains a phone-width preview of the native components.

Database work is deferred. Search/accommodation selection and guest name/mobile/optional email live in memory only. Editing dates/guests from checkout preserves property, room and contact fields. UPI/card selection is UI only: the final payment action is disabled, no sensitive card details are collected, and no reservation is created. The Bookings status tabs therefore contain real empty states. Profile has no connected authentication.

Legacy wishlist and saved-plan records are no longer read or written by the live state provider; existing records remain untouched. Pure compatibility helpers are retained and tested, including migration from the former property category to `homestay`. The sample property's old internal ID is stable. Current property categories are cottage, homestay and villa.

The supplied logo appears on an animated splash, respecting reduced motion. An optional first-launch request uses foreground location only. The client rounds coordinates and calculates approximate straight-line distance to Vagamon for Profile. Coordinates are session-only and are not uploaded; only the prompt-seen flag is persisted. Denial, unavailable services and “Not now” do not block browsing.

Sample `compareAtRate` values support a red struck-through comparison price beside `nightlyRate`. They are illustrative amounts, not historical prices or live discounts, and cannot create a published Hot deals offer. Future real offers need their own approved terms and publication state. Exact addresses and property coordinates remain hidden in public listing responses; the later authenticated reservation response must enforce their release after confirmation.

## Roles and property boundaries

| Actor | Intended scope |
| --- | --- |
| Public visitor | Published listing content and public availability/quote discovery only |
| Customer | Own profile, quotes, reservations and support requests; confirmed-booking access to private arrival details |
| Hotel owner/manager | Only properties covered by an active membership; authorized room, rate, inventory, and reservation operations |
| Hotel staff | Explicitly assigned operational permissions such as arrivals and check-in; no automatic rate, membership, or financial authority |
| Platform admin | Onboarding, review, publication, support, and authorized financial operations with audit records |
| System worker | Narrowly scoped hold expiry, payment reconciliation, and notification processing |

Authenticate first, then authorize each resource operation on the server. A URL's `propertyId` is not proof of access. Membership changes and invitations are audited; users cannot select a privileged role during registration. The first pilot can use a small role set, with staff capabilities expanded only when their operations are implemented.

## Core records

Properties have `draft`, `in_review`, `published`, and `suspended` states. Room types belong to one property and define capacity and sellable units; physical room assignment can be separate from the booking decision. Rate plans carry inclusions and a cancellation policy, with date-specific overrides. Publication requires approved content and ready inventory/rates.

Inventory is recorded per room type and local stay date. Its available quantity is derived from sellable units minus blocks, active holds, and committed reservations. Stay dates use `YYYY-MM-DD`, checkout is exclusive, and Vagamon operations use `Asia/Kolkata`. Event timestamps use UTC. Charge amounts use integer minor currency units; guest-visible rupee values are formatting only.

Quotes retain the requested dates, guest/room counts, complete rate/tax/fee breakdown, currency, policy snapshot, inventory/rate context, and expiry. Reservations preserve the accepted quote. Payment attempts, provider events, refunds, commission entries, and audit events are separate records linked by stable identifiers.

## Proposed API surface

All paths below are versioned under `/v1`. Request and response schemas must be validated at the boundary. Public list results use bounded pagination. Private responses are not publicly cacheable.

| Endpoint | Contract |
| --- | --- |
| `GET /properties` | Return only published Vagamon listings; apply keyword, property type, dates, capacity, budget, and pagination explicitly. State when dates have not been checked. |
| `GET /properties/:id` | Return approved listing details, claim attribution, room options and public policy content. Exclude exact street address/property coordinates and private check-in/contact data. |
| `GET /offers` | Return only reviewed, published, currently valid offers with genuine price/eligibility terms. Sample comparison amounts are not offers. |
| `POST /quotes` | Validate dates and occupancy, calculate every charge on the server, and return an expiring quote. A quote does not reserve inventory. |
| `POST /reservation-holds` | Authenticate the customer, revalidate the quote, and atomically hold the complete stay. Return the hold expiry and pending reservation identifier. |
| `POST /reservations/:id/payment-session` | Create or reuse a payment attempt for the current owner, active hold, and exact server amount. Return only safe client payment-session data. |
| `GET /reservations/:id` | Return the owner's reservation state. Release exact address/directions only for an eligible confirmed booking; hotel staff require property membership and the appropriate capability. |
| `POST /reservations/:id/cancellation-requests` | Evaluate the accepted policy and create an auditable request; do not present a refund as complete before provider confirmation. |
| `POST /admin/properties` | Create a draft property; admin access required. |
| `POST /admin/properties/:id/invitations` | Invite a manager to the property with a bounded, expiring membership invitation. |
| `POST /invitations/:token/accept` | Validate expiry, recipient, and one-time use, then create the authorized membership. |
| `PUT /partner/properties/:id/room-types/:roomTypeId` | Validate capacity and property ownership; audit room configuration changes. |
| `PUT /partner/properties/:id/rates` | Validate bounded date ranges and currency/amounts; use a version precondition to prevent silent overwrites. |
| `PUT /partner/properties/:id/inventory` | Apply date-specific blocks/stock edits without reducing capacity below committed obligations. Changes use transactional checks and a version precondition. |
| `POST /partner/properties/:id/submit-review` | Submit a complete draft for platform review; does not publish it. |
| `POST /admin/properties/:id/publish` | Verify content, permissions, rate coverage, and inventory readiness before publication. |
| `GET /partner/properties/:id/reservations` | Return only the assigned property's authorized operational reservation fields. |
| `POST /webhooks/payments/:provider` | Verify the provider signature against the raw body, deduplicate event IDs, and reconcile payment and reservation state. |

### Quote and hold example

Illustrative request shape; provider-independent and not yet implemented:

```json
{
  "propertyId": "property-id",
  "roomTypeId": "room-type-id",
  "checkIn": "2026-12-04",
  "checkOut": "2026-12-06",
  "rooms": 1,
  "guests": 2,
  "currency": "INR"
}
```

A successful quote returns `quoteId`, `expiresAt`, accepted inputs, line items in minor units, `totalMinor`, `currency`, and a policy snapshot. The subsequent hold request sends `quoteId` and an `Idempotency-Key`; it does not supply a trusted payable amount. If price or inventory has changed, the API returns a conflict with an actionable reason and requires a new quote.

Mutation idempotency keys are bound to the authenticated actor, operation, and normalized payload. Replaying the same request returns the original result; reusing the key with a different payload fails. Stable error codes distinguish invalid input, expired quote, insufficient inventory, authorization failure, rate change, and payment pending. Clients must not infer a successful operation from a timeout.

## Transaction and payment sequence

1. The server validates an unexpired quote and locks the relevant room/date inventory rows in a stable order.
2. It checks the full date range and atomically creates the hold plus inventory allocations. Any unavailable night rolls back the entire operation.
3. The server creates a payment session for that reservation and quoted amount. A client redirect or SDK callback is only a prompt to refresh status.
4. A verified provider webhook confirms payment exactly once. The server transitions a valid active hold into a confirmed reservation in a transaction and schedules a confirmation notification.
5. Expired holds are released idempotently. Delayed successful payment for an expired hold enters explicit reconciliation; the system must not silently overbook or claim success. Depending on current stock and policy, it safely recommits inventory or initiates the defined refund/manual-resolution path.
6. Cancellation and refund processing maintain separate reservation and financial states until reconciliation completes. Repeated events cannot double-refund, duplicate confirmation, or release the same stock twice.

Test simultaneous attempts for the last unit, partial date availability, duplicate/late webhooks, interrupted payment sessions, expiry races, manager stock edits during checkout, and unauthorized access to another hotel's records before admitting live bookings.

## First pilot workflow

Admin creates one property → invites its manager → manager enters rooms, rates, availability, and property content → admin reviews and publishes → customer obtains a quote → server holds inventory → payment sandbox confirms through a verified webhook → customer and hotel see the same reservation.

Keep this pilot narrow enough to test end to end. Add broader admin reports, hotel operations, commissions and notifications after the shared reservation lifecycle is reliable. Wishlist and saved-plan functionality are not part of the current product requirements.

## Unresolved external dependencies

Database/backend hosting, authentication, payment provider, email/SMS/push delivery, monitoring, and map integration have not been selected or configured. Provider evaluation must cover the required Indian merchant/payment workflow, refunds, webhook verification and retries, and the platform's commission/settlement model. Obtain real merchant configuration, listing rights, tax/fee rules, and cancellation policy decisions before live checkout.

Server secrets stay in server-managed configuration. Only documented public client configuration may enter app bundles. Environments, credentials, webhook endpoints, and test/live payment data must remain separate. Selection of a provider does not establish that an integration works; acceptance requires its implemented and tested workflow.
