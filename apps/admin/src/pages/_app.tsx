import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Manrope } from 'next/font/google';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { SWRConfig } from 'swr';
import { AuthProvider, useAuth } from '@/lib/auth';
import { swrConfig, useProperties, type Reservation } from '@/lib/data';
import { useReservationStream } from '@/lib/realtime';
import '@/styles/globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

function NewBookingToast({ booking, onClose }: { booking: Reservation; onClose: () => void }) {
  const { data: hotels } = useProperties();
  const router = useRouter();
  const hotel = hotels?.find((item) => item.id === booking.property_id)?.name ?? 'a hotel';
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <button onClick={() => { onClose(); void router.push(`/bookings/view/?id=${booking.id}`); }}
    className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+8px)] z-50 mx-auto max-w-[456px] rounded-2xl bg-forest px-4 py-3 text-left text-white shadow-lg">
    <span className="block text-[13px] font-bold">New booking · {booking.reference}</span>
    <span className="block text-[13px] text-white/80">{booking.guest_name} booked {hotel}</span>
  </button>;
}

function Gate({ Component, pageProps }: Pick<AppProps, 'Component' | 'pageProps'>) {
  const { status } = useAuth();
  const router = useRouter();
  const [newBooking, setNewBooking] = useState<Reservation | null>(null);
  const onLogin = router.pathname === '/login';
  const clearToast = useCallback(() => setNewBooking(null), []);
  useReservationStream(status === 'signed-in', setNewBooking);

  useEffect(() => {
    if (status === 'signed-out' && !onLogin) void router.replace('/login/');
    if (status === 'signed-in' && onLogin) void router.replace('/');
  }, [status, onLogin, router]);

  if (status === 'loading' || (status === 'signed-out' && !onLogin) || (status === 'signed-in' && onLogin)) {
    return <div className="grid min-h-dvh place-items-center"><div className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent" /></div>;
  }
  return <>
    {newBooking ? <NewBookingToast booking={newBooking} onClose={clearToast} /> : null}
    <Component {...pageProps} />
  </>;
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js');
  }, []);
  return <SWRConfig value={swrConfig}>
    <Head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /></Head>
    <div className={`${manrope.variable} mx-auto min-h-dvh max-w-[480px] bg-white font-sans shadow-[0_0_0_1px_rgba(0,0,0,0.04)]`}>
      <AuthProvider><Gate Component={Component} pageProps={pageProps} /></AuthProvider>
    </div>
  </SWRConfig>;
}
