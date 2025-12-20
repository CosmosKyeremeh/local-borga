'use client';

import { useEffect, useState } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  ChevronLeft, 
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  Droplets
} from 'lucide-react';
import Link from 'next/link';

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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/orders');
      if (!res.ok) throw new Error('Backend Offline');
      const data = await res.json();
      setOrders(data.reverse()); 
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await fetch(`http://localhost:5000/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders(); 
    } catch (err) {
      alert("Status update failed.");
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        
        {/* Bongr& Branding Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-amber-500/20 pb-8">
          <div>
            <Link href="/" className="text-amber-500/50 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] mb-4 hover:text-amber-500 transition-all">
              <ChevronLeft size={14} /> Return to Store
            </Link>
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4">
              <span className="bg-amber-500 text-black px-3 py-1 rounded-sm italic">B&</span> 
              COMMAND CENTER
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium flex items-center gap-2">
              <Droplets size={14} className="text-amber-500" /> Nurturing Growth Through Production
            </p>
          </div>
          
          <button 
            onClick={fetchOrders}
            className="mt-6 md:mt-0 flex items-center gap-3 px-8 py-4 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh Queue
          </button>
        </header>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 gap-4">
          {orders.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
              <Package size={48} className="mx-auto text-white/10 mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest">No Active Orders</p>
            </div>
          ) : (
            orders.map((order) => (
              <div 
                key={order.id} 
                className="group relative bg-[#121212] border border-white/5 p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center transition-all hover:border-amber-500/30 hover:bg-[#161616]"
              >
                <div className="flex gap-8 items-center w-full md:w-auto">
                  <div className="text-xs font-mono text-amber-500/30 rotate-90 md:rotate-0">
                    #{order.id.toString().slice(-4)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">{order.itemName}</h3>
                    <p className="text-amber-500 text-xs font-black uppercase tracking-widest mt-1">
                      {order.millingStyle} Milling • {order.weightKg}kg
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-12 mt-8 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Revenue</p>
                    <p className="text-2xl font-black">${order.totalPrice.toFixed(2)}</p>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateStatus(order.id, 'milling')}
                      className={`p-4 rounded-2xl transition-all ${order.status === 'milling' ? 'bg-amber-500 text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
                      title="Set to Milling"
                    >
                      <RefreshCcw size={20} />
                    </button>
                    <button 
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="p-4 bg-white/5 text-white rounded-2xl hover:bg-green-600 transition-all"
                      title="Complete Order"
                    >
                      <CheckCircle size={20} />
                    </button>
                  </div>
                </div>
                
                {/* Status Indicator Bar */}
                <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full ${
                  order.status === 'pending' ? 'bg-amber-500/20' : 
                  order.status === 'milling' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
                }`} />
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}