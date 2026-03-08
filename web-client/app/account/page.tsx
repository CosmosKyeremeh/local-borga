'use client';

// web-client/app/account/page.tsx

// Customer's personal dashboard — order history, profile, logout

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package, LogOut, ArrowLeft, User, Clock,
  CheckCircle, RefreshCcw, ChevronRight, ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { supabaseBrowser } from '@/src/lib/supabase/browser';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Order {
  id: number;
  item_name: string;
  total_price: number;
  status: 'pending' | 'milling' | 'completed';
  created_at: string;
  order_type: string;
  cart_items: Array<{ name: string; quantity: number; price: number }> | null;
  milling_style: string | null;
  weight_kg: number | null;
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'text-amber-500',  bg: 'bg-amber-500/10',  icon: Clock },
  milling:   { label: 'Milling',   color: 'text-blue-400',   bg: 'bg-blue-400/10',   icon: RefreshCcw },
  completed: { label: 'Completed', color: 'text-green-400',  bg: 'bg-green-400/10',  icon: CheckCircle },
};

export default function AccountPage() {
  const [user, setUser]     = useState<SupabaseUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
      await fetchOrders(session.user.email!);
    };
    init();
  }, []);

  // Supabase Realtime — update order status live
  useEffect(() => {
    if (!user) return;
    const channel = supabaseBrowser
      .channel('customer-order-updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as Order;
          setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o));
          const cfg = STATUS_CONFIG[updated.status];
          toast.success(`Order #${updated.id} is now ${cfg.label}!`);
        }
      )
      .subscribe();
    return () => { supabaseBrowser.removeChannel(channel); };
  }, [user]);

  const fetchOrders = async (email: string) => {
    try {
      setLoading(true);
      // Fetch orders by email (covers both guest + auth orders with same email)
      const { data, error } = await supabaseBrowser
        .from('orders')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data ?? []);
    } catch { toast.error('Could not load orders'); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    toast.success('Signed out');
    router.push('/');
  };

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Customer';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <RefreshCcw size={32} className="animate-spin text-amber-500" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">

        {/* Back to store */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-amber-500 transition-colors text-xs font-black uppercase tracking-widest mb-10">
          <ArrowLeft size={14} /> Back to Store
        </Link>

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] rounded-[2rem] p-8 border border-white/5 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center">
                <span className="text-black font-black text-lg">{initials}</span>
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">{displayName}</h1>
                <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
                {user?.app_metadata?.provider === 'google' && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/60 mt-1 block">Via Google</span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-xs font-black uppercase tracking-widest border border-red-500/10"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </motion.div>

        {/* Orders */}
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Your Orders — {orders.length} total
            </h2>
          </div>
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1">
            Shop <ChevronRight size={12} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-[#111] rounded-[2rem] p-16 text-center border border-white/5"
          >
            <Package size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No orders yet</p>
            <Link href="/" className="inline-block mt-6 px-8 py-3 bg-amber-500 text-black font-black rounded-full uppercase text-xs tracking-widest hover:bg-amber-400 transition-all">
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, idx) => {
              const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className="bg-[#111] rounded-[1.5rem] p-6 border border-white/5 hover:border-amber-500/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-mono text-amber-500/40">#{order.id}</span>
                        <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${status.bg} ${status.color}`}>
                          <StatusIcon size={10} className={order.status === 'milling' ? 'animate-spin' : ''} />
                          {status.label}
                        </span>
                      </div>
                      <h3 className="font-black uppercase text-sm leading-tight truncate">{order.item_name}</h3>

                      {/* Cart items breakdown */}
                      {order.cart_items && order.cart_items.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {order.cart_items.map((item, i) => (
                            <p key={i} className="text-xs text-slate-500">
                              {item.quantity}× {item.name}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Milling details */}
                      {order.milling_style && (
                        <p className="text-xs text-slate-500 mt-1">{order.milling_style} · {order.weight_kg}kg</p>
                      )}

                      <p className="text-[10px] text-slate-600 mt-2 font-medium">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black">${Number(order.total_price).toFixed(2)}</p>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-1 font-bold">
                        {order.order_type === 'custom_milling' ? 'Custom Mill' : 'Cart Order'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Tracking reminder */}
        {orders.length > 0 && (
          <div className="mt-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping shrink-0" />
            <p className="text-slate-400 text-xs font-medium">
              Order statuses update in real-time. You&apos;ll see changes here and receive toast notifications when your production status changes.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}