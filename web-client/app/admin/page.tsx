'use client';

// web-client/app/admin/page.tsx

import { useEffect, useState, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Image from 'next/image';
import {
  Package, CheckCircle, ChevronLeft, RefreshCcw, ShieldCheck,
  TrendingUp, Printer, LogOut, Plus, Pencil, Trash2, X, ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PrintableLabel } from './components/PrintableLabel';

// ── Types ──────────────────────────────────────────────────────────
interface Order {
  id: number;
  itemName: string;
  millingStyle: string;
  weightKg: number;
  totalPrice: number;
  status: 'pending' | 'milling' | 'completed';
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  is_premium: boolean;
}

// Fix 1: Typed Supabase row shape instead of `any`
interface SupabaseOrderRow {
  id: number;
  item_name: string;
  milling_style: string | null;
  weight_kg: number | null;
  total_price: number;
  status: 'pending' | 'milling' | 'completed';
  created_at: string;
}

const EMPTY_PRODUCT = { name: '', price: '', category: '', description: '', image: '', is_premium: false };

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePrintOrder, setActivePrintOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [products, setProducts]             = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct]     = useState<Product | null>(null);
  const [productForm, setProductForm]           = useState<typeof EMPTY_PRODUCT>({ ...EMPTY_PRODUCT });
  const [savingProduct, setSavingProduct]       = useState(false);

  const router = useRouter();

  const handlePrint = useReactToPrint({ contentRef: printRef });
  const preparePrint = (order: Order) => {
    setActivePrintOrder(order);
    setTimeout(() => handlePrint(), 150);
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { router.push('/admin/login'); return; }
    fetchOrders();
    fetchProducts();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    toast.success('Logged out');
    router.push('/admin/login');
  };

  // ── Orders ─────────────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Feed Offline');
      const raw: SupabaseOrderRow[] = await res.json(); // Fix 1: typed, no `any`
      setOrders(raw.map((o) => ({
        id: o.id,
        itemName: o.item_name,
        millingStyle: o.milling_style ?? '—',
        weightKg: o.weight_kg ?? 0,
        totalPrice: o.total_price,
        status: o.status,
        createdAt: o.created_at,
      })));
    } catch { toast.error('Production Feed Offline'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { toast.success(`#${id} → ${newStatus}`); fetchOrders(); }
    } catch { toast.error('Update Failed'); }
  };

  // ── Products ───────────────────────────────────────────────────
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error();
      setProducts(await res.json());
    } catch { toast.error('Could not load products'); }
    finally { setProductsLoading(false); }
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({ ...EMPTY_PRODUCT });
    setShowProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name, price: String(p.price), category: p.category,
      description: p.description, image: p.image, is_premium: p.is_premium,
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.category) {
      toast.error('Name, price, and category are required');
      return;
    }
    setSavingProduct(true);
    const payload = {
      name: productForm.name,
      price: parseFloat(productForm.price as string),
      category: productForm.category.toUpperCase(),
      description: productForm.description,
      image: productForm.image || '/images/placeholder.jpg',
      is_premium: productForm.is_premium,
    };
    try {
      const url    = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingProduct ? 'Product updated' : 'Product added to catalog');
      setShowProductModal(false);
      fetchProducts();
    } catch { toast.error('Failed to save product'); }
    finally { setSavingProduct(false); }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}" from the catalog?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(`${name} removed`);
      fetchProducts();
    } catch { toast.error('Delete failed'); }
  };

  // ── Analytics ─────────────────────────────────────────────────
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.totalPrice, 0), [orders]);
  const chartData = useMemo(() => {
    // Fix 1: typed accumulator, no `any`
    const groups = orders.reduce<Record<string, number>>((acc, o) => {
      const date = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + o.totalPrice;
      return acc;
    }, {});
    return Object.keys(groups).map(date => ({ date, revenue: groups[date] })).reverse();
  }, [orders]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-amber-500/20 pb-8">
          <div>
            <Link href="/" className="text-amber-500/50 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] mb-4 hover:text-amber-500 transition-all">
              <ChevronLeft size={14} /> Return to Store
            </Link>
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4">
              <span className="bg-amber-500 text-black px-3 py-1 rounded-sm italic">B&</span> COMMAND CENTER
            </h1>
            <div className="flex items-center gap-2 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 w-fit">
              <ShieldCheck size={14} className="text-amber-500" />
              <p className="text-amber-500 text-xs font-black uppercase tracking-widest">Admin Session Active</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6 md:mt-0">
            {/* Fix 3: aria-label on icon buttons */}
            <button
              onClick={fetchOrders}
              aria-label="Refresh orders"
              className="flex items-center gap-3 px-6 py-4 bg-white/5 text-white font-black uppercase text-xs tracking-widest rounded-full hover:bg-white/10 transition-all"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={handleLogout}
              aria-label="Logout of admin"
              className="flex items-center gap-3 px-6 py-4 bg-red-500/10 text-red-400 font-black uppercase text-xs tracking-widest rounded-full hover:bg-red-500/20 transition-all border border-red-500/20"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#121212] p-8 rounded-[2rem] border border-white/5 flex flex-col justify-between">
            <div>
              <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Total Gross Revenue</p>
              <h2 className="text-5xl font-black text-white">${totalRevenue.toFixed(2)}</h2>
            </div>
            <div className="mt-8 flex items-center gap-2 text-green-500 font-bold text-sm">
              <TrendingUp size={16} /> Data Pulse: Live
            </div>
          </div>
          <div className="lg:col-span-2 bg-[#121212] p-8 rounded-[2rem] border border-white/5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-8">
          {(['orders', 'products'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-label={`Switch to ${tab} tab`}
              className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >{tab}</button>
          ))}
        </div>

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-2 mb-4 px-4">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Live Production Feed</h3>
            </div>
            {orders.length === 0 ? (
              <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <Package size={48} className="mx-auto text-white/10 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest">No Active Orders</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="group relative bg-[#121212] border border-white/5 p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center transition-all hover:border-amber-500/30">
                <div className="flex gap-8 items-center w-full md:w-auto">
                  <div className="text-xs font-mono text-amber-500/30">#{order.id.toString().slice(-4)}</div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">{order.itemName}</h3>
                    <p className="text-amber-500 text-xs font-black uppercase tracking-widest mt-1">{order.millingStyle} Milling • {order.weightKg}kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-12 mt-8 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Revenue</p>
                    <p className="text-2xl font-black">${order.totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    {/* Fix 3: aria-labels on all icon-only buttons */}
                    <button
                      onClick={() => preparePrint(order)}
                      aria-label={`Print shipping label for order #${order.id}`}
                      className="p-4 bg-white/5 text-white rounded-2xl hover:bg-white/20 transition-all"
                    >
                      <Printer size={20} />
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'milling')}
                      aria-label={`Mark order #${order.id} as milling`}
                      className={`p-4 rounded-2xl transition-all ${order.status === 'milling' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}
                    >
                      <RefreshCcw size={20} className={order.status === 'milling' ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'completed')}
                      aria-label={`Mark order #${order.id} as completed`}
                      className={`p-4 rounded-2xl transition-all ${order.status === 'completed' ? 'bg-green-600 text-white' : 'bg-white/5 text-white hover:bg-green-600/20'}`}
                    >
                      <CheckCircle size={20} />
                    </button>
                  </div>
                </div>
                <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full ${order.status === 'pending' ? 'bg-amber-500/20' : order.status === 'milling' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
              </div>
            ))}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 px-4">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Catalog — {products.length} items
                </h3>
              </div>
              <button
                onClick={openNewProduct}
                aria-label="Add new product to catalog"
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-amber-400 transition-all"
              >
                <Plus size={16} /> Add Product
              </button>
            </div>

            {productsLoading ? (
              <div className="py-20 text-center text-slate-500 font-bold">Loading catalog...</div>
            ) : products.length === 0 ? (
              <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <Package size={48} className="mx-auto text-white/10 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest">No products yet</p>
                <button onClick={openNewProduct} className="mt-6 px-8 py-3 bg-amber-500 text-black font-black rounded-full uppercase text-xs tracking-widest hover:bg-amber-400 transition-all">
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-[#121212] border border-white/5 rounded-[2rem] p-6 flex gap-6 items-center hover:border-amber-500/20 transition-all">
                    {/* Fix 4: <Image /> instead of <img> */}
                    <div className="w-16 h-16 rounded-2xl bg-white/5 overflow-hidden shrink-0 relative">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={20} className="text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black uppercase text-sm truncate">{product.name}</h4>
                        {product.is_premium && (
                          <span className="bg-amber-500/20 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">Premium</span>
                        )}
                      </div>
                      <p className="text-amber-500 text-xs font-bold uppercase">{product.category}</p>
                      <p className="text-slate-400 text-xs mt-1 truncate">{product.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black">${Number(product.price).toFixed(2)}</p>
                      <div className="flex gap-2 mt-3 justify-end">
                        {/* Fix 3: aria-labels */}
                        <button
                          onClick={() => openEditProduct(product)}
                          aria-label={`Edit ${product.name}`}
                          className="p-2 bg-white/5 hover:bg-white/15 rounded-xl transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          aria-label={`Delete ${product.name}`}
                          className="p-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-xl transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRINTABLE LABEL (hidden) */}
      <div className="hidden">
        {activePrintOrder && <PrintableLabel ref={printRef} order={activePrintOrder} />}
      </div>

      {/* PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowProductModal(false)} />
          <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden">
            <div className="bg-amber-500 p-6 text-black flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Catalog Manager</p>
                <h2 className="text-lg font-black uppercase">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              </div>
              {/* Fix 3: aria-label on close button */}
              <button onClick={() => setShowProductModal(false)} aria-label="Close product modal">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Product Name *</label>
                <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Premium White Gari"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Price (USD) *</label>
                  <input type="number" step="0.01" min="0" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="25.00"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Category *</label>
                  <input type="text" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="e.g. GARI"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Description</label>
                <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Brief product description..." rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Image Path</label>
                <input type="text" value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="/images/product-name.jpg"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-mono text-sm"
                />
                <p className="text-[10px] text-slate-500 mt-1">Upload images to /public/images/ and reference the path here</p>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_premium" checked={productForm.is_premium as boolean}
                  onChange={e => setProductForm({ ...productForm, is_premium: e.target.checked })}
                  className="w-4 h-4 accent-amber-500"
                />
                <label htmlFor="is_premium" className="text-sm font-bold text-slate-300 cursor-pointer">
                  Mark as Limited Edition / Premium
                </label>
              </div>
              <button type="submit" disabled={savingProduct}
                className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add to Catalog'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}