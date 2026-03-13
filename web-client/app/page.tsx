'use client';

// web-client/app/page.tsx

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Settings, Globe, Loader2, X, Plus, Minus, Trash2,
  Search, ShieldCheck, ShoppingCart, Menu, CheckCircle,
  Printer, ArrowLeft, Tractor,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import { supabaseBrowser } from '@/src/lib/supabase/browser';
import { useCart } from '@/src/context/CartContext';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  is_premium?: boolean;
  stock_quantity?: number;
}

interface TrackedOrder {
  id: number;
  itemName: string;
  status: string;
  weightKg?: number;
  millingStyle?: string;
}

interface CompletedOrder {
  id: number;
  itemName: string;
  totalPrice: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: { address: string; city: string; country: string };
  cartItems: Array<{ name: string; quantity: number; price: number }>;
  orderType: string;
  millingStyle?: string;
  weightKg?: number;
  createdAt: string;
}

// ── Receipt Component (printable for ALL order types) ───────────────

const OrderReceipt = ({ order, ref: receiptRef }: { order: CompletedOrder; ref: React.Ref<HTMLDivElement> }) => (
  <div ref={receiptRef as React.RefObject<HTMLDivElement>}
    className="p-8 w-[380px] bg-white text-black font-mono"
    style={{ fontFamily: 'monospace' }}
  >
    {/* Header */}
    <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
      <h1 className="text-2xl font-black uppercase tracking-tighter">LOCAL BORGA</h1>
      <p className="text-[10px] uppercase tracking-widest">Premium Ghanaian Staples</p>
      <p className="text-[9px] text-gray-500 mt-1">Accra, Ghana • Shipping Globally</p>
    </div>

    {/* Order meta */}
    <div className="mb-4 space-y-1 text-xs">
      <div className="flex justify-between">
        <span className="text-gray-500">ORDER #</span>
        <span className="font-black">{order.id}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">DATE</span>
        <span>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">TYPE</span>
        <span className="uppercase">{order.orderType === 'custom_milling' ? 'Custom Milling' : 'Cart Order'}</span>
      </div>
    </div>

    {/* Customer */}
    <div className="border-t border-dashed border-gray-300 pt-3 mb-4 space-y-1 text-xs">
      <p className="text-gray-500 text-[10px] uppercase font-bold mb-2">Customer</p>
      <p className="font-bold">{order.customerName}</p>
      <p className="text-gray-600">{order.customerEmail}</p>
      {order.shippingAddress?.address && (
        <p className="text-gray-600">
          {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.country}
        </p>
      )}
    </div>

    {/* Items */}
    <div className="border-t border-dashed border-gray-300 pt-3 mb-4">
      <p className="text-gray-500 text-[10px] uppercase font-bold mb-2">Items</p>
      {order.orderType === 'custom_milling' ? (
        <div className="flex justify-between text-xs">
          <span>{order.itemName} ({order.millingStyle}, {order.weightKg}kg)</span>
          <span className="font-black">${Number(order.totalPrice).toFixed(2)}</span>
        </div>
      ) : (
        order.cartItems?.map((item, i) => (
          <div key={i} className="flex justify-between text-xs mb-1">
            <span>{item.quantity}× {item.name}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))
      )}
    </div>

    {/* Total */}
    <div className="border-t-2 border-black pt-3 mb-4">
      <div className="flex justify-between font-black text-base">
        <span>TOTAL</span>
        <span>${Number(order.totalPrice).toFixed(2)}</span>
      </div>
      <p className="text-[10px] text-gray-500 mt-1">DEMO — No real charge applied</p>
    </div>

    {/* Tracking */}
    <div className="border-t border-dashed border-gray-300 pt-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Track your order</p>
      <p className="font-black text-lg">ID: #{order.id}</p>
      <p className="text-[9px] text-gray-400 mt-1">Visit local-borga.vercel.app → Track</p>
    </div>

    <div className="mt-4 text-center text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-3">
      Thank you for choosing Local Borga 🇬🇭
    </div>
  </div>
);

// ── Main Page ────────────────────────────────────────────────────────

export default function Home() {
  const { cart, addToCart, removeFromCart, updateQuantity, totalAmount, cartCount, clearCart } = useCart();

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
  const [trackedOrder, setTrackedOrder]           = useState<TrackedOrder | null>(null);
  const [isTrackLoading, setIsTrackLoading]       = useState(false);

  // Auth
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);

  // Checkout
  const [isCheckoutOpen, setIsCheckoutOpen]       = useState(false);
  const [checkoutStep, setCheckoutStep]           = useState<'details' | 'payment' | 'success'>('details');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [paymentLoading, setPaymentLoading]       = useState(false);
  const [completedOrder, setCompletedOrder]       = useState<CompletedOrder | null>(null);
  const [checkoutForm, setCheckoutForm]           = useState({
    name: '', email: '', phone: '', address: '', city: '', country: 'Ghana',
  });
  const [demoCardNum, setDemoCardNum] = useState('');
  const [demoExpiry, setDemoExpiry]   = useState('');
  const [demoCvv, setDemoCvv]         = useState('');

  // Receipt printing
  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrintReceipt = useReactToPrint({ contentRef: receiptRef });

  // ── Auth session ─────────────────────────────────────────────────
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setCurrentUser(u);
      if (u) prefillCheckout(u);
    });
    const { data: listener } = supabaseBrowser.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setCurrentUser(u);
      if (u) prefillCheckout(u);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const prefillCheckout = (u: SupabaseUser) => {
    setCheckoutForm(prev => ({
      ...prev,
      name:  u.user_metadata?.full_name ?? prev.name,
      email: u.email ?? prev.email,
    }));
  };

  // ── Realtime order status toast ──────────────────────────────────
  useEffect(() => {
    const channel = supabaseBrowser
      .channel('order-status-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const updated = payload.new as { item_name: string; status: string };
        toast.success(`Production Update: ${updated.item_name} is now ${String(updated.status).toUpperCase()}!`, { duration: 6000 });
      })
      .subscribe();
    return () => { supabaseBrowser.removeChannel(channel); };
  }, []);

  // ── Products ─────────────────────────────────────────────────────
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

  // ── Add to cart ──────────────────────────────────────────────────
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

  // ── Track order ──────────────────────────────────────────────────
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

  // ── Custom milling submit ────────────────────────────────────────
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

  // ── Checkout: step 1 → details ───────────────────────────────────
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutStep('details');
    setCompletedOrder(null);
    setDemoCardNum(''); setDemoExpiry(''); setDemoCvv('');
    setIsCheckoutOpen(true);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.address) {
      toast.error('Name, email and address are required');
      return;
    }
    setCheckoutStep('payment');
  };

  // ── Checkout: step 2 → payment ───────────────────────────────────
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoCardNum || !demoExpiry || !demoCvv) {
      toast.error('Fill in all payment fields');
      return;
    }
    setPaymentLoading(true);
    await new Promise(r => setTimeout(r, 2000)); // simulate processing
    try {
      const payload = {
        orderType:       'shelf',
        itemName:        `Cart Order (${cart.length} item${cart.length > 1 ? 's' : ''})`,
        totalPrice:      totalAmount,
        cartItems:       cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        customerName:    checkoutForm.name,
        customerEmail:   checkoutForm.email,
        customerPhone:   checkoutForm.phone || null,
        shippingAddress: { address: checkoutForm.address, city: checkoutForm.city, country: checkoutForm.country },
        userId:          currentUser?.id ?? null,
      };
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Order failed');
      const result = await res.json();
      const placed: CompletedOrder = {
        id:              result.order.id,
        itemName:        payload.itemName,
        totalPrice:      totalAmount,
        customerName:    checkoutForm.name,
        customerEmail:   checkoutForm.email,
        shippingAddress: { address: checkoutForm.address, city: checkoutForm.city, country: checkoutForm.country },
        cartItems:       payload.cartItems,
        orderType:       'shelf',
        createdAt:       new Date().toISOString(),
      };
      setCompletedOrder(placed);
      setCheckoutStep('success');
      clearCart();
    } catch {
      toast.error('Order failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────
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
            <Link href="/farm-tools"
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-500 transition-colors">
              <Tractor size={12} /> Farm Tools
            </Link>
            {currentUser ? (
              <Link href="/account" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 hover:text-amber-400 transition-colors">
                <span className="w-5 h-5 bg-amber-500 text-black rounded-full flex items-center justify-center text-[8px] font-black">
                  {(currentUser.user_metadata?.full_name ?? currentUser.email ?? 'U')[0].toUpperCase()}
                </span>
                Account
              </Link>
            ) : (
              <Link href="/auth" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-amber-500 transition-colors">Sign In</Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsCartOpen(true)}
              aria-label={`Open cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
              className="relative p-2 hover:bg-slate-50 rounded-full transition-colors"
            >
              <ShoppingCart size={24} className="text-slate-900" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">{cartCount}</span>
              )}
            </button>
            <button className="md:hidden p-2" aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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
                  <a key={s} href={`#${s}`} onClick={() => setIsMobileMenuOpen(false)} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{s}</a>
                ))}
                <Link href="/farm-tools" onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-green-600">
                  <Tractor size={12} /> Farm Tools
                </Link>
                {currentUser
                  ? <Link href="/account" className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">My Account</Link>
                  : <Link href="/auth" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sign In</Link>
                }
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
              <a href="#catalog" className="bg-slate-900 text-white font-black py-4 px-10 rounded-2xl uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all">🛒 Start Shopping</a>
              <button onClick={() => setIsCustomModalOpen(true)} className="border-2 border-slate-900 text-slate-900 font-black py-4 px-10 rounded-2xl uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">⚙️ Custom Milling</button>
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

        {/* ── TRACKING ── */}
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
              <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-3 w-full">
                <input type="text" placeholder="Tracking ID..." value={trackingId} onChange={e => setTrackingId(e.target.value)}
                  className="flex-grow px-6 py-4 bg-white/10 rounded-2xl border border-white/10 text-white placeholder:text-slate-500 font-mono outline-none focus:border-amber-500 transition-colors"
                />
                <button type="submit" disabled={isTrackLoading} className="sm:shrink-0 px-10 py-4 bg-amber-500 text-black font-black rounded-2xl uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50">
                  {isTrackLoading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Track'}
                </button>
              </form>
            </div>
            <AnimatePresence>
              {trackedOrder && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
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

        {/* ── CUSTOM MILLING BANNER ── */}
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
            <div className="flex justify-center py-32"><Loader2 size={40} className="animate-spin text-amber-500" /></div>
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

        {/* ── HERITAGE ── mobile: image overlay / desktop: two-col ── */}
        <section id="heritage" className="my-24 overflow-hidden rounded-[3rem] lg:rounded-[4rem]">
          {/* Mobile */}
          <div className="relative lg:hidden h-[480px]">
            <Image src="/images/local-borga-headquarters-interior1.jpg" alt="Local Borga HQ" fill sizes="100vw" className="object-cover grayscale" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/20" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h2 className="text-4xl font-black leading-none uppercase text-white mb-3">Executive <span className="text-amber-500 italic font-serif">Oversight.</span></h2>
              <p className="text-slate-400 text-sm font-medium mb-5 max-w-sm">Perfection is an asymptote — we are forever chasing it, forever closing the gap.</p>
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 text-black p-2 rounded-xl"><ShieldCheck size={18} /></div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Quality Assured</p>
                  <p className="text-white text-sm font-bold">Managed by Local Borga HQ</p>
                </div>
              </div>
            </div>
          </div>
          {/* Desktop */}
          <div className="hidden lg:grid grid-cols-2 bg-slate-900 text-white min-h-[600px]">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="flex flex-col justify-center px-16 py-24"
            >
              <h2 className="text-5xl font-black leading-none uppercase mb-8">Executive <br /><span className="text-amber-500 italic font-serif">Oversight.</span></h2>
              <p className="text-lg text-slate-400 font-medium mb-8">Perfection is an asymptote — we are forever chasing it, forever closing the gap. Our philosophy is rooted in an obsessive attention to detail that borders on the unreasonable.</p>
              <div className="flex items-center gap-4 py-6 border-y border-white/10">
                <div className="bg-amber-500 text-black p-3 rounded-xl"><ShieldCheck size={24} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Quality Assured</p>
                  <p className="font-bold">Managed by Local Borga HQ</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative overflow-hidden">
              <Image src="/images/local-borga-headquarters-interior1.jpg" alt="Local Borga HQ" fill sizes="50vw" className="object-cover grayscale hover:grayscale-0 transition-all duration-700" />
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

      {/* ══════════════ CART DRAWER ══════════════ */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-8"
            >
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase">Your Order</h2>
                  {cartCount > 0 && <p className="text-xs text-slate-400 font-bold mt-0.5">{cartCount} item{cartCount > 1 ? 's' : ''}</p>}
                </div>
                <button onClick={() => setIsCartOpen(false)} aria-label="Close cart" className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
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
                        {item.config?.millingStyle && <p className="text-xs text-slate-500 mt-1">{item.config.millingStyle} · {item.config.weightKg}kg</p>}
                      </div>
                      <button onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-colors shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      {item.type === 'SHELF' ? (
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name}`}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-lg transition-colors">
                            <Minus size={13} />
                          </button>
                          <span className="font-black text-slate-900 w-8 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-amber-500 hover:text-black text-slate-700 rounded-lg transition-colors">
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-3 py-1.5 rounded-lg">Custom Order</span>
                      )}
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
                <button onClick={handleCheckout} disabled={cart.length === 0}
                  className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed">
                  Secure Checkout
                </button>
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">🔒 Encrypted & Secure</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════ CHECKOUT MODAL ══════════════ */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => checkoutStep !== 'success' && setIsCheckoutOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="relative w-full sm:max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden max-h-[95vh] flex flex-col"
            >

              {/* ── STEP 1: Details ── */}
              {checkoutStep === 'details' && (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight">Checkout</h2>
                      <p className="text-xs text-slate-400 mt-0.5">{cartCount} item{cartCount > 1 ? 's' : ''} · ${totalAmount.toFixed(2)}</p>
                    </div>
                    <button onClick={() => setIsCheckoutOpen(false)} aria-label="Close checkout" className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
                  </div>
                  <div className="overflow-y-auto flex-grow p-6 space-y-4">
                    {currentUser ? (
                      <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-[9px] font-black">{(currentUser.user_metadata?.full_name ?? currentUser.email ?? 'U')[0].toUpperCase()}</span>
                        </div>
                        <p className="text-xs text-green-800 font-bold">Signed in as {currentUser.email}</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-medium">Have an account? Details will be prefilled.</p>
                        <Link href="/auth?redirect=/" className="text-[10px] font-black uppercase tracking-widest text-amber-500 ml-4">Sign In →</Link>
                      </div>
                    )}
                    {/* Cart summary */}
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-slate-700 font-bold">{item.quantity}× {item.name}</span>
                          <span className="font-black">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-base font-black pt-2 border-t border-slate-200">
                        <span>Total</span><span className="text-amber-500">${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    <form id="details-form" onSubmit={handleDetailsSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Full Name *</label>
                          <input type="text" required value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})}
                            placeholder="Kwame Asante"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-medium text-slate-900 placeholder:text-slate-300"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Email *</label>
                          <input type="email" required value={checkoutForm.email} onChange={e => setCheckoutForm({...checkoutForm, email: e.target.value})}
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-medium text-slate-900 placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Phone</label>
                        <input type="tel" value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                          placeholder="+233 XX XXX XXXX"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-medium text-slate-900 placeholder:text-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Street Address *</label>
                        <input type="text" required value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})}
                          placeholder="123 Liberation Rd"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-medium text-slate-900 placeholder:text-slate-300"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">City</label>
                          <input type="text" value={checkoutForm.city} onChange={e => setCheckoutForm({...checkoutForm, city: e.target.value})}
                            placeholder="Accra"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-medium text-slate-900 placeholder:text-slate-300"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Country</label>
                          <select aria-label="Country" value={checkoutForm.country} onChange={e => setCheckoutForm({...checkoutForm, country: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-medium text-slate-900"
                          >
                            <option>Ghana</option><option>United Kingdom</option><option>United States</option>
                            <option>Canada</option><option>Germany</option><option>Netherlands</option><option>Other</option>
                          </select>
                        </div>
                      </div>
                    </form>
                  </div>
                  <div className="p-6 border-t border-slate-100 shrink-0">
                    <button type="submit" form="details-form"
                      className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest">
                      Continue to Payment →
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 2: Payment ── */}
              {checkoutStep === 'payment' && (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setCheckoutStep('details')} aria-label="Back to details" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <ArrowLeft size={16} />
                      </button>
                      <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Payment</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Demo — no real charge</p>
                      </div>
                    </div>
                    <button onClick={() => setIsCheckoutOpen(false)} aria-label="Close checkout" className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
                  </div>
                  <div className="overflow-y-auto flex-grow p-6 space-y-5">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Order Total</p>
                        <p className="text-2xl font-black text-slate-900">${totalAmount.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ship to</p>
                        <p className="text-sm font-bold text-slate-700">{checkoutForm.city || checkoutForm.country}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                      <span className="text-blue-500 text-lg shrink-0">ℹ️</span>
                      <div>
                        <p className="text-xs font-black text-blue-800 uppercase tracking-wide mb-0.5">Demo Payment</p>
                        <p className="text-xs text-blue-600">Simulated payment — no real card charged. Use any values.</p>
                      </div>
                    </div>
                    <form id="payment-form" onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Card Number</label>
                        <input type="text" value={demoCardNum}
                          onChange={e => setDemoCardNum(e.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim())}
                          placeholder="4242 4242 4242 4242" maxLength={19} required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-mono text-slate-900 placeholder:text-slate-300"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Expiry</label>
                          <input type="text" value={demoExpiry}
                            onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,4); setDemoExpiry(v.length>=3?`${v.slice(0,2)}/${v.slice(2)}`:v); }}
                            placeholder="MM/YY" maxLength={5} required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-mono text-slate-900 placeholder:text-slate-300"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">CVV</label>
                          <input type="text" value={demoCvv}
                            onChange={e => setDemoCvv(e.target.value.replace(/\D/g,'').slice(0,3))}
                            placeholder="123" maxLength={3} required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-mono text-slate-900 placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        {['VISA','MC','AMEX'].map(c => <span key={c} className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{c}</span>)}
                        <span className="ml-auto text-[10px] text-green-500 font-bold">🔒 SSL</span>
                      </div>
                    </form>
                  </div>
                  <div className="p-6 border-t border-slate-100 shrink-0">
                    <button type="submit" form="payment-form" disabled={paymentLoading}
                      className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : `Pay $${totalAmount.toFixed(2)}`}
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 3: Success + Receipt ── */}
              {checkoutStep === 'success' && completedOrder && (
                <div className="p-8 overflow-y-auto">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Order Placed!</h2>
                    <p className="text-slate-400 mt-1 font-medium">Tracking ID: <span className="font-black text-amber-500">#{completedOrder.id}</span></p>
                  </div>

                  {/* Receipt preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 text-xs space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Order Summary</p>
                    {completedOrder.cartItems?.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-slate-600">{item.quantity}× {item.name}</span>
                        <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-black pt-2 border-t border-slate-200">
                      <span>Total</span><span>${completedOrder.totalPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-slate-500 pt-1">Ship to: {completedOrder.shippingAddress.address}, {completedOrder.shippingAddress.city}</p>
                  </div>

                  {/* Print receipt button */}
                  <button onClick={() => handlePrintReceipt()}
                    className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-2 mb-3"
                  >
                    <Printer size={16} /> Print Receipt
                  </button>

                  {!currentUser && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3">
                      <p className="text-sm font-black text-slate-900 mb-1">Save details for next time?</p>
                      <p className="text-xs text-slate-500 mb-3">Create a free account to track all orders in one place.</p>
                      <Link href="/auth" onClick={() => setIsCheckoutOpen(false)}
                        className="inline-block px-5 py-2 bg-amber-500 text-black font-black rounded-xl uppercase text-xs tracking-widest hover:bg-amber-400 transition-all">
                        Create Account →
                      </Link>
                    </div>
                  )}

                  <button onClick={() => setIsCheckoutOpen(false)}
                    className="w-full py-4 border-2 border-slate-200 text-slate-700 font-black rounded-2xl uppercase tracking-widest hover:border-slate-900 transition-all">
                    Back to Store
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden printable receipt */}
      <div className="hidden print:block">
        {completedOrder && <OrderReceipt order={completedOrder} ref={receiptRef} />}
      </div>

      {/* ══════════════ CUSTOM MILLING MODAL ══════════════ */}
      <AnimatePresence>
        {isCustomModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCustomModalOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] overflow-hidden"
            >
              <div className="bg-amber-500 p-8 text-black flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Production Room</p>
                  <h2 className="text-xl font-black uppercase tracking-tight">Custom Milling Request</h2>
                </div>
                <button onClick={() => setIsCustomModalOpen(false)} aria-label="Close custom milling modal"><X /></button>
              </div>
              <form onSubmit={handleCustomSubmit} className="p-10 space-y-8">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Staple Type</label>
                  <select aria-label="Staple type" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={customForm.item} onChange={e => setCustomForm({ ...customForm, item: e.target.value })}>
                    <option>Gari</option><option>Cassava Flour</option><option>Corn Flour</option><option>Millet Flour</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Milling Style</label>
                  <select aria-label="Milling style" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={customForm.milling} onChange={e => setCustomForm({ ...customForm, milling: e.target.value })}>
                    <option>Fine Grain</option><option>Medium Grain</option><option>Coarse Grain</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">
                    Volume: {customForm.weight}kg — <span className="text-slate-700">${(15.00 * customForm.weight / 5).toFixed(2)}</span>
                  </label>
                  <input type="range" min="5" max="50" step="5" value={customForm.weight}
                    aria-label="Volume in kilograms"
                    className="w-full accent-amber-500" onChange={e => setCustomForm({ ...customForm, weight: parseInt(e.target.value) })} />
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

// ── Product Card ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Makes the card image + name clickable to /products/[id]
// The Add button still adds directly to cart without navigating away.
// ─────────────────────────────────────────────────────────────────────────────

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: () => void }) {
  const stock      = product.stock_quantity ?? 99;
  const outOfStock = stock === 0;
  const lowStock   = stock > 0 && stock <= 5;

  return (
    <div className="group border border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white flex flex-col relative">
      {product.is_premium && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-amber-500 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">
            Limited Edition
          </span>
        </div>
      )}

      {outOfStock && (
        <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-[2rem]">
          <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full shadow-xl">
            Out of Stock
          </span>
        </div>
      )}

      {/* Clickable image → detail page */}
      <Link href={`/products/${product.id}`} className="block h-64 bg-slate-50 relative overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover transition-transform duration-700 group-hover:scale-110 ${outOfStock ? 'grayscale' : ''}`}
        />
      </Link>

      <div className="p-8 flex flex-col flex-grow">
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-2">
          {product.category}
        </span>

        {/* Clickable name → detail page */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-black text-slate-900 uppercase text-lg leading-tight hover:text-amber-500 transition-colors">
            {product.name}
          </h3>
        </Link>

        <p className="text-slate-500 text-xs mt-3 mb-4 font-medium line-clamp-2">
          {product.description}
        </p>

        {/* Stock indicator */}
        {!outOfStock && (
          <div className="mb-4">
            {lowStock ? (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-500">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Only {stock} left
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                In Stock
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-6 border-t flex items-center justify-between">
          <span className="text-2xl font-black text-slate-900">${product.price.toFixed(2)}</span>
          <button
            onClick={onAddToCart}
            disabled={outOfStock}
            aria-label={`Add ${product.name} to cart`}
            className="p-3 bg-slate-900 text-white rounded-xl hover:bg-amber-500 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900 disabled:hover:text-white"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}