import Link from 'next/link';
import { LegalPage } from '@/components/site/legal';

export default function Terms() {
  return <LegalPage title="Terms of use" description="The terms for booking stays through VagaGo." updated="26 November 2026">
    <p>These terms apply when you use the VagaGo app or website, operated by SMARTLOCAL AI LLP. By signing up or booking, you agree to them.</p>
    <h2>Bookings</h2>
    <ul>
      <li>VagaGo lets you reserve stays listed by independent properties in Vagamon. Your stay is provided by the property, which is responsible for the accommodation and its services.</li>
      <li>Prices shown are per night before taxes and fees. You pay the property at check-in; nothing is charged when you book.</li>
      <li>Give accurate guest details. The property may contact you about your arrival and may ask for ID at check-in.</li>
      <li>Follow the property’s house rules and check-in and check-out times shown on each stay.</li>
    </ul>
    <h2>Cancellations</h2>
    <p>You can cancel a confirmed booking in the app or website any time before your check-in day, unless the stay shows a different cancellation policy.</p>
    <h2>Offers</h2>
    <p>Offers apply as described in the app, one offer per booking. The first-stay offer is for a guest’s first booking. We may change or end offers at any time; a booking keeps the offer applied when it was made.</p>
    <h2>Reviews</h2>
    <p>Reviews must be honest and about a stay you completed. We may decline or remove reviews that break these rules.</p>
    <h2>Your account</h2>
    <p>Keep your phone secure. You can log out or delete your account in Profile at any time.</p>
    <h2>Liability</h2>
    <p>VagaGo is provided as is. To the extent the law allows, we are not liable for the property’s services or for indirect losses. Nothing in these terms limits rights you have under Indian consumer law.</p>
    <h2>Contact</h2>
    <p>Questions about these terms? <Link href="/support/" className="underline">Contact support</Link>.</p>
  </LegalPage>;
}
