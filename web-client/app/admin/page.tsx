'use client';

import { useEffect, useState, useMemo, useRef } from 'react'; 
import { useReactToPrint } from 'react-to-print';
import { 
  Package, Clock, CheckCircle, ChevronLeft, RefreshCcw,
  ShieldCheck, TrendingUp, Droplets, DollarSign, Printer
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PrintableLabel } from './components/PrintableLabel';

interface Order {
  id: number;
  itemName: string;
  millingStyle: string;
  weightKg: number;
  totalPrice: number;
  status: 'pending' | 'milling' | 'completed';
  createdAt: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePrintOrder, setActivePrintOrder] = useState<Order | null>(null); // State for printing
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null); // Ref for the label

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // --- Print Configuration ---
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const preparePrint = (order: Order) => {
    setActivePrintOrder(order);
    // Trigger print dialog after state update
    setTimeout(() => handlePrint(), 150);
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchOrders();
    }
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/orders`);
      if (!res.ok) throw new Error('Backend Offline');
      const data = await res.json();
      setOrders(data.reverse()); 
    } catch (err) {
      toast.error("Production Feed Offline");
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const groups = orders.reduce((acc: any, order) => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + order.totalPrice;
      return acc;
    }, {});

    return Object.keys(groups).map(date => ({
      date,
      revenue: groups[date]
    })).reverse();
  }, [orders]);

  const totalRevenue = useMemo(() => 
    orders.reduce((sum, order) => sum + order.totalPrice, 0), 
  [orders]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Order #${id.toString().slice(-4)} updated to ${newStatus}`);
        fetchOrders(); 
      }
    } catch (err) {
      toast.error("Broadcast Failed");
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-amber-500/20 pb-8">
          <div>
            <Link href="/" className="text-amber-500/50 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] mb-4 hover:text-amber-500 transition-all">
              <ChevronLeft size={14} /> Return to Store
            </Link>
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4">
              <span className="bg-amber-500 text-black px-3 py-1 rounded-sm italic">B&</span> COMMAND CENTER
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium flex items-center gap-2">
              <ShieldCheck size={14} className="text-amber-500" /> Executive Analytics & Production Control
            </p>
          </div>
          <button onClick={fetchOrders} className="mt-6 md:mt-0 flex items-center gap-3 px-8 py-4 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20">
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} /> Refresh Queue
          </button>
        </header>

        {/* Analytics Section */}
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
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#475569'}} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{backgroundColor: '#1a1a1a', borderRadius: '12px', border: 'none', color: '#fff'}} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Production Feed */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-2 mb-4 px-4">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Live Production Feed</h3>
          </div>
          {orders.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
              <Package size={48} className="mx-auto text-white/10 mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest">No Active Orders</p>
            </div>
          ) : (
            orders.map((order) => (
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
                    {/* NEW: Print Button */}
                    <button 
                      onClick={() => preparePrint(order)}
                      className="p-4 bg-white/5 text-white rounded-2xl hover:bg-white/20 transition-all"
                      title="Print Label"
                    >
                      <Printer size={20} />
                    </button>

                    <button onClick={() => updateStatus(order.id, 'milling')} className={`p-4 rounded-2xl transition-all ${order.status === 'milling' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                      <RefreshCcw size={20} className={order.status === 'milling' ? 'animate-spin-slow' : ''} />
                    </button>
                    <button onClick={() => updateStatus(order.id, 'completed')} className={`p-4 rounded-2xl transition-all ${order.status === 'completed' ? 'bg-green-600 text-white' : 'bg-white/5 text-white hover:bg-green-600/20'}`}>
                      <CheckCircle size={20} />
                    </button>
                  </div>
                </div>
                <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full ${order.status === 'pending' ? 'bg-amber-500/20' : order.status === 'milling' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* HIDDEN PRINTABLE COMPONENT */}
      <div className="hidden">
        {activePrintOrder && <PrintableLabel ref={printRef} order={activePrintOrder} />}
      </div>
    </main>
  );
}