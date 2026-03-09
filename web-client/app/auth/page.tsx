'use client';

// web-client/app/auth/page.tsx
// Handles: Login, Signup, Google OAuth
// Redirects to /account after auth, or back to store if came from checkout
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { supabaseBrowser } from '@/src/lib/supabase/browser';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const [mode, setMode]         = useState<AuthMode>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirect') ?? '/account';

  // Redirect if already logged in
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session) router.push(redirectTo);
    });
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabaseBrowser.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success('Account created! Check your email to confirm.');
      } else {
        const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabaseBrowser.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-amber-500 transition-colors text-xs font-black uppercase tracking-widest mb-10">
          <ArrowLeft size={14} /> Back to Store
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] rounded-[2rem] overflow-hidden border border-white/5">

          {/* Header */}
          <div className="p-8 border-b border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Image src="/logo.jpg" alt="Local Borga" width={32} height={32} className="rounded-sm" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Local Borga</span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {mode === 'login' ? 'Sign in to view your orders and saved details.' : 'Save your details and track all your orders in one place.'}
            </p>
          </div>

          <div className="p-8 space-y-5">

            {/* Google OAuth */}
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black font-black rounded-2xl hover:bg-slate-100 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
            >
              <Chrome size={18} />
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-grow h-px bg-white/5" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">or</span>
              <div className="flex-grow h-px bg-white/5" />
            </div>

            {/* Email / Password form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Kwame Asante"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-5 py-4 pr-14 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  : mode === 'login' ? 'Sign In' : 'Create Account'
                }
              </button>
            </form>

            {/* Toggle mode */}
            <p className="text-center text-slate-500 text-sm">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-amber-500 font-black hover:text-amber-400 transition-colors uppercase text-xs tracking-widest"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </motion.div>

        <p className="text-center text-slate-700 text-xs mt-6 font-bold uppercase tracking-widest">
          Local Borga © 2025 — Accra, Ghana
        </p>
      </div>
    </main>
  );
}