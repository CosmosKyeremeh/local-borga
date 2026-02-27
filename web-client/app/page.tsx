'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'; 
import { 
  ShoppingCart, Settings, Globe, AlertCircle, Loader2, 
  X, Plus, Minus, Trash2, Search, Filter, CheckCircle2, MapPin, Menu,ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string; 
  isPremium?: boolean;
}

interface CartItem extends Product {
  quantity: number;
  isCustom?: boolean;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    item: 'Gari',
    weight: 5,
    milling: 'Medium Grain'
  });

  const [trackingId, setTrackingId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || ' ';

  useEffect(() => {
    const socket = io(API_URL);
    socket.on('orderStatusUpdated', (data) => {
      toast.success(`Production Update: Your ${data.itemName} is now ${data.status.toUpperCase()}!`);
    });
    return () => { socket.disconnect(); };
  }, [API_URL]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/api/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [API_URL]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId) return;
    setIsTrackLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${trackingId}`);
      if (!res.ok) throw new Error("Not Found");
      const data = await res.json();
      setTrackedOrder(data);
      toast.success("Order Located");
    } catch (err) {
      toast.error("Invalid Tracking ID");
      setTrackedOrder(null);
    } finally {
      setIsTrackLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderData = {
      itemName: customForm.item,
      millingStyle: customForm.milling,
      weightKg: customForm.weight,
      totalPrice: 15.00 * (customForm.weight / 5),
    };

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const result = await res.json();
      const cartItem: CartItem = {
        id: result.order.id, 
        name: `Custom ${orderData.itemName}`,
        price: orderData.totalPrice,
        category: 'CUSTOM',
        description: `Milled: ${orderData.millingStyle} (${orderData.weightKg}kg)`,
        image: '/images/custom-milling.jpg',
        quantity: 1,
        isCustom: true
      };
      setCart([...cart, cartItem]);
      setIsCustomModalOpen(false);
      setIsCartOpen(true);
      toast.info("Production Started!", { description: `ID: ${result.order.id}` });
    } catch (err) {
      toast.error("Order Failed");
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id && !item.isCustom);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <main className="min-h-screen bg-white">
      {/* 1. SECTIONED NAVBAR */}
      
<motion.nav 

  initial={{ y: -100 }}

  animate={{ y: 0 }}

  className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4"

>

  <div className="max-w-7xl mx-auto flex justify-between items-center">

    {/* Logo Area */}

    <Link href="/" className="flex items-center gap-2">

      <img src="/logo.jpg" alt="Logo" className="h-8 md:h-10 w-auto" />

      <span className="font-black uppercase tracking-tighter text-lg md:text-xl text-slate-900">Local Borga</span>

    </Link>



    {/* Desktop Menu (Hidden on Mobile) */}

    <div className="hidden md:flex items-center gap-8">

      {['Catalog', 'Tracking', 'Heritage'].map((item) => (

        <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-amber-500 transition-colors">

          {item}

        </a>

      ))}

      <Link href="/admin" className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-100 px-4 py-2 rounded-full hover:bg-amber-500 hover:text-white transition-all">Admin</Link>

    </div>



    {/* Right Actions (Cart + Mobile Toggle) */}

    <div className="flex items-center gap-4">

      <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-slate-50 rounded-full transition-colors">

        <ShoppingCart size={22} className="text-slate-900" />

        {cart.length > 0 && (

          <motion.span 

            initial={{ scale: 0 }} animate={{ scale: 1 }}

            className="absolute top-0 right-0 bg-amber-500 text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full"

          >

            {cart.length}

          </motion.span>

        )}

      </button>



      {/* MOBILE MENU TOGGLE (Visible only on small screens) */}

      <button 

        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}

        className="md:hidden p-2 text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"

      >

        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}

      </button>

    </div>

  </div>



  {/* MOBILE MENU DRAWER */}

    <AnimatePresence>

      {isMobileMenuOpen && (

        <motion.div 

          initial={{ opacity: 0, height: 0 }}

          animate={{ opacity: 1, height: 'auto' }}

          exit={{ opacity: 0, height: 0 }}

          className="md:hidden bg-white border-t border-slate-100 overflow-hidden"

        >

          <div className="flex flex-col p-6 gap-6">

            {['Catalog', 'Tracking', 'Heritage'].map((item) => (

              <a 

                key={item} 

                href={`#${item.toLowerCase()}`} 

                onClick={() => setIsMobileMenuOpen(false)} // Close on click

                className="text-xs font-black uppercase tracking-[0.3em] text-slate-900"

              >

                {item}

              </a>

            ))}

            <Link 

              href="/admin" 

              onClick={() => setIsMobileMenuOpen(false)}

              className="text-xs font-black uppercase tracking-[0.3em] text-amber-600"

            >

              Admin Command Center

            </Link>

          </div>

        </motion.div>

      )}

    </AnimatePresence>

  </motion.nav>

      <div className="max-w-7xl mx-auto px-8 md:px-16 pt-32 pb-16">
        {/* 2. HERO HEADER */}
        <header className="mb-20 flex flex-col items-start gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Nurturing <br/><span className="text-amber-500">Excellence.</span>
            </h1>
            <div className="h-2 w-32 bg-slate-900 mt-4"></div>
          </motion.div>
        </header>

        {/* 3. TRACKING SECTION */}
        <section id="tracking" className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden"
          >
            <div className="relative z-10 max-w-xl">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                <MapPin className="text-amber-500" /> Live Order Concierge
              </h2>
              <form onSubmit={handleTrackOrder} className="flex gap-2">
                <input 
                  type="text" placeholder="Tracking ID..."
                  className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 font-mono"
                  value={trackingId} onChange={(e) => setTrackingId(e.target.value)}
                />
                <button className="bg-amber-500 text-black font-black px-8 rounded-2xl hover:bg-white transition-all uppercase text-xs">Search</button>
              </form>
              <AnimatePresence>
                {trackedOrder && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                    <div><p className="text-[10px] uppercase text-amber-500 font-bold">Current Phase</p><p className="text-2xl font-black uppercase tracking-tighter">{trackedOrder.status}</p></div>
                    <div className="text-right"><p className="text-[10px] uppercase text-slate-500 font-bold">Batch Item</p><p className="font-bold">{trackedOrder.itemName}</p></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* 4. CUSTOM MILLING SECTION */}
        <section className="mb-24">
          <div className="flex flex-col md:flex-row items-center gap-12 border-2 border-slate-100 rounded-[3rem] p-12 bg-slate-50/30">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-4 text-amber-600"><Settings size={32}/><h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Tailored Production</h2></div>
              <p className="text-slate-500 max-w-md font-medium">Have your staples milled to your exact texture and weight. Direct from the source to your doorstep.</p>
            </div>
            <button onClick={() => setIsCustomModalOpen(true)} className="bg-amber-500 hover:bg-slate-900 hover:text-white text-black font-black py-6 px-12 rounded-2xl uppercase tracking-widest transition-all">Start Custom Milling</button>
          </div>
        </section>

        {/* 5. PRODUCT CATALOG */}
        <section id="catalog" className="mb-24">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
             <div><h2 className="text-4xl font-black uppercase tracking-tight text-slate-900 underline decoration-amber-500 decoration-4 underline-offset-8">The Collection</h2></div>
             <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{cat}</button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product, idx) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <ProductCard product={product} onAddToCart={() => addToCart(product)} />
              </motion.div>
            ))}
          </div>
        </section>

        {/*  HERITAGE / ABOUT SECTION (Using CEO Images) */}
        <section id="heritage" className="py-24 bg-slate-900 text-white rounded-[4rem] overflow-hidden my-24 relative">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-500/5 blur-3xl rounded-full"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-16 relative z-10">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-5xl font-black leading-none uppercase mb-8">Executive <br/><span className="text-amber-500 italic font-serif">Oversight.</span></h2>
              <p className="text-lg text-slate-400 font-medium mb-8">
                Perfection is an asymptote—we are forever chasing it, forever closing the gap. Our philosophy is rooted in an obsessive attention to detail that borders on the unreasonable. We believe that if a thing is worth building, it is worth building to outlast its creator. This is not just a product; it is the physical manifestation of our uncompromising standard.
              </p>
              <div className="flex items-center gap-4 py-6 border-y border-white/10">
                 <div className="bg-amber-500 text-black p-3 rounded-xl"><ShieldCheck size={24}/></div>
                 <div><p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Quality Assured</p><p className="font-bold">Managed by Local Borga HQ</p></div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/5"
            >
              <img src="/images/local-borga-headquarters-interior1.jpg" alt="Local Borga CEO" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 border-t border-slate-100 pt-16 text-center">
          <Globe className="w-12 h-12 text-amber-500 mx-auto mb-6 animate-pulse" />
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Intercontinental Staples</h3>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Direct from Accra, Ghana • Shipping Globally</p>
          <div className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] pb-8">© 2025 Local Borga Executive</div>
        </footer>
      </div>

      {/* Cart & Modals */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-8">
              <div className="flex justify-between items-center mb-8 border-b pb-4"><h2 className="text-2xl font-black uppercase">Your Order</h2><button onClick={() => setIsCartOpen(false)}><X /></button></div>
              <div className="flex-grow overflow-y-auto space-y-4">
                {cart.length === 0 ? <p className="text-center text-slate-400 mt-20 font-bold uppercase tracking-widest">Basket is Empty</p> : cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div><h4 className="font-black text-slate-900 uppercase text-sm">{item.name}</h4><p className="text-xs text-slate-500">{item.description}</p></div>
                    <div className="text-right"><p className="font-black">${(item.price * item.quantity).toFixed(2)}</p></div>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t mt-6">
                <div className="flex justify-between text-2xl font-black mb-6 uppercase tracking-tighter"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
                <button className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest">Secure Checkout</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Modal */}
      <AnimatePresence>
        {isCustomModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCustomModalOpen(false)} />
            <motion.form 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleCustomSubmit} className="relative w-full max-w-lg bg-white rounded-[3rem] overflow-hidden"
            >
              <div className="bg-amber-500 p-8 text-black flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tight">Production Request</h2>
                <button type="button" onClick={() => setIsCustomModalOpen(false)}><X/></button>
              </div>
              <div className="p-10 space-y-8">
                <div><label className="text-xs font-black text-slate-400 uppercase tracking-widest">Staple Type</label><select className="w-full p-4 bg-slate-50 border-none rounded-2xl mt-2 font-bold" onChange={(e) => setCustomForm({...customForm, item: e.target.value})}><option>Gari</option><option>Cassava Flour</option></select></div>
                <div><label className="text-xs font-black text-slate-400 uppercase tracking-widest">Volume: {customForm.weight}kg</label><input type="range" min="5" max="50" step="5" className="w-full accent-amber-500 mt-2" onChange={(e) => setCustomForm({...customForm, weight: parseInt(e.target.value)})} /></div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-500 hover:text-black transition-all uppercase tracking-widest">Initialize Batch</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

// Sub-component
function ProductCard({ product, onAddToCart }: { product: any, onAddToCart: () => void }) {
  return (
    <div className="group border border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white flex flex-col relative">
      {product.isPremium && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-amber-500 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">Limited Edition</span>
        </div>
      )}
      <div className="h-64 bg-slate-50 relative overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      </div>
      <div className="p-8 flex flex-col flex-grow">
        <h3 className="font-black text-slate-900 uppercase text-lg leading-tight">{product.name}</h3>
        <p className="text-slate-500 text-xs mt-3 mb-6 font-medium line-clamp-2">{product.description}</p>
        <div className="mt-auto pt-6 border-t flex items-center justify-between">
          <span className="text-2xl font-black text-slate-900">${product.price.toFixed(2)}</span>
          <button onClick={onAddToCart} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-amber-500 hover:text-black transition-all"><Plus size={20}/></button>
        </div>
      </div>
    </div>
  );
}