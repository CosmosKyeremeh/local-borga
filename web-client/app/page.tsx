'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'; 
import { 
  ShoppingCart, Settings, Globe, AlertCircle, Loader2, 
  X, Plus, Minus, Trash2, Search, Filter, CheckCircle2, MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

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
  // --- RESTORED: Main States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- RESTORED: UI & Modal States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    item: 'Gari',
    weight: 5,
    milling: 'Medium Grain'
  });

  // --- RESTORED: Tracking States (#17) ---
  const [trackingId, setTrackingId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // --- Real-time Socket Connection ---
  useEffect(() => {
    const socket = io(API_URL);
    socket.on('orderStatusUpdated', (data) => {
      toast.success(`Production Update: Your ${data.itemName} is now ${data.status.toUpperCase()}!`);
    });
    return () => { socket.disconnect(); };
  }, [API_URL]);

  // --- Fetch Catalog ---
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

  // --- Logic Functions ---
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
    <main className="min-h-screen bg-white p-8 md:p-16 max-w-7xl mx-auto relative">
      
      {/* RESTORED: Fixed Cart Button */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed top-8 right-8 z-40 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-amber-500 hover:text-slate-900 transition-all flex items-center gap-2 group"
      >
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="bg-amber-500 text-slate-900 text-xs font-black h-5 w-5 flex items-center justify-center rounded-full animate-bounce">
            {cart.length}
          </span>
        )}
      </button>

      {/* Header */}
      <header className="mb-12 flex flex-col items-start gap-4">
        <div className="flex items-center gap-4">
          <img src="/logo.jpg" alt="Logo" className="h-20 w-auto object-contain" />
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Local Borga</h1>
            <div className="h-1 w-full bg-amber-500 rounded-full mt-1"></div>
          </div>
        </div>
        <Link href="/admin" className="text-[10px] font-black text-slate-400 hover:text-amber-600 uppercase tracking-[0.3em]">Command Center</Link>
      </header>

      {/* Tracking Section */}
      <section className="mb-12 bg-slate-900 rounded-[2.5rem] p-10 text-white">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2 flex items-center gap-3">
          <MapPin className="text-amber-500" /> Track Production
        </h2>
        <form onSubmit={handleTrackOrder} className="flex gap-2 max-w-lg mt-4">
          <input 
            type="text" 
            placeholder="Enter ID..."
            className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 font-mono text-sm"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
          />
          <button className="bg-amber-500 text-black font-black px-8 rounded-2xl hover:bg-amber-400 transition-all uppercase text-xs">Track</button>
        </form>
        {trackedOrder && (
          <div className="mt-6 p-6 bg-white/5 border border-white/10 rounded-3xl flex justify-between items-center">
             <div><p className="text-[10px] uppercase text-amber-500">Status</p><p className="text-xl font-black uppercase">{trackedOrder.status}</p></div>
             <p className="font-bold">{trackedOrder.itemName}</p>
          </div>
        )}
      </section>

      {/* RESTORED: Custom Milling Button */}
      <section className="mb-12 border-2 border-slate-100 rounded-2xl p-8 bg-slate-50/50 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-bold text-slate-900">Custom Milling & Production</h2>
        </div>
        <button 
          onClick={() => setIsCustomModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-4 px-8 rounded-xl uppercase tracking-wide flex items-center gap-2"
        >
          Build Your Custom Order <Plus size={18}/>
        </button>
      </section>

      {/* Product Feed */}
      <section className="mb-12 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" placeholder="Search..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl" onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-sm font-bold ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{cat}</button>
          ))}
        </div>
      </section>

      <section>
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500 w-10 h-10" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} />
            ))}
          </div>
        )}
      </section>

      {/* RESTORED: Global Footer */}
      <footer className="mt-24 bg-slate-900 text-white p-12 rounded-[2.5rem] text-center shadow-2xl">
        <Globe className="w-10 h-10 text-amber-500 mx-auto mb-4 animate-pulse" />
        <p className="text-2xl font-bold tracking-tight mb-2">🌍 Intercontinental Shipping Available</p>
        <p className="text-slate-400 font-medium">From Ghana to the Rest of the World</p>
      </footer>

      {/* RESTORED: Modal Logic */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCustomModalOpen(false)} />
          <form onSubmit={handleCustomSubmit} className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-amber-500 p-6 text-slate-900 flex justify-between items-center">
              <h2 className="text-xl font-bold uppercase tracking-tight">New Custom Request</h2>
              <button type="button" onClick={() => setIsCustomModalOpen(false)}><X/></button>
            </div>
            <div className="p-8 space-y-6">
              <div><label className="text-xs font-black text-slate-400 uppercase">Product</label><select className="w-full p-4 bg-slate-50 border rounded-xl outline-none mt-2" onChange={(e) => setCustomForm({...customForm, item: e.target.value})}><option>Gari</option><option>Cassava Flour</option></select></div>
              <div><label className="text-xs font-black text-slate-400 uppercase">Quantity: {customForm.weight}kg</label><input type="range" min="5" max="50" step="5" className="w-full accent-amber-500 mt-2" onChange={(e) => setCustomForm({...customForm, weight: parseInt(e.target.value)})} /></div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-600 transition-all uppercase tracking-widest flex items-center justify-center gap-2">Send to Production <CheckCircle2 size={18}/></button>
            </div>
          </form>
        </div>
      )}

      {/* RESTORED: Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-8 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8 border-b pb-4"><h2 className="text-2xl font-bold">Your Order</h2><button onClick={() => setIsCartOpen(false)}><X /></button></div>
            <div className="flex-grow overflow-y-auto space-y-4">
              {cart.length === 0 ? <p className="text-center text-slate-400 mt-20">Basket is empty</p> : cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div><h4 className="font-bold text-slate-900 text-sm">{item.name}</h4><p className="text-xs text-slate-500">{item.description}</p></div>
                  <div className="text-right"><p className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p></div>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t mt-6">
              <div className="flex justify-between text-2xl font-black mb-6"><span>Total:</span><span>${cartTotal.toFixed(2)}</span></div>
              <button className="w-full py-4 bg-amber-500 rounded-2xl font-black text-slate-900 shadow-lg hover:bg-amber-600 transition-all">Checkout</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ProductCard({ product, onAddToCart }: { product: any, onAddToCart: () => void }) {
  return (
    <div className="group border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white flex flex-col relative">
      {product.isPremium && (
        <div className="absolute top-4 right-4 z-10 animate-in fade-in zoom-in duration-500">
          <span className="bg-amber-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg flex items-center gap-1">Limited Edition</span>
        </div>
      )}
      <div className="h-52 bg-slate-50 relative overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-slate-900">{product.name}</h3>
        <p className="text-slate-500 text-xs mt-2 mb-4 line-clamp-2">{product.description}</p>
        <div className="mt-auto pt-4 border-t flex items-center justify-between">
          <span className="text-xl font-black text-slate-900">${product.price.toFixed(2)}</span>
          <button onClick={onAddToCart} className="p-2 bg-slate-100 rounded-lg hover:bg-amber-500 transition-colors"><Plus size={18}/></button>
        </div>
      </div>
    </div>
  );
}