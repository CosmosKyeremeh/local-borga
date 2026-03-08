'use client';

// web-client/app/page.tsx

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Settings, Globe, Loader2,
  X, Plus, Minus, Trash2, Search, ShieldCheck, ShoppingCart, Menu
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { supabaseBrowser } from '@/src/lib/supabase/browser';
import { useCart } from '@/src/context/CartContext';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  is_premium?: boolean;
}

export default function Home() {
  const { cart, addToCart, removeFromCart, updateQuantity, totalAmount, cartCount } = useCart();

  const [products, setProducts]                   = useState<Product[]>([]);
  const [isLoading, setIsLoading]                 = useState(true);
  const [error, setError]                         = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen]               = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen]   = useState(false);
  const [searchQuery, setSearchQuery]             = useState('');
  const [selectedCategory, setSelectedCategory]   = useState('All');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customForm, setCustomForm]               = useState({ item: 'Gari', weight: 5, milling: 'Medium Grain' });
  const [trackingId, setTrackingId]               = useState('');
  const [trackedOrder, setTrackedOrder]           = useState<any>(null);
  const [isTrackLoading, setIsTrackLoading]       = useState(false);

  // Supabase Realtime
  useEffect(() => {
    const channel = supabaseBrowser
      .channel('order-status-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const updated = payload.new as { item_name: string; status: string };
        toast.success(
          `Production Update: ${updated.item_name} is now ${String(updated.status).toUpperCase()}!`,
          { duration: 6000 }
        );
      })
      .subscribe();
    return () => { supabaseBrowser.removeChannel(channel); };
  }, []);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts)
      .catch(() => setError('Failed to load products'))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedCategory === 'All' || p.category === selectedCategory)
  );

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id.toString(), name: product.name, price: product.price,
      image: product.image, category: product.category,
      description: product.description, type: 'SHELF', quantity: 1,
    });
    toast.success(`${product.name} added`, {
      action: { label: 'View Cart', onClick: () => setIsCartOpen(true) },
    });
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setIsTrackLoading(true);
    try {
      const res = await fetch(`/api/orders/${trackingId.trim()}`);
      if (!res.ok) throw new Error('Not Found');
      setTrackedOrder(await res.json());
      toast.success('Order Located');
    } catch { toast.error('Invalid Tracking ID'); setTrackedOrder(null); }
    finally { setIsTrackLoading(false); }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderData = {
      itemName: customForm.item, millingStyle: customForm.milling,
      weightKg: customForm.weight, totalPrice: parseFloat((15.00 * customForm.weight / 5).toFixed(2)),
    };
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) throw new Error('Order failed');
      const result = await res.json();
      addToCart({
        id: result.order.id.toString(), name: `Custom ${orderData.itemName}`,
        price: orderData.totalPrice, image: '/images/custom-milling.jpg',
        category: 'CUSTOM', type: 'CUSTOM_MILLING', quantity: 1,
        config: { millingStyle: orderData.millingStyle, weightKg: orderData.weightKg },
      });
      setIsCustomModalOpen(false);
      toast.info('Production Started!', {
        description: `Tracking ID: ${result.order.id}`,
        action: { label: 'View Cart', onClick: () => setIsCartOpen(true) },
      });
    } catch { toast.error('Order Failed. Please try again.'); }
  };

  // Fix 3: Checkout handler
  const handleCheckout = () => {
    if (cart.length === 0) return;
    toast.info('Checkout coming soon!', {
      description: 'Payment integration is in progress. Your cart is saved.',
    });
  };

  return (
    <main className="bg-white min-h-screen">

      {/* ── NAVBAR ── */}
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="Local Borga logo" width={40} height={40} className="rounded-sm object-contain" />
            <span className="font-black uppercase tracking-tighter text-xl text-slate-900">Local Borga</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {['catalog', 'tracking', 'heritage'].map(s => (
              <a key={s} href={`#${s}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-amber-500 transition-colors">{s}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
              className="relative p-2 hover:bg-slate-50 rounded-full transition-colors"
            >
              <ShoppingCart size={24} className="text-slate-900" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              className="md:hidden p-2"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-slate-100 mt-4"
            >
              <div className="py-4 flex flex-col gap-4">
                {['catalog', 'tracking', 'heritage'].map(s => (
                  <a key={s} href={`#${s}`} onClick={() => setIsMobileMenuOpen(false)}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
                  >{s}</a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-16">

        {/* ── HERO ── */}
        <section className="mb-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-6">Direct from Accra, Ghana</p>
            <h1 className="text-7xl md:text-9xl font-black leading-none uppercase tracking-tighter text-slate-900 mb-8">
              Local<br /><span className="text-amber-500 italic font-serif">Borga.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl font-medium">Premium Ghanaian staples and precision custom milling. Intercontinental shipping from the source.</p>
            <div className="flex flex-wrap gap-4 mt-10">
              <a href="#catalog" className="bg-slate-900 text-white font-black py-4 px-10 rounded-2xl uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all">🛒 Start Fresh Shopping</a>
              <button onClick={() => setIsCustomModalOpen(true)} className="border-2 border-slate-900 text-slate-900 font-black py-4 px-10 rounded-2xl uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">⚙️ Build Custom Order</button>
            </div>
          </motion.div>
        </section>

        {/* ── SEARCH ── */}
        <section className="mb-16">
          <div className="relative max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input type="text" placeholder="Search staples, flours, preserves..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl border-none outline-none text-slate-900 font-medium placeholder:text-slate-300"
            />
          </div>
        </section>

        {/* ── TRACKING ── Fix 2: form stacks on mobile, button no longer overflows */}
        <section id="tracking" className="mb-24">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white"
          >
            <div className="flex flex-col gap-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-2">Live Production</p>
                <h2 className="text-3xl font-black uppercase tracking-tight">Track Your Order</h2>
                <p className="text-slate-400 mt-2 font-medium">Enter your tracking ID to see real-time production status.</p>
              </div>
              {/* Fix 2: flex-col on mobile, flex-row on sm+ — button is always full-width on mobile */}
              <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-3 w-full">
                <input
                  type="text"
                  placeholder="Tracking ID..."
                  value={trackingId}
                  onChange={e => setTrackingId(e.target.value)}
                  className="flex-grow px-6 py-4 bg-white/10 rounded-2xl border border-white/10 text-white placeholder:text-slate-500 font-mono outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isTrackLoading}
                  className="sm:shrink-0 px-10 py-4 bg-amber-500 text-black font-black rounded-2xl uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
                >
                  {isTrackLoading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Track'}
                </button>
              </form>
            </div>
            <AnimatePresence>
              {trackedOrder && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6"
                >
                  {[
                    { label: 'Order ID', value: `#${trackedOrder.id}` },
                    { label: 'Item', value: trackedOrder.itemName },
                    { label: 'Status', value: trackedOrder.status?.toUpperCase() },
                    { label: 'Weight', value: trackedOrder.weightKg ? `${trackedOrder.weightKg}kg` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-1">{label}</p>
                      <p className="font-black text-lg">{value}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* ── CUSTOM MILLING ── */}
        <section className="mb-24">
          <div className="flex flex-col md:flex-row items-center gap-12 border-2 border-slate-100 rounded-[3rem] p-12 bg-slate-50/30">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-4 text-amber-600"><Settings size={32} /><h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Tailored Production</h2></div>
              <p className="text-slate-500 max-w-md font-medium">Have your staples milled to your exact texture and weight. Direct from the source to your doorstep.</p>
            </div>
            <button onClick={() => setIsCustomModalOpen(true)} className="bg-amber-500 hover:bg-slate-900 hover:text-white text-black font-black py-6 px-12 rounded-2xl uppercase tracking-widest transition-all whitespace-nowrap">Start Custom Milling</button>
          </div>
        </section>

        {/* ── CATALOG ── */}
        <section id="catalog" className="mb-24">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900 underline decoration-amber-500 decoration-4 underline-offset-8">The Collection</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >{cat}</button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-32"><Loader2 size={40} className="animate-spin text-amber-500" /></div>
          ) : error ? (
            <div className="text-center py-32"><p className="text-red-400 font-bold">{error}</p></div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-32"><p className="text-slate-400 font-bold uppercase tracking-widest">No products found</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product, idx) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}>
                  <ProductCard product={product} onAddToCart={() => handleAddToCart(product)} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── HERITAGE ── Fix 1: Reimagined for mobile */}
        <section id="heritage" className="my-24 overflow-hidden rounded-[3rem] lg:rounded-[4rem]">

          {/* Mobile: full-bleed image with text overlay */}
          <div className="relative lg:hidden h-[480px]">
            <Image
              src="/images/local-borga-headquarters-interior1.jpg"
              alt="Local Borga headquarters interior"
              fill
              sizes="100vw"
              className="object-cover grayscale"
              priority={false}
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/20" />
            {/* Text pinned to bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h2 className="text-4xl font-black leading-none uppercase text-white mb-3">
                Executive <span className="text-amber-500 italic font-serif">Oversight.</span>
              </h2>
              <p className="text-slate-400 text-sm font-medium mb-5 max-w-sm">
                Perfection is an asymptote — we are forever chasing it, forever closing the gap.
              </p>
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 text-black p-2 rounded-xl"><ShieldCheck size={18} /></div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Quality Assured</p>
                  <p className="text-white text-sm font-bold">Managed by Local Borga HQ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: original two-column layout */}
          <div className="hidden lg:grid grid-cols-2 gap-0 bg-slate-900 text-white min-h-[600px]">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

            {/* Text column */}
            <motion.div
              initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="flex flex-col justify-center px-16 py-24 relative z-10"
            >
              <h2 className="text-5xl font-black leading-none uppercase mb-8">
                Executive <br /><span className="text-amber-500 italic font-serif">Oversight.</span>
              </h2>
              <p className="text-lg text-slate-400 font-medium mb-8">
                Perfection is an asymptote — we are forever chasing it, forever closing the gap. Our philosophy is rooted in an obsessive attention to detail that borders on the unreasonable.
              </p>
              <div className="flex items-center gap-4 py-6 border-y border-white/10">
                <div className="bg-amber-500 text-black p-3 rounded-xl"><ShieldCheck size={24} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Quality Assured</p>
                  <p className="font-bold">Managed by Local Borga HQ</p>
                </div>
              </div>
            </motion.div>

            {/* Image column */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="relative overflow-hidden"
            >
              <Image
                src="/images/local-borga-headquarters-interior1.jpg"
                alt="Local Borga headquarters interior"
                fill
                sizes="50vw"
                className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent" />
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="mt-24 border-t border-slate-100 pt-16 text-center">
          <Globe className="w-12 h-12 text-amber-500 mx-auto mb-6 animate-pulse" />
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">🌍 Intercontinental Staples</h3>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Direct from Accra, Ghana • Shipping Globally</p>
          <div className="mt-8">
            <Link href="/admin/login" className="text-[9px] text-slate-300 hover:text-amber-500 font-bold uppercase tracking-widest transition-colors">Staff Portal</Link>
          </div>
          <div className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] pb-8">© 2025 Local Borga Executive</div>
        </footer>
      </div>

      {/* ── CART DRAWER ── */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-8"
            >
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase">Your Order</h2>
                  {cartCount > 0 && <p className="text-xs text-slate-400 font-bold mt-0.5">{cartCount} item{cartCount > 1 ? 's' : ''}</p>}
                </div>
                <button onClick={() => setIsCartOpen(false)} aria-label="Close cart"
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                ><X size={20} /></button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center mt-20">
                    <ShoppingCart size={40} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Basket is Empty</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-grow mr-3">
                        <h4 className="font-black text-slate-900 uppercase text-sm leading-tight">{item.name}</h4>
                        {item.config?.millingStyle && (
                          <p className="text-xs text-slate-500 mt-1">{item.config.millingStyle} · {item.config.weightKg}kg</p>
                        )}
                      </div>
                      {/* Fix 3: Delete button — visible red tint */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Fix 3: Quantity controls — visible with bg */}
                      {item.type === 'SHELF' ? (
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-lg transition-colors font-bold"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="font-black text-slate-900 w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-amber-500 hover:text-black text-slate-700 rounded-lg transition-colors font-bold"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-3 py-1.5 rounded-lg">Custom Order</span>
                      )}
                      {/* Fix 3: Price — bold and clearly visible */}
                      <p className="font-black text-slate-900 text-base">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-5 border-t mt-5 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Order Total</span>
                  <span className="text-3xl font-black text-slate-900">${totalAmount.toFixed(2)}</span>
                </div>
                {/* Fix 3: Checkout button with onClick handler */}
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Secure Checkout
                </button>
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">🔒 Encrypted & Secure</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CUSTOM MILLING MODAL ── */}
      <AnimatePresence>
        {isCustomModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsCustomModalOpen(false)}
            />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] overflow-hidden"
            >
              <div className="bg-amber-500 p-8 text-black flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Production Room</p>
                  <h2 className="text-xl font-black uppercase tracking-tight">Custom Milling Request</h2>
                </div>
                <button onClick={() => setIsCustomModalOpen(false)} aria-label="Close custom milling modal">
                  <X />
                </button>
              </div>
              <form onSubmit={handleCustomSubmit} className="p-10 space-y-8">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Staple Type</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={customForm.item} onChange={e => setCustomForm({ ...customForm, item: e.target.value })}>
                    <option>Gari</option><option>Cassava Flour</option><option>Corn Flour</option><option>Millet Flour</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Milling Style</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={customForm.milling} onChange={e => setCustomForm({ ...customForm, milling: e.target.value })}>
                    <option>Fine Grain</option><option>Medium Grain</option><option>Coarse Grain</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">
                    Volume: {customForm.weight}kg — <span className="text-slate-700">${(15.00 * customForm.weight / 5).toFixed(2)}</span>
                  </label>
                  <input type="range" min="5" max="50" step="5" value={customForm.weight} className="w-full accent-amber-500" onChange={e => setCustomForm({ ...customForm, weight: parseInt(e.target.value) })} />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1"><span>5kg</span><span>50kg</span></div>
                </div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-500 hover:text-black transition-all uppercase tracking-widest">Initialize Batch</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: () => void }) {
  return (
    <div className="group border border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white flex flex-col relative">
      {product.is_premium && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-amber-500 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">Limited Edition</span>
        </div>
      )}
      <div className="h-64 bg-slate-50 relative overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>
      <div className="p-8 flex flex-col flex-grow">
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-2">{product.category}</span>
        <h3 className="font-black text-slate-900 uppercase text-lg leading-tight">{product.name}</h3>
        <p className="text-slate-500 text-xs mt-3 mb-6 font-medium line-clamp-2">{product.description}</p>
        <div className="mt-auto pt-6 border-t flex items-center justify-between">
          <span className="text-2xl font-black text-slate-900">${product.price.toFixed(2)}</span>
          <button
            onClick={onAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className="p-3 bg-slate-900 text-white rounded-xl hover:bg-amber-500 hover:text-black transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}