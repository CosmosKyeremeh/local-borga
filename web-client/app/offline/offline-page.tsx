// web-client/app/offline/page.tsx
// Shown by the service worker when the user is offline
// and no cached version of the requested page exists.

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'You\'re Offline',
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">

      {/* Animated signal icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center">
          <span className="text-5xl">📡</span>
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-amber-200 animate-ping opacity-40" />
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-4">
        No Connection
      </p>

      <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">
        You&apos;re<br />
        <span className="text-amber-500 italic font-serif">Offline.</span>
      </h1>

      <p className="text-slate-400 font-medium max-w-sm mb-10">
        It looks like you&apos;ve lost your internet connection. Check your signal
        and try again — your cart is safe and waiting.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-amber-500 text-black font-black rounded-2xl uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-10 py-4 border-2 border-slate-200 text-slate-700 font-black rounded-2xl uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all"
        >
          Back to Store
        </Link>
      </div>

      <p className="mt-16 text-[10px] font-black uppercase tracking-[0.3em] text-slate-200">
        Local Borga · Accra, Ghana
      </p>
    </main>
  );
}