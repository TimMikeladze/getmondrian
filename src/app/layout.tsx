import { Metadata } from 'next';

import './globals.css';

import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: ``,
  description: ``,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_HOST_URL ? (
          <Script
            async={true}
            defer={true}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            src={`${process.env.NEXT_PUBLIC_UMAMI_HOST_URL}/script.js`}
          />
        ) : null}
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
