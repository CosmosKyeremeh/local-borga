// web-client/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { CartProvider } from '@/src/context/CartContext';
import ServiceWorkerRegister from '@/src/components/ServiceWorkerRegister';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  // ── Core ────────────────────────────────────────────────────────────────────
  title: {
    default: 'Local Borga — Premium Ghanaian Staples & Farm Tools',
    template: '%s | Local Borga',
  },
  description:
    'Shop premium Ghanaian staples, farm tools and custom milling online. Direct from Accra, Ghana — intercontinental shipping to UK, US, Canada, Europe and beyond.',

  keywords: [
    // Brand
    'Local Borga',
    'Local Borga Ghana',

    // Product — staples
    'Ghanaian food online',
    'buy Ghanaian food UK',
    'buy Ghanaian food US',
    'Ghana food delivery',
    'Ghanaian staples online',
    'African food shop',
    'African food delivery UK',
    'gari online',
    'buy gari UK',
    'cassava flour online',
    'corn flour Ghana',
    'millet flour delivery',
    'Ghana rice online',

    // Product — farm tools
    'Ghana farm tools online',
    'African farming equipment',
    'cutlass Ghana',
    'knapsack sprayer Ghana',
    'hand tiller Ghana',

    // Custom milling
    'custom milling Ghana',
    'gari milling service',
    'cassava milling online',

    // Diaspora
    'Ghanaian diaspora food',
    'Ghana food intercontinental shipping',
    'African food diaspora UK',
    'send Ghana food abroad',
    'Ghana food Europe',
    'Ghanaian groceries online',

    // Local / geo
    'Accra food delivery',
    'food from Ghana',
    'authentic Ghanaian food',
    'West African food online',
  ],

  // ── Canonical & alternate ────────────────────────────────────────────────
  metadataBase: new URL('https://local-borga.vercel.app'),
  alternates: {
    canonical: '/',
  },

  // ── Open Graph (Facebook, WhatsApp, LinkedIn previews) ──────────────────
  openGraph: {
    type:        'website',
    url:         'https://local-borga.vercel.app',
    siteName:    'Local Borga',
    title:       'Local Borga — Premium Ghanaian Staples & Farm Tools',
    description: 'Shop authentic Ghanaian staples, farm equipment and bespoke custom milling. Intercontinental shipping direct from Accra, Ghana.',
    images: [
      {
        url:    '/local-borga-products.png',
        width:  1280,
        height: 720,
        alt:    'Local Borga — Premium Ghanaian Staples storefront',
      },
    ],
    locale: 'en_GB',
  },

  // ── Twitter / X card ─────────────────────────────────────────────────────
  twitter: {
    card:        'summary_large_image',
    title:       'Local Borga — Premium Ghanaian Staples & Farm Tools',
    description: 'Authentic Ghanaian staples and farm equipment. Custom milling. Ships worldwide from Accra.',
    images:      ['/local-borga-products.png'],
    creator:     '@localborga',
  },

  // ── PWA / browser ────────────────────────────────────────────────────────
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png',  sizes: '32x32',  type: 'image/png' },
      { url: '/icons/icon-96x96.png',  sizes: '96x96',  type: 'image/png' },
      { url: '/icons/icon-192x192.png',sizes: '192x192',type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icons/icon-96x96.png',
  },

  // ── Robots ───────────────────────────────────────────────────────────────
  robots: {
    index:               true,
    follow:              true,
    googleBot: {
      index:             true,
      follow:            true,
      'max-image-preview': 'large',
    },
  },

  // ── google-site-verification ──────────────────────────────────────────────────────────
  verification: {
   google:"M_ieMalKNja00M4uKjLzILeOOx38DIfseqizeofX3Jg" 
  },

  // ── App identity ─────────────────────────────────────────────────────────
  applicationName: 'Local Borga',
  authors: [{ name: 'Cosmos Kyeremeh', url: 'https://local-borga.vercel.app' }],
  creator: 'Cosmos Kyeremeh',
  publisher: 'Local Borga',
  category: 'shopping',
};

// ─── Viewport + PWA theme ─────────────────────────────────────────────────────

export const viewport: Viewport = {
  themeColor:        '#f59e0b',        // amber-500 — matches the brand CTA colour
  colorScheme:       'light',
  width:             'device-width',
  initialScale:      1,
  maximumScale:      5,
  userScalable:      true,
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CartProvider>
          {children}
        </CartProvider>
        <Toaster position="top-center" richColors />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}