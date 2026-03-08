'use client';

// web-client/app/admin/page.tsx

import { useEffect, useState, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Image from 'next/image';
import {
  Package, CheckCircle, ChevronLeft, RefreshCcw, ShieldCheck,
  TrendingUp, Printer, LogOut, Plus, Pencil, Trash2, X, ImageIcon,
  Users, Mail, MapPin, Phone, ShoppingBag, Settings
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
  millingStyle: string | null;
  weightKg: number | null;
  totalPrice: number;
  status: 'pending' | 'milling' | 'completed';
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: { address?: string; city?: string; country?: string } | null;
  orderType: string | null;
  cartItems: Array<{ name: string; quantity: number; price: number }> | null;
}

interface SupabaseOrderRow {
  id: number;
  item_name: string;
  milling_style: string | null;
  weight_kg: number | null;
  total_price: number;
  status: 'pending' | 'milling' | 'completed';
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: { address?: string; city?: string; country?: string } | null;
  order_type: string | null;
  cart_items: Array<{ name: string; quantity: number; price: number }> | null;
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

interface Customer {
  email: string;
  name: string | null;
  phone: string | null;
  shipping_address: { address?: string; city?: string; country?: string } | null;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
}

const EMPTY_PRODUCT = { name: '', price: '', category: '', description: '', image: '', is_premium: false };

// ── Admin Receipt (printable, all order types) ────────────────────

const AdminReceipt = ({ order, ref: receiptRef }: { order: Order; ref: React.Ref<HTMLDivElement> }) => (
  <div ref={receiptRef as React.RefObject<HTMLDivElement>}
    className="p-8 w-[380px] bg-white text-black"
    style={{ fontFamily: 'monospace' }}
  >
    <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
      <h1 className="text-2xl font-black uppercase tracking-tighter">LOCAL BORGA</h1>
      <p className="text-[10px] uppercase tracking-widest">Admin Copy</p>
    </div>
    <div className="mb-4 space-y-1 text-xs">
      <div className="flex justify-between"><span className="text-gray-500">ORDER #</span><span className="font-black">{order.id}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">DATE</span><span>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">TYPE</span><span className="uppercase">{order.orderType === 'custom_milling' ? 'Custom Milling' : 'Cart Order'}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">STATUS</span><span className="uppercase font-black">{order.status}</span></div>
    </div>
    {(order.customerName || order.customerEmail) && (
      <div className="border-t border-dashed border-gray-300 pt-3 mb-4 text-xs space-y-1">
        <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Customer</p>
        {order.customerName && <p className="font-bold">{order.customerName}</p>}
        {order.customerEmail && <p className="text-gray-600">{order.customerEmail}</p>}
        {order.customerPhone && <p className="text-gray-600">{order.customerPhone}</p>}
        {order.shippingAddress?.address && (
          <p className="text-gray-600">{order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.country}</p>
        )}
      </div>
    )}
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
    <div className="border-t-2 border-black pt-3">
      <div className="flex justify-between font-black text-base">
        <span>TOTAL</span><span>${Number(order.totalPrice).toFixed(2)}</span>
      </div>
    </div>
  </div>
);

// ── Dashboard ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'customers'>('orders');

  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePrintOrder, setActivePrintOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [products, setProducts]               = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct]   = useState<Product | null>(null);
  const [productForm, setProductForm]         = useState<typeof EMPTY_PRODUCT>({ ...EMPTY_PRODUCT });
  const [savingProduct, setSavingProduct]     = useState(false);

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

  // ── Orders ──────────────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Feed Offline');
      const raw: SupabaseOrderRow[] = await res.json();
      setOrders(raw.map(o => ({
        id:              o.id,
        itemName:        o.item_name,
        millingStyle:    o.milling_style,
        weightKg:        o.weight_kg,
        totalPrice:      o.total_price,
        status:          o.status,
        createdAt:       o.created_at,
        customerName:    o.customer_name,
        customerEmail:   o.customer_email,
        customerPhone:   o.customer_phone,
        shippingAddress: o.shipping_address,
        orderType:       o.order_type,
        cartItems:       o.cart_items,
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

  // ── Products ─────────────────────────────────────────────────────
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error();
      setProducts(await res.json());
    } catch { toast.error('Could not load products'); }
    finally { setProductsLoading(false); }
  };

  const openNewProduct = () => { setEditingProduct(null); setProductForm({ ...EMPTY_PRODUCT }); setShowProductModal(true); };
  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ name: p.name, price: String(p.price), category: p.category, description: p.description, image: p.image, is_premium: p.is_premium });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.category) { toast.error('Name, price, and category required'); return; }
    setSavingProduct(true);
    const payload = {
      name: productForm.name, price: parseFloat(productForm.price as string),
      category: productForm.category.toUpperCase(), description: productForm.description,
      image: productForm.image || '/images/placeholder.jpg', is_premium: productForm.is_premium,
    };
    try {
      const url    = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast.success(editingProduct ? 'Product updated' : 'Product added');
      setShowProductModal(false);
      fetchProducts();
    } catch { toast.error('Save failed'); }
    finally { setSavingProduct(false); }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(`${name} deleted`);
      fetchProducts();
    } catch { toast.error('Delete failed'); }
  };

  // ── Analytics ─────────────────────────────────────────────────
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.totalPrice, 0), [orders]);

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    orders.forEach(o => {
      if (!o.customerEmail) return;
      const existing = map.get(o.customerEmail);
      if (existing) {
        existing.orderCount++;
        existing.totalSpent += o.totalPrice;
        if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt;
      } else {
        map.set(o.customerEmail, {
          email:            o.customerEmail,
          name:             o.customerName,
          phone:            o.customerPhone,
          shipping_address: o.shippingAddress,
          orderCount:       1,
          totalSpent:       o.totalPrice,
          lastOrder:        o.createdAt,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const chartData = useMemo(() => {
    const groups = orders.reduce<Record<string, number>>((acc, o) => {
      const date = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + o.totalPrice;
      return acc;
    }, {});
    return Object.keys(groups).map(date => ({ date, revenue: groups[date] })).reverse();
  }, [orders]);

  // ── Render ────────────────────────────────────────────────────
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
            <button onClick={fetchOrders} aria-label="Refresh orders"
              className="flex items-center gap-3 px-6 py-4 bg-white/5 text-white font-black uppercase text-xs tracking-widest rounded-full hover:bg-white/10 transition-all">
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={handleLogout} aria-label="Logout"
              className="flex items-center gap-3 px-6 py-4 bg-red-500/10 text-red-400 font-black uppercase text-xs tracking-widest rounded-full hover:bg-red-500/20 transition-all border border-red-500/20">
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
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-bold">
                <span>Total Orders</span><span className="text-white">{orders.length}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-bold">
                <span>Customers</span><span className="text-white">{customers.length}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-bold">
                <span>Completed</span><span className="text-green-400">{orders.filter(o => o.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-bold">
                <span>In Progress</span><span className="text-amber-400">{orders.filter(o => o.status === 'milling' || o.status === 'pending').length}</span>
              </div>
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
        <div className="flex gap-2 mb-8 flex-wrap">
          {(['orders', 'products', 'customers'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} aria-label={`Switch to ${tab} tab`}
              className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              {tab === 'orders' && <Package size={12} />}
              {tab === 'products' && <Settings size={12} />}
              {tab === 'customers' && <Users size={12} />}
              {tab}
            </button>
          ))}
        </div>

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 px-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  All Orders — {orders.length} total
                </h3>
              </div>
            </div>
            {loading ? (
              <div className="py-32 text-center text-slate-500 font-bold">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <Package size={48} className="mx-auto text-white/10 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest">No Orders Yet</p>
              </div>
            ) : orders.map(order => {
              const isMillingOrder = order.orderType === 'custom_milling' || (order.millingStyle && order.millingStyle !== '—');
              return (
                <div key={order.id} className="group relative bg-[#121212] border border-white/5 p-6 md:p-8 rounded-[2rem] hover:border-amber-500/30 transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-6">

                    {/* Left: Order info */}
                    <div className="flex gap-5 items-start flex-grow min-w-0">
                      {/* Icon */}
                      <div className={`p-3 rounded-xl shrink-0 ${isMillingOrder ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
                        {isMillingOrder
                          ? <Settings size={18} className="text-amber-500" />
                          : <ShoppingBag size={18} className="text-blue-400" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono text-amber-500/40">#{order.id}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isMillingOrder ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'}`}>
                            {isMillingOrder ? 'Custom Milling' : 'Cart Order'}
                          </span>
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight truncate">{order.itemName}</h3>

                        {/* Milling detail */}
                        {isMillingOrder && order.millingStyle && (
                          <p className="text-amber-500 text-xs font-black uppercase tracking-widest mt-1">
                            {order.millingStyle} · {order.weightKg}kg
                          </p>
                        )}

                        {/* Cart items breakdown */}
                        {!isMillingOrder && order.cartItems && order.cartItems.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {order.cartItems.slice(0, 3).map((item, i) => (
                              <p key={i} className="text-xs text-slate-500">{item.quantity}× {item.name}</p>
                            ))}
                            {order.cartItems.length > 3 && (
                              <p className="text-xs text-slate-600">+{order.cartItems.length - 3} more items</p>
                            )}
                          </div>
                        )}

                        {/* Customer info */}
                        {(order.customerName || order.customerEmail) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {order.customerName && (
                              <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-1 rounded-full">{order.customerName}</span>
                            )}
                            {order.customerEmail && (
                              <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full flex items-center gap-1">
                                <Mail size={9} /> {order.customerEmail}
                              </span>
                            )}
                            {order.shippingAddress?.city && (
                              <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full flex items-center gap-1">
                                <MapPin size={9} /> {order.shippingAddress.city}, {order.shippingAddress.country}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-[10px] text-slate-600 mt-2">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Right: Price + actions */}
                    <div className="flex items-center gap-4 md:gap-8 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Revenue</p>
                        <p className="text-2xl font-black">${Number(order.totalPrice).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => preparePrint(order)} aria-label={`Print receipt for order #${order.id}`}
                          className="p-3 bg-white/5 text-white rounded-xl hover:bg-white/20 transition-all">
                          <Printer size={18} />
                        </button>
                        <button onClick={() => updateStatus(order.id, 'milling')} aria-label={`Mark #${order.id} as milling`}
                          className={`p-3 rounded-xl transition-all ${order.status === 'milling' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                          <RefreshCcw size={18} className={order.status === 'milling' ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={() => updateStatus(order.id, 'completed')} aria-label={`Mark #${order.id} as completed`}
                          className={`p-3 rounded-xl transition-all ${order.status === 'completed' ? 'bg-green-600 text-white' : 'bg-white/5 text-white hover:bg-green-600/20'}`}>
                          <CheckCircle size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status bar */}
                  <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full ${order.status === 'pending' ? 'bg-amber-500/20' : order.status === 'milling' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 px-4">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Catalog — {products.length} items</h3>
              </div>
              <button onClick={openNewProduct} aria-label="Add new product"
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-amber-400 transition-all">
                <Plus size={16} /> Add Product
              </button>
            </div>
            {productsLoading ? (
              <div className="py-20 text-center text-slate-500 font-bold">Loading catalog...</div>
            ) : products.length === 0 ? (
              <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <Package size={48} className="mx-auto text-white/10 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest">No products yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-[#121212] border border-white/5 rounded-[2rem] p-6 flex gap-6 items-center hover:border-amber-500/20 transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 overflow-hidden shrink-0 relative">
                      {product.image ? (
                        <Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-white/20" /></div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black uppercase text-sm truncate">{product.name}</h4>
                        {product.is_premium && <span className="bg-amber-500/20 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">Premium</span>}
                      </div>
                      <p className="text-amber-500 text-xs font-bold uppercase">{product.category}</p>
                      <p className="text-slate-400 text-xs mt-1 truncate">{product.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black">${Number(product.price).toFixed(2)}</p>
                      <div className="flex gap-2 mt-3 justify-end">
                        <button onClick={() => openEditProduct(product)} aria-label={`Edit ${product.name}`} className="p-2 bg-white/5 hover:bg-white/15 rounded-xl transition-all"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteProduct(product.id, product.name)} aria-label={`Delete ${product.name}`} className="p-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-xl transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CUSTOMERS TAB ── */}
        {activeTab === 'customers' && (
          <div>
            <div className="flex items-center gap-2 mb-6 px-4">
              <Users size={14} className="text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                {customers.length} Customer{customers.length !== 1 ? 's' : ''} — sorted by spend
              </h3>
            </div>
            {customers.length === 0 ? (
              <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <Users size={48} className="mx-auto text-white/10 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest">No customers yet</p>
                <p className="text-slate-600 text-xs mt-2">Customers appear here once they place orders with their email.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customers.map(customer => (
                  <div key={customer.email} className="bg-[#121212] border border-white/5 rounded-[2rem] p-6 hover:border-amber-500/20 transition-all">
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
                        <span className="text-amber-500 font-black text-lg">{(customer.name ?? customer.email)[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <div>
                            <h4 className="font-black uppercase text-sm">{customer.name ?? 'Guest Customer'}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Mail size={11} className="text-slate-600" />
                              <p className="text-slate-400 text-xs">{customer.email}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-black text-amber-500">${customer.totalSpent.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest">{customer.orderCount} order{customer.orderCount > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {customer.phone && (
                            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-white/5 px-3 py-1.5 rounded-full"><Phone size={10} />{customer.phone}</span>
                          )}
                          {customer.shipping_address?.address && (
                            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-white/5 px-3 py-1.5 rounded-full">
                              <MapPin size={10} />{customer.shipping_address.address}{customer.shipping_address.city && `, ${customer.shipping_address.city}`}{customer.shipping_address.country && `, ${customer.shipping_address.country}`}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-600 bg-white/5 px-3 py-1.5 rounded-full">
                            Last: {new Date(customer.lastOrder).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hidden printable receipt (admin copy, works for all order types) */}
        <div className="hidden print:block">
          {activePrintOrder && <AdminReceipt order={activePrintOrder} ref={printRef} />}
        </div>

        {/* Hidden div for react-to-print (must be in DOM) */}
        <div className="hidden">
          {activePrintOrder && <AdminReceipt order={activePrintOrder} ref={printRef} />}
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
                <button onClick={() => setShowProductModal(false)} aria-label="Close product modal"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveProduct} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Product Name *</label>
                  <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Premium White Gari"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Price (USD) *</label>
                    <input type="number" step="0.01" min="0" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="25.00"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Category *</label>
                    <input type="text" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} placeholder="e.g. GARI"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium uppercase" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Description</label>
                  <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Brief product description..." rows={2}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Image Path</label>
                  <input type="text" value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} placeholder="/images/product-name.jpg"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-mono text-sm" />
                  <p className="text-[10px] text-slate-500 mt-1">Upload images to /public/images/ then paste the path here</p>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="is_premium" checked={productForm.is_premium as boolean} onChange={e => setProductForm({ ...productForm, is_premium: e.target.checked })} className="w-4 h-4 accent-amber-500" />
                  <label htmlFor="is_premium" className="text-sm font-bold text-slate-300 cursor-pointer">Mark as Limited Edition / Premium</label>
                </div>
                <button type="submit" disabled={savingProduct}
                  className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}