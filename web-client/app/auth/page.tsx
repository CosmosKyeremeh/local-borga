'use client';

// web-client/app/auth/page.tsx
// Sign In / Sign Up page.
// Reads ?redirect= param → passes it through OAuth callback → lands back at the right place.

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabaseBrowser } from '@/src/lib/supabase/browser';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'signin' | 'signup';

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function AuthForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get('redirect') ?? '/';

  const [mode, setMode]               = useState<Mode>('signin');
  const [loading, setLoading]         = useState(false);
  const [oauthLoading, setOAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent]     = useState(false); // sign-up confirmation state

  const [form, setForm] = useState({ name: '', email: '', password: '' });

  // If user is already logged in, bounce them away immediately
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session?.user) router.replace(redirect);
    });
  }, [redirect, router]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  // ─── Email / Password submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabaseBrowser.auth.signInWithPassword({
          email:    form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success('Welcome back!');
        router.replace(redirect);

      } else {
        // sign up — include full_name in metadata so checkout prefill works
        const { error } = await supabaseBrowser.auth.signUp({
          email:    form.email,
          password: form.password,
          options: {
            data:         { full_name: form.name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
          },
        });
        if (error) throw error;
        // Supabase sends a confirmation email — show a holding screen
        setEmailSent(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setOAuthLoading(true);
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setOAuthLoading(false);
    }
    // on success, browser navigates away — no need to reset loading
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setForm({ name: '', email: '', password: '' });
    setEmailSent(false);
  };

  // ─── Email-sent screen ──────────────────────────────────────────────────────
  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-black" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Check your inbox</h2>
        <p className="text-slate-500 text-sm font-medium mb-2">
          We sent a confirmation link to
        </p>
        <p className="font-black text-slate-900 text-sm mb-6">{form.email}</p>
        <p className="text-xs text-slate-400 mb-8 leading-relaxed">
          Click the link in the email to activate your account.<br />
          It may take a minute or two to arrive.
        </p>
        <button
          onClick={() => switchMode('signin')}
          className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors"
        >
          ← Back to Sign In
        </button>
      </motion.div>
    );
  }

  // ─── Main form ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mode toggle */}
      <div className="flex bg-slate-100 rounded-2xl p-1 mb-8">
        {(['signin', 'signup'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === m
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {m === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogle}
        disabled={oauthLoading}
        className="w-full flex items-center justify-center gap-3 py-4 border-2 border-slate-200 rounded-2xl hover:border-slate-900 transition-all font-black text-sm text-slate-700 mb-6 disabled:opacity-50"
      >
        {oauthLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          /* Google's own "G" rendered in its brand colours */
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">or</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Email / password form */}
      <AnimatePresence mode="wait">
        <motion.form
          key={mode}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {/* Full name — sign up only */}
          {mode === 'signup' && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Kwame Asante"
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-medium text-slate-900 placeholder:text-slate-300"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-medium text-slate-900 placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!form.email) { toast.error('Enter your email first'); return; }
                    const { error } = await supabaseBrowser.auth.resetPasswordForEmail(form.email, {
                      redirectTo: `${window.location.origin}/auth/callback?redirect=/account`,
                    });
                    if (error) toast.error(error.message);
                    else toast.success('Password reset link sent!');
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                minLength={mode === 'signup' ? 8 : undefined}
                value={form.password}
                onChange={set('password')}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                className="w-full pl-10 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-medium text-slate-900 placeholder:text-slate-300"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
              : mode === 'signin' ? 'Sign In →' : 'Create Account →'
            }
          </button>
        </motion.form>
      </AnimatePresence>
    </>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* Minimal top bar */}
      <nav className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="Local Borga logo" width={36} height={36} className="rounded-sm object-contain" />
          <span className="font-black uppercase tracking-tighter text-lg text-slate-900">Local Borga</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 transition-colors">
          <ArrowLeft size={13} /> Back to Store
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-3">
              Your Account
            </p>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
              Welcome<br />
              <span className="text-amber-500 italic font-serif">Back.</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm mt-4">
              Sign in to track orders and speed up checkout.
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100"
          >
            {/* useSearchParams() requires Suspense */}
            <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>}>
              <AuthForm />
            </Suspense>
          </motion.div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-8">
            🔒 Secured by Supabase Auth
          </p>
        </div>
      </div>
    </main>
  );
}