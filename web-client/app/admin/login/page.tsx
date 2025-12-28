'use client';

import { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem('adminToken', data.token); // Store session
      toast.success("Welcome back, CEO");
      router.push('/admin');
    } else {
      toast.error("Access Denied: Incorrect Credentials");
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#121212] border border-white/5 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>
        
        <header className="text-center mb-10">
          <div className="inline-flex p-4 bg-amber-500 text-black rounded-2xl mb-6 shadow-lg shadow-amber-500/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">Restricted Access</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Local Borga Executive Terminal</p>
        </header>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="password" 
              placeholder="Enter Security Code"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-amber-500 transition-all font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-amber-500 transition-all uppercase text-sm tracking-widest">
            Authorize <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </main>
  );
}