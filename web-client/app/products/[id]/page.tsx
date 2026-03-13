'use client';

// web-client/app/products/[id]/page.tsx
// Individual product detail page.
// Works for both staples (section=staples) and farm tools (section=farm_tools).
// After adding to cart, redirects back to the correct storefront.

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Minus, ShoppingCart, ShieldCheck,
  Loader2, Star, Tractor, Globe, Package
} from 'lucide-react';
import { useCart } from '@/src/context/CartContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  is_premium?: boolean;
  stock_quantity?: number;
  section?: string;
}

// ─── Parallax hero wrapper ────────────────────────────────────────────────────

function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 120]);

  return (
    <div className="relative w-full h-[55vh] md:h-[70vh] overflow-hidden bg-slate-100">
      <motion.div style={{ y }} className="absolute inset-0 scale-110">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      {/* Gradient fade into page */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
    </div>
  );
}

// ─── Related product card ─────────────────────────────────────────────────────

function RelatedCard({ product }: { product: Product }) {
  const isFarmTool = product.section === 'farm_tools';
  return (
    <Link href={`/products/${product.id}`}
      className="group block border border-slate-100 rounded-[1.5rem] overflow-hidden hover:shadow-xl transition-all duration-500 bg-white"
    >
      <div className="h-44 bg-slate-50 relative overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>
      <div className="p-5">
        <span className="text-[8px] font-black uppercase tracking-widest text-amber-500">
          {product.category}
        </span>
        <h4 className="font-black text-slate-900 uppercase text-sm leading-tight mt-1 mb-3">
          {product.name}
        </h4>
        <div className="flex items-center justify-between">
          <span className="font-black text-slate-900">${product.price.toFixed(2)}</span>
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${isFarmTool ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
            {isFarmTool ? '🚜 Tool' : '🌾 Staple'}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart, cartCount } = useCart();

  const [product, setProduct]     = useState<Product | null>(null);
  const [related, setRelated]     = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);  // true = loading on mount
  const [notFound, setNotFound]   = useState(false);
  const [quantity, setQuantity]   = useState(1);
  const [adding, setAdding]       = useState(false);

  const isFarmTool  = product?.section === 'farm_tools';
  const stock       = product?.stock_quantity ?? 99;
  const outOfStock  = stock === 0;
  const lowStock    = stock > 0 && stock <= 5;
  const backHref    = isFarmTool ? '/farm-tools' : '/';
  const backLabel   = isFarmTool ? 'Farm Tools' : 'Store';

  // ── Fetch product ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(async r => {
        if (r.status === 404) { setNotFound(true); return; }
        const data = await r.json();
        setProduct(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  // ── Fetch related products (same category, different id) ──────────────────
  useEffect(() => {
    if (!product) return;
    const section = product.section ?? 'staples';
    fetch(`/api/products?section=${section}`)
      .then(r => r.json())
      .then((all: Product[]) => {
        const others = all
          .filter(p => p.id !== product.id && p.category === product.category)
          .slice(0, 4);
        // If fewer than 2 in same category, fill with anything from same section
        if (others.length < 2) {
          const fill = all
            .filter(p => p.id !== product.id && !others.find(o => o.id === p.id))
            .slice(0, 4 - others.length);
          setRelated([...others, ...fill]);
        } else {
          setRelated(others);
        }
      })
      .catch(() => setRelated([]));
  }, [product]);

  // ── Add to cart ───────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!product || outOfStock) return;
    setAdding(true);
    await new Promise(r => setTimeout(r, 400)); // micro-delay for UX feel

    addToCart({
      id:          isFarmTool ? `ft-${product.id}` : product.id.toString(),
      name:        product.name,
      price:       product.price,
      image:       product.image,
      category:    product.category,
      description: product.description,
      type:        isFarmTool ? 'FARM_TOOL' : 'SHELF',
      quantity,
    });

    toast.success(`${product.name} added to cart`, {
      action: { label: `Back to ${backLabel}`, onClick: () => router.push(backHref) },
    });
    setAdding(false);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-amber-500" />
      </main>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !product) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6">
        <p className="text-6xl">🌾</p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Product Not Found</h1>
        <p className="text-slate-400 font-medium">This product doesn`t exist or has been removed.</p>
        <Link href="/" className="px-8 py-4 bg-amber-500 text-black font-black rounded-2xl uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
          Back to Store
        </Link>
      </main>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="bg-white min-h-screen">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href={backHref}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft size={14} /> {backLabel}
          </Link>

          <Link href="/" className="font-black uppercase tracking-tighter text-lg text-slate-900">
            Local <span className="text-amber-500 italic font-serif">Borga.</span>
          </Link>

          {/* Cart badge */}
          <Link href={backHref}
            className="relative p-2 hover:bg-slate-50 rounded-full transition-colors"
            aria-label="Go to store"
          >
            <ShoppingCart size={22} className="text-slate-900" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* ── HERO IMAGE — parallax ── */}
      <div className="pt-[72px]">
        <ParallaxImage src={product.image} alt={product.name} />
      </div>

      {/* ── PRODUCT INFO ── */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 py-16">

          {/* Left — identity */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Category + section badge */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full">
                {product.category}
              </span>
              {isFarmTool ? (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                  <Tractor size={10} /> Farm Equipment
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                  <Globe size={10} /> Ghanaian Staple
                </span>
              )}
              {product.is_premium && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
                  <Star size={9} fill="currentColor" /> Premium
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-6">
              {product.name}
            </h1>

            {/* Description */}
            <p className="text-slate-500 text-base font-medium leading-relaxed mb-8 max-w-lg">
              {product.description}
            </p>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-4 mb-8">
              {[
                { icon: <ShieldCheck size={14} />, label: 'Quality Assured' },
                { icon: <Package size={14} />,     label: 'Intercontinental Shipping' },
                { icon: <Globe size={14} />,        label: 'Direct from Accra' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="text-amber-500">{icon}</span> {label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — purchase */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:sticky lg:top-28 self-start"
          >
            <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8">

              {/* Price */}
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Price</p>
                <p className="text-5xl font-black text-slate-900">${product.price.toFixed(2)}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">per unit · USD</p>
              </div>

              {/* Stock status */}
              <div className="mb-6">
                {outOfStock ? (
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-4 py-2 rounded-full">
                    <span className="w-2 h-2 bg-red-500 rounded-full" /> Out of Stock
                  </span>
                ) : lowStock ? (
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-4 py-2 rounded-full">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" /> Only {stock} left
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-700 bg-green-50 px-4 py-2 rounded-full">
                    <span className="w-2 h-2 bg-green-500 rounded-full" /> In Stock
                  </span>
                )}
              </div>

              {/* Quantity selector */}
              {!outOfStock && (
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Quantity</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        aria-label="Decrease quantity"
                        className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-xl transition-colors"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="font-black text-slate-900 w-10 text-center text-lg">{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                        aria-label="Increase quantity"
                        className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-amber-500 hover:text-black text-slate-700 rounded-xl transition-colors"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <span className="text-sm font-black text-slate-900">
                      = <span className="text-amber-500">${(product.price * quantity).toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Add to cart */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={outOfStock || adding}
                className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mb-3"
              >
                {adding
                  ? <><Loader2 size={18} className="animate-spin" /> Adding…</>
                  : outOfStock
                  ? 'Out of Stock'
                  : <><ShoppingCart size={16} /> Add to Cart</>
                }
              </motion.button>

              {/* Back to browse */}
              <Link href={backHref}
                className="w-full py-4 border-2 border-slate-200 text-slate-600 font-black rounded-2xl uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all flex items-center justify-center gap-2 text-[11px]"
              >
                <ArrowLeft size={13} /> Continue Browsing
              </Link>

              <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                🔒 Secured by Paystack · Ships from Accra
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── RELATED PRODUCTS ── */}
        {related.length > 0 && (
          <section className="pb-20">
            <div className="border-t border-slate-100 pt-16 mb-10">
              <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
                You May Also <span className="text-amber-500 italic font-serif">Like.</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.07 }}
                >
                  <RelatedCard product={p} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}