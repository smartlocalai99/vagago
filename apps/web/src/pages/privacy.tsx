import Link from 'next/link';
import { LegalPage } from '@/components/site/legal';

export default function Privacy() {
  return <LegalPage title="Privacy policy" description="How VagaGo collects, uses and protects your information." updated="26 November 2026">
    <p>VagaGo is a booking service for stays in Vagamon, Kerala, operated by SMARTLOCAL AI LLP (“VagaGo”, “we”). This policy explains what we collect when you use the VagaGo app or website, why, and the choices you have.</p>
    <h2>What we collect</h2>
    <ul>
      <li><strong>Account details:</strong> the name and mobile number you enter when you sign up.</li>
      <li><strong>Booking details:</strong> the stay, dates, number of guests, the guest’s name, mobile number, optional email and any requests you add, and the offer applied.</li>
      <li><strong>Reviews and support messages</strong> you choose to send us.</li>
      <li><strong>A device sign-in identifier</strong> created when you first book or sign up, so your bookings stay linked to your phone or browser.</li>
    </ul>
    <p>We do not collect your location, contacts, photos or payment card details, and we do not use advertising or tracking SDKs. If you turn on Face ID, fingerprint or screen lock, it is handled entirely by your phone’s operating system; we never receive biometric data.</p>
    <h2>How we use it</h2>
    <ul>
      <li>To create and manage your bookings and show you the exact address after booking.</li>
      <li>To share your booking and contact details with the property you booked, so they can host you.</li>
      <li>To apply offers, answer support requests and publish reviews you submit (with your first name).</li>
      <li>To keep the service secure and working.</li>
    </ul>
    <h2>Who we share it with</h2>
    <p>Only the property you book, and service providers that run VagaGo for us: Supabase (database and sign-in), Vercel (website hosting) and Expo (app updates). We do not sell your data.</p>
    <h2>How long we keep it</h2>
    <p>Account details stay until you log out without a saved login or delete your account. Booking records are kept as long as needed for the property’s and our legal and accounting obligations, with your personal details removed if you delete your account.</p>
    <h2>Your choices</h2>
    <ul>
      <li>Log out or delete your account any time in the app under Profile. See <Link href="/delete-account/" className="underline">how account deletion works</Link>.</li>
      <li>Ask us for a copy of your data or to correct it through <Link href="/support/" className="underline">Contact support</Link>.</li>
    </ul>
    <h2>Children</h2>
    <p>VagaGo is not intended for children under 18, and we do not knowingly collect their data.</p>
    <h2>Changes</h2>
    <p>We will update this page if our practices change and show the new date at the top.</p>
  </LegalPage>;
}
