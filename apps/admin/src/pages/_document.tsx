import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return <Html lang="en-IN">
    <Head>
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="icon" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#073728" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="VagaGo Admin" />
      <meta name="robots" content="noindex" />
    </Head>
    <body><Main /><NextScript /></body>
  </Html>;
}
