'use client';

// web-client/app/admin/login/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const router                      = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsLoading(true);

    try {
      // ✅ Relative URL — works on localhost AND Vercel
      const res = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error('Access Denied');
        return;
      }

      // Store token and redirect to dashboard
      localStorage.setItem('adminToken', data.token);
      toast.success('Access Granted');
      router.push('/admin');
    } catch {
      toast.error('Connection Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-6">
            <ShieldCheck size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium uppercase tracking-widest">
            Local Borga — Executive Access
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-[#121212] rounded-[2rem] p-10 border border-white/5">
          <div className="mb-8">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter access code..."
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-mono outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 pr-14"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading
              ? <><Loader2 size={18} className="animate-spin" /> Verifying...</>
              : 'Authenticate'
            }
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs font-bold uppercase tracking-widest mt-8">
          Local Borga © 2025
        </p>
      </div>
    </main>
  );
}