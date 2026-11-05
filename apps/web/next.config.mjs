/** @type {import('next').NextConfig} */
const nextConfig = {
  // Public pages are pre-rendered and refreshed in the background (see revalidate in each page),
  // so visitors get cached HTML and the database sees a few reads per listing, not one per visit.
  trailingSlash: true,
  // Photos are resized to a full image and a 480px thumbnail when uploaded.
  images: { unoptimized: true },
  reactStrictMode: true,
  // Public client values (the publishable key is designed to ship to browsers; RLS protects the data).
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://rjdnsyhvemywztlngqvs.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_mg5VGqHTS1DW-_DkgdxpOQ_ZNdx3w6r',
  },
  async headers() {
    return [
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      // The dashboard is never linked from the site; keep search engines out of it too.
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};

export default nextConfig;
