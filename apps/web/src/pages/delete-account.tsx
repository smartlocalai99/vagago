import Link from 'next/link';
import { LegalPage } from '@/components/site/legal';

export default function DeleteAccount() {
  return <LegalPage title="Delete your VagaGo account" description="How to delete your VagaGo account and what happens to your data.">
    <h2>In the app</h2>
    <ul>
      <li>Open VagaGo and go to <strong>Profile</strong>.</li>
      <li>Tap <strong>Delete account</strong> and confirm.</li>
    </ul>
    <h2>Without the app</h2>
    <p>Send a request through <Link href="/support/" className="underline">Contact support</Link> with the name and mobile number on your account, and ask us to delete it. We complete requests within 7 days.</p>
    <h2>What is deleted</h2>
    <ul>
      <li>Your name and mobile number, your reviews and your support messages.</li>
      <li>Upcoming bookings are cancelled.</li>
      <li>Past bookings stay with the property for their records, with your name, phone number, email and notes removed.</li>
    </ul>
    <p>Deletion can’t be undone.</p>
  </LegalPage>;
}
