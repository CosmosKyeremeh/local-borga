// web-client/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { CartProvider } from '@/src/context/CartContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Local Borga",
  description: "Prestigious custom milling and fresh local staples by Bongr&.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* CartProvider wraps everything so cart state is accessible
            on the storefront, admin panel, and any future pages */}
        <CartProvider>
          {children}
        </CartProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}