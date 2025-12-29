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

  // Tracking System States (#17)
  const [trackingId, setTrackingId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    item: 'Gari',
    weight: 5,
    milling: 'Medium Grain',
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Socket Listener for Real-time Updates
  useEffect(() => {
    const socket = io(API_URL);
    socket.on('orderStatusUpdated', (data) => {
      toast.success(`Production Update: Your ${data.itemName} is now ${data.status.toUpperCase()}!`, {
        duration: 6000,
      });
    });
    return () => { socket.disconnect(); };
  }, []);

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
  }, []);

  // Tracking Logic (#17)
  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId) return;
    setIsTrackLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${trackingId}`);
      if (!res.ok) throw new Error("Order Not Found");
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
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error('Failed to save order');
      const result = await response.json();

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
      toast.info("Production has started!", { description: `Tracking ID: ${result.order.id}` });
    } catch (err) {
      alert('Failed to send order.');
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

  const removeItem = (id: number) => setCart(cart.filter(i => i.id !== id));
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <main className="min-h-screen bg-white p-8 md:p-16 max-w-7xl mx-auto relative">
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed top-8 right-8 z-40 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-amber-500 hover:text-slate-900 transition-all flex items-center gap-2 group"
      >
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="bg-amber-500 text-slate-900 text-xs font-black h-5 w-5 flex items-center justify-center rounded-full">
            {cart.length}
          </span>
        )}
      </button>

      <header className="mb-12 flex flex-col items-start gap-4">
        <div className="flex items-center gap-4">
          <img src="/logo.jpg" alt="Logo" className="h-20 w-auto object-contain" />
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Local Borga</h1>
            <div className="h-1 w-full bg-amber-500 rounded-full mt-1"></div>
          </div>
        </div>
        <Link href="/admin" className="text-[10px] font-black text-slate-400 hover:text-amber-600 uppercase tracking-[0.3em]">
          Command Center
        </Link>
      </header>

      {/* TRACKING MODULE (#17) */}
      <section className="mb-12 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2 flex items-center gap-3">
            <MapPin className="text-amber-500" /> Track Production
          </h2>
          <form onSubmit={handleTrackOrder} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter Tracking ID..."
              className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 font-mono text-sm"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
            />
            <button className="bg-amber-500 text-black font-black px-8 rounded-2xl hover:bg-amber-400 transition-all uppercase text-xs tracking-widest">
              {isTrackLoading ? '...' : 'Track'}
            </button>
          </form>

          {trackedOrder && (
            <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Status</p>
                  <p className="text-xl font-black uppercase">{trackedOrder.status}</p>
                </div>
                <p className="font-bold">{trackedOrder.itemName}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mb-12 border-2 border-slate-100 rounded-2xl p-8 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-bold text-slate-900">Custom Milling</h2>
        </div>
        <button onClick={() => setIsCustomModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-4 px-8 rounded-xl uppercase tracking-wide">
          Build Custom Order
        </button>
      </section>

      <section>
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500 w-10 h-10" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({ product, onAddToCart }: { product: any, onAddToCart: () => void }) {
  return (
    <div className="group border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white flex flex-col relative">
      
      {/* NEW: Limited Edition Badge */}
      {product.isPremium && (
        <div className="absolute top-4 right-4 z-10 animate-in fade-in zoom-in duration-500">
          <span className="bg-amber-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg flex items-center gap-1">
             Limited Edition
          </span>
        </div>
      )}

      <div className="h-52 bg-slate-50 relative overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-900 px-2 py-1 rounded-full uppercase tracking-widest">
            {product.category}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{product.name}</h3>
        <p className="text-slate-500 text-xs mt-2 mb-4 line-clamp-2">{product.description}</p>
        <div className="mt-auto pt-4 border-t flex items-center justify-between">
          <span className="text-xl font-black text-slate-900">${product.price.toFixed(2)}</span>
          <button onClick={onAddToCart} className="p-2 bg-slate-100 rounded-lg hover:bg-amber-500 transition-colors">
            <Plus size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}