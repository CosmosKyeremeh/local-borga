'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingCart, Menu } from 'lucide-react';

export default function Navbar({ cartCount, onOpenCart }: { cartCount: number, onOpenCart: () => void }) {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="h-10 w-auto" />
          <span className="font-black uppercase tracking-tighter text-xl text-slate-900">Local Borga</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {['Catalog', 'Tracking', 'Heritage'].map((item) => (
            <Link 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-amber-500 transition-colors"
            >
              {item}
            </Link>
          ))}
          <Link href="/admin" className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-100 px-4 py-2 rounded-full">Admin</Link>
        </div>

        <button onClick={onOpenCart} className="relative p-2 hover:bg-slate-50 rounded-full transition-colors">
          <ShoppingCart size={24} className="text-slate-900" />
          {cartCount > 0 && (
            <span className="absolute top-0 right-0 bg-amber-500 text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </motion.nav>
  );
}