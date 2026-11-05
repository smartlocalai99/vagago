import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { SWRConfig } from 'swr';
import { AuthProvider, useAuth } from '@/lib/auth';
import { swrConfig, useProperties, type Reservation } from '@/lib/data';
import { useReservationStream } from '@/lib/realtime';

function NewBookingToast({ booking, onClose }: { booking: Reservation; onClose: () => void }) {
  const { data: hotels } = useProperties();
  const router = useRouter();
  const hotel = hotels?.find((item) => item.id === booking.property_id)?.name ?? 'a hotel';
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <button onClick={() => { onClose(); void router.push(`/admin/bookings/view/?id=${booking.id}`); }}
    className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+8px)] z-50 mx-auto max-w-[456px] rounded-2xl bg-forest px-4 py-3 text-left text-white shadow-lg">
    <span className="block text-[13px] font-bold">New booking · {booking.reference}</span>
    <span className="block text-[13px] text-white/80">{booking.guest_name} booked {hotel}</span>
  </button>;
}

function Gate({ Component, pageProps }: Pick<AppProps, 'Component' | 'pageProps'>) {
  const { status } = useAuth();
  const router = useRouter();
  const [newBooking, setNewBooking] = useState<Reservation | null>(null);
  const onLogin = router.pathname === '/admin/login';
  const clearToast = useCallback(() => setNewBooking(null), []);
  useReservationStream(status === 'signed-in', setNewBooking);

  useEffect(() => {
    if (status === 'signed-out' && !onLogin) void router.replace('/admin/login/');
    if (status === 'signed-in' && onLogin) void router.replace('/admin/');
  }, [status, onLogin, router]);

  if (status === 'loading' || (status === 'signed-out' && !onLogin) || (status === 'signed-in' && onLogin)) {
    return <div className="grid min-h-dvh place-items-center"><div className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent" /></div>;
  }
  return <>
    {newBooking ? <NewBookingToast booking={newBooking} onClose={clearToast} /> : null}
    <Component {...pageProps} />
  </>;
}

// Everything under /admin: PIN sign-in gate, live booking alerts and the installable app shell.
// It is loaded only on admin pages and is never linked from the public site.
export default function AdminApp({ Component, pageProps }: Pick<AppProps, 'Component' | 'pageProps'>) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js', { scope: '/admin/' });
  }, []);
  return <SWRConfig value={swrConfig}>
    <Head>
      <meta name="robots" content="noindex, nofollow" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#073728" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="VagaGo Admin" />
    </Head>
    <div className="min-h-dvh bg-[#E9ECEA]">
      <div className="mx-auto min-h-dvh max-w-[480px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        <AuthProvider><Gate Component={Component} pageProps={pageProps} /></AuthProvider>
      </div>
    </div>
  </SWRConfig>;
}
