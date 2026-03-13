'use client';

// web-client/app/farm-tools/page.tsx
// Ghanaian Farm Equipment storefront — separate from the food catalog.
// Shares the same CartContext, checkout and Paystack payment flow.
// Design: dark industrial/earth — slate-950 bg, green agri accents, amber CTAs.

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { toast } from 'sonner';
import {
  ShoppingCart, Plus, Minus, Trash2, X, Search,
  Loader2, ChevronRight, Tractor, Shield, Zap, Users,
  ArrowLeft, Star, TrendingUp,
} from 'lucide-react';
import { useCart } from '@/src/context/CartContext';
import { supabaseBrowser } from '@/src/lib/supabase/browser';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FarmTool {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  is_premium?: boolean;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'All',        icon: '🌾' },
  { label: 'HAND TOOLS', icon: '⚒️' },
  { label: 'SPRAYING',   icon: '💧' },
  { label: 'IRRIGATION', icon: '🚿' },
  { label: 'MACHINERY',  icon: '⚙️' },
  { label: 'TRANSPORT',  icon: '🚜' },
  { label: 'PROTECTIVE', icon: '🛡️' },
];

// ─── Animated stat counter ────────────────────────────────────────────────────

function StatCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── 3D tilt card ─────────────────────────────────────────────────────────────

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Live viewer badge ────────────────────────────────────────────────────────

function LiveViewers() {
  const [viewers, setViewers] = useState(47);
  useEffect(() => {
    const t = setInterval(() => {
      setViewers(v => Math.max(30, v + Math.floor(Math.random() * 7) - 3));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ repeat: Infinity, duration: 3 }}
      className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2"
    >
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      <span className="text-green-400 text-[10px] font-black uppercase tracking-widest">
        {viewers} viewing now
      </span>
    </motion.div>
  );
}

// ─── Spotlight hero carousel ──────────────────────────────────────────────────

const SPOTLIGHT_TOOLS = [
  { name: 'Motorized Power Sprayer', tag: 'Best Seller', desc: 'Cut spraying time by 70%', emoji: '💧', color: 'from-green-900 to-slate-950' },
  { name: 'Single-Wheel Hand Tiller', tag: 'Premium', desc: 'Till 2 acres with zero effort', emoji: '⚙️', color: 'from-amber-900 to-slate-950' },
  { name: 'Steel Contractor Wheelbarrow', tag: 'Heavy Duty', desc: '150kg load capacity', emoji: '🚜', color: 'from-slate-800 to-slate-950' },
];

function SpotlightHero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % SPOTLIGHT_TOOLS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const tool = SPOTLIGHT_TOOLS[active];

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] mb-16 min-h-[340px] flex items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 bg-gradient-to-br ${tool.color}`}
        />
      </AnimatePresence>

      {/* Grain overlay */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }}
      />

      <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 w-full">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <span className="inline-block bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                🔴 Live Showcase · {tool.tag}
              </span>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none mb-3">
                {tool.emoji} {tool.name}
              </h2>
              <p className="text-slate-300 font-medium text-lg">{tool.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex md:flex-col gap-2">
          {SPOTLIGHT_TOOLS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`rounded-full transition-all ${i === active ? 'bg-amber-500 w-8 h-2 md:w-2 md:h-8' : 'bg-white/20 w-2 h-2'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function FarmToolCard({ tool, onAddToCart }: { tool: FarmTool; onAddToCart: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <TiltCard>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative bg-slate-900 border border-slate-800 rounded-[1.75rem] overflow-hidden flex flex-col h-full transition-all duration-300 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/10"
      >
        {/* Premium badge */}
        {tool.is_premium && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-amber-500 text-black text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
            <Star size={9} fill="black" /> Premium
          </div>
        )}

        {/* Spotlight glow on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(74,197,100,0.12) 0%, transparent 70%)' }}
            />
          )}
        </AnimatePresence>

        {/* Image */}
        <div className="relative h-52 bg-slate-800 overflow-hidden">
          <Image
            src={tool.image}
            alt={tool.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

          {/* Category chip */}
          <span className="absolute bottom-3 left-3 text-[8px] font-black uppercase tracking-widest bg-slate-950/80 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
            {tool.category}
          </span>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col flex-grow relative z-10">
          <h3 className="font-black text-white uppercase text-base leading-tight mb-2 tracking-tight">
            {tool.name}
          </h3>
          <p className="text-slate-400 text-xs font-medium leading-relaxed mb-5 line-clamp-2 flex-grow">
            {tool.description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-2xl font-black text-white">${tool.price.toFixed(2)}</span>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onAddToCart}
              aria-label={`Add ${tool.name} to cart`}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-amber-500 text-white hover:text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
            >
              <Plus size={14} /> Add
            </motion.button>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FarmToolsPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, totalAmount, cartCount } = useCart();

  const [tools, setTools]               = useState<FarmTool[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [selectedCat, setSelectedCat]   = useState('All');
  const [searchQuery, setSearchQuery]   = useState('');
  const [isCartOpen, setIsCartOpen]     = useState(false);
  const [currentUser, setCurrentUser]   = useState<SupabaseUser | null>(null);

  // Auth
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => setCurrentUser(data.session?.user ?? null));
  }, []);

  // Fetch farm tools
  useEffect(() => {
    fetch('/api/products?section=farm_tools')
      .then(r => r.json())
      .then(setTools)
      .catch(() => setError('Failed to load tools'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = tools.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedCat === 'All' || t.category === selectedCat)
  );

  const handleAddToCart = (tool: FarmTool) => {
    addToCart({
      id:          `ft-${tool.id}`,   // prefix avoids ID collision with food products
      name:        tool.name,
      price:       tool.price,
      image:       tool.image,
      category:    tool.category,
      description: tool.description,
      type:        'FARM_TOOL',
      quantity:    1,
    });
    toast.success(`${tool.name} added to cart`, {
      action: { label: 'View Cart', onClick: () => setIsCartOpen(true) },
    });
  };

  // Farm-tools-only cart items for display
  const farmCartItems  = cart.filter(i => i.type === 'FARM_TOOL');
  const totalCartCount = cartCount; // shows ALL items across both storefronts

  return (
    <main className="bg-slate-950 min-h-screen text-white">

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ y: -100 }} animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-8 py-4"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 transition-colors">
              <ArrowLeft size={13} /> Food Store
            </Link>
            <div className="w-px h-5 bg-slate-700" />
            <Link href="/farm-tools" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Tractor size={16} className="text-white" />
              </div>
              <span className="font-black uppercase tracking-tighter text-lg text-white">
                Farm <span className="text-green-400">Tools</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <LiveViewers />
            {currentUser ? (
              <Link href="/account" className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors">
                Account
              </Link>
            ) : (
              <Link href="/auth" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                Sign In
              </Link>
            )}
          </div>

          <button onClick={() => setIsCartOpen(true)}
            aria-label={`Open cart, ${totalCartCount} items`}
            className="relative p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ShoppingCart size={20} className="text-white" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">

        {/* ── HERO ── */}
        <section className="mb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-green-400 mb-4">
              Local Borga · Farm Equipment
            </p>
            <h1 className="text-6xl md:text-8xl font-black leading-none uppercase tracking-tighter text-white mb-6">
              Built for<br />
              <span className="text-green-400 italic font-serif"> Ghana's </span><br />
              Fields.
            </h1>
            <p className="text-slate-400 text-lg max-w-xl font-medium mb-10">
              Professional farming tools and equipment. From cutlasses to motorized sprayers — sourced for Ghanaian conditions, shipped worldwide.
            </p>
          </motion.div>

          {/* Spotlight carousel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <SpotlightHero />
          </motion.div>
        </section>

        {/* ── STATS ── */}
        <section className="mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Users size={20} className="text-green-400" />,   label: 'Farmers Served',  target: 1240 },
              { icon: <TrendingUp size={20} className="text-amber-500" />, label: 'Tools Sold',   target: 3860 },
              { icon: <Shield size={20} className="text-green-400" />,  label: 'Quality Checked', target: 100,  suffix: '%' },
              { icon: <Zap size={20} className="text-amber-500" />,     label: 'Same-Day Dispatch',target: 48, suffix: 'h' },
            ].map(({ icon, label, target, suffix }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
              >
                <div className="mb-3">{icon}</div>
                <p className="text-3xl font-black text-white">
                  <StatCounter target={target} suffix={suffix} />
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── SEARCH ── */}
        <section className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input
              type="text"
              placeholder="Search tools, machinery, equipment..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-13 pr-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl outline-none focus:border-green-500/50 text-white font-medium placeholder:text-slate-600 transition-colors"
            />
          </div>
        </section>

        {/* ── CATEGORY FILTERS ── */}
        <section className="mb-12">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(({ label, icon }) => (
              <motion.button
                key={label}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCat(label)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                  selectedCat === label
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                }`}
              >
                <span>{icon}</span> {label}
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── CATALOG ── */}
        <section className="mb-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-3xl font-black uppercase tracking-tight">
              The <span className="text-green-400">Arsenal</span>
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {filtered.length} tool{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-32">
              <Loader2 size={40} className="animate-spin text-green-500" />
            </div>
          ) : error ? (
            <div className="text-center py-32">
              <p className="text-red-400 font-bold">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-slate-600 font-black uppercase tracking-widest">No tools found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((tool, idx) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <FarmToolCard tool={tool} onAddToCart={() => handleAddToCart(tool)} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── TRUST BANNER ── */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-green-900/40 to-slate-900 border border-green-500/20 rounded-[2.5rem] p-10 md:p-14 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="text-6xl shrink-0">🌍</div>
            <div className="flex-grow">
              <h3 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
                Shipping Globally from Accra
              </h3>
              <p className="text-slate-400 font-medium max-w-lg">
                Every tool is quality-checked at Local Borga HQ before dispatch. Diaspora orders welcome — we ship to UK, US, Canada, Europe and beyond.
              </p>
            </div>
            <Link href="/#tracking"
              className="flex items-center gap-2 px-8 py-4 bg-amber-500 text-black font-black rounded-2xl uppercase tracking-widest hover:bg-white transition-all whitespace-nowrap shrink-0"
            >
              Track Order <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-slate-800 pt-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Tractor size={16} className="text-white" />
            </div>
            <span className="font-black uppercase tracking-tighter text-lg text-white">
              Local Borga Farm Tools
            </span>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">
            Direct from Accra, Ghana · Premium Agricultural Equipment
          </p>
          <div className="flex justify-center gap-8">
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-amber-500 transition-colors">
              Food Store
            </Link>
            <Link href="/admin/login" className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-amber-500 transition-colors">
              Staff Portal
            </Link>
          </div>
          <p className="mt-8 text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] pb-8">
            © 2025 Local Borga Executive
          </p>
        </footer>
      </div>

      {/* ══════════════ CART DRAWER ══════════════ */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col p-8"
            >
              <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase text-white">Your Order</h2>
                  {totalCartCount > 0 && (
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{totalCartCount} item{totalCartCount > 1 ? 's' : ''}</p>
                  )}
                </div>
                <button onClick={() => setIsCartOpen(false)} aria-label="Close cart"
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center mt-20">
                    <ShoppingCart size={40} className="mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">Cart is empty</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item.id} className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-grow mr-3">
                        <h4 className="font-black text-white uppercase text-sm leading-tight">{item.name}</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest mt-1 text-slate-500">
                          {item.type === 'FARM_TOOL' ? '🚜 Farm Tool' : item.type === 'CUSTOM_MILLING' ? '⚙️ Custom Milling' : '🌾 Food'}
                        </p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease" className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="font-black text-white w-8 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase" className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-green-600 text-slate-300 rounded-lg transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="font-black text-white text-base">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-5 border-t border-slate-800 mt-5 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Total</span>
                  <span className="text-3xl font-black text-white">${totalAmount.toFixed(2)}</span>
                </div>
                <Link href="/"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl hover:bg-white transition-all uppercase tracking-widest text-center block disabled:opacity-40"
                >
                  Checkout via Food Store →
                </Link>
                <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                  🔒 Secured by Paystack
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}