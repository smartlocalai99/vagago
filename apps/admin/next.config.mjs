/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static: the dashboard talks to Supabase from the browser, so it can be hosted anywhere.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // Public client values (the publishable key is designed to ship to browsers; RLS protects the data).
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://rjdnsyhvemywztlngqvs.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_mg5VGqHTS1DW-_DkgdxpOQ_ZNdx3w6r',
  },
};

export default nextConfig;
