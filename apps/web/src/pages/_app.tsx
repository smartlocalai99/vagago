import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Manrope } from 'next/font/google';
import '@/styles/globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
// The dashboard and its Supabase session only load on /admin pages.
const AdminApp = dynamic(() => import('@/components/admin/admin-app'), { ssr: false });

export default function App({ Component, pageProps, router }: AppProps) {
  const admin = router.pathname.startsWith('/admin');
  return <div className={`${manrope.variable} font-sans`}>
    <Head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /></Head>
    {admin ? <AdminApp Component={Component} pageProps={pageProps} /> : <Component {...pageProps} />}
  </div>;
}
