'use client';

import { useEffect, useState } from 'react';
import { 
  ShoppingCart, 
  Settings, 
  Globe, 
  AlertCircle, 
  Loader2, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Filter,
  CheckCircle2
} from 'lucide-react';

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

  // --- Search & Filter States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- Custom Order States ---
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    item: 'Gari',
    weight: 5,
    milling: 'Medium Grain'
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('http://localhost:5000/api/products');
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

  // --- Logic: Search & Filter ---
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // --- Logic: Handle Custom Order POST to Backend ---
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderData = {
      itemName: customForm.item,
      millingStyle: customForm.milling,
      weightKg: customForm.weight,
      totalPrice: 15.00 * (customForm.weight / 5),
    };

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
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
    } catch (err) {
      alert('Failed to send order. Is the backend running?');
    }
  };

  // --- Logic: Cart Actions ---
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id && !item.isCustom);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id: number) => setCart(cart.filter(i => i.id !== id));
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <main className="min-h-screen bg-white p-8 md:p-16 max-w-7xl mx-auto relative">
      
      {/* Floating Cart Indicator */}
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

      {/* Brand Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Local Borga</h1>
        <div className="h-1.5 w-20 bg-amber-500 rounded-full"></div>
      </header>

      {/* Custom Milling Section */}
      <section className="mb-12 border-2 border-slate-100 rounded-2xl p-8 bg-slate-50/50 shadow-sm transition-hover hover:border-amber-200 duration-300">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-bold text-slate-900">Custom Milling & Production</h2>
        </div>
        <p className="text-slate-600 mb-8 max-w-2xl">
          Order custom **Gari, Flours, and Powdered Goods** milled fresh to your specific requirements.
        </p>
        <button 
          onClick={() => setIsCustomModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-4 px-8 rounded-xl transition-all uppercase tracking-wide flex items-center gap-2"
        >
          Build Your Custom Order <Plus size={18}/>
        </button>
      </section>

      {/* Search & Filter UI */}
      <section className="mb-12 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section>
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500 w-10 h-10" /></div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2"><AlertCircle size={20}/> {error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} />
            ))}
          </div>
        )}
      </section>

      {/* Restored Intercontinental Footer */}
      <footer className="mt-24 bg-slate-900 text-white p-12 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <Globe className="w-10 h-10 text-amber-500 animate-pulse mx-auto mb-4" />
          <p className="text-2xl font-bold tracking-tight mb-2">🌍 Intercontinental Shipping Available</p>
          <p className="text-slate-400 font-medium">From Ghana to the Rest of the World</p>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
      </footer>

      {/* --- CUSTOM ORDER MODAL --- */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCustomModalOpen(false)} />
          <form onSubmit={handleCustomSubmit} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-amber-500 p-6 text-slate-900 flex justify-between items-center">
              <h2 className="text-xl font-bold">New Custom Request</h2>
              <button type="button" onClick={() => setIsCustomModalOpen(false)}><X/></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Product</label>
                <select className="w-full p-4 bg-slate-50 border rounded-xl outline-none" onChange={(e) => setCustomForm({...customForm, item: e.target.value})}>
                  <option>Gari</option>
                  <option>Cassava Flour</option>
                  <option>Maize Flour</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Milling Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Coarse', 'Medium', 'Fine'].map(s => (
                    <button key={s} type="button" onClick={() => setCustomForm({...customForm, milling: s})} className={`py-2 border rounded-lg font-bold transition-all ${customForm.milling === s ? 'bg-amber-500 border-amber-500 text-slate-900' : 'text-slate-400'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Quantity: {customForm.weight}kg</label>
                <input type="range" min="1" max="50" className="w-full accent-amber-500" onChange={(e) => setCustomForm({...customForm, weight: parseInt(e.target.value)})} />
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                Send to Production <CheckCircle2 size={18}/>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- CART DRAWER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-8 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h2 className="text-2xl font-bold">Your Order</h2>
              <button onClick={() => setIsCartOpen(false)}><X /></button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4">
              {cart.length === 0 ? <p className="text-center text-slate-400 mt-20">Basket is empty</p> : cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeItem(item.id)} className="text-red-400 text-xs font-bold">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t mt-6">
              <div className="flex justify-between text-2xl font-black mb-6"><span>Total:</span><span>${cartTotal.toFixed(2)}</span></div>
              <button className="w-full py-4 bg-amber-500 rounded-2xl font-black text-slate-900 shadow-lg hover:bg-amber-600 transition-all">Proceed to Checkout</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product, onAddToCart: () => void }) {
  return (
    <div className="group border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white flex flex-col">
      <div className="h-52 bg-slate-50 relative overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute top-3 left-3"><span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-900 px-2 py-1 rounded-full uppercase tracking-widest">{product.category}</span></div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{product.name}</h3>
        <p className="text-slate-500 text-xs mt-2 mb-4 line-clamp-2">{product.description}</p>
        <div className="mt-auto pt-4 border-t flex items-center justify-between">
          <span className="text-xl font-black text-slate-900">${product.price.toFixed(2)}</span>
          <button onClick={onAddToCart} className="p-2 bg-slate-100 rounded-lg hover:bg-amber-500 transition-colors"><Plus size={18}/></button>
        </div>
      </div>
    </div>
  );
}