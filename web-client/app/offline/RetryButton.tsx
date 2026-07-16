'use client';

// web-client/app/offline/RetryButton.tsx
// Split out from page.tsx because it needs an onClick handler,
// and the page itself must stay a Server Component to export `metadata`.

export function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-10 py-4 bg-amber-500 text-black font-black rounded-2xl uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
    >
      Try Again
    </button>
  );
}
