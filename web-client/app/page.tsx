'use client';
import { useEffect, useState } from 'react';

// Define what a Product looks like for TypeScript
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Fetching the expanded list from your server
    fetch('http://localhost:5000/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      {/* Brand Header - Requirement FE.02 */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-blue-black-900 mb-2">Local Borga</h1>
        <div className="h-1 w-20 bg-gold-500"></div>
      </header>

      {/* Production Section - Requirement FE.04 */}
      <section className="mb-16 border-2 border-gray-100 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">⚙️</span>
          <h2 className="text-2xl font-bold text-blue-black-900">Custom Milling & Production</h2>
        </div>
        <p className="text-gray-600 mb-8">Order custom **Gari, Flours, and Powdered Stuff** milled fresh for you.</p>
        
        {/* The Gold CTA Button */}
        <button className="bg-gold-500 hover:bg-yellow-600 text-blue-black-900 font-bold py-4 px-8 rounded-xl transition-all uppercase tracking-wide">
          Build Your Custom Order
        </button>
      </section>

      {/* Retail Section (The API Data) - Requirement FE.03 */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <span className="text-2xl">🛒</span>
          <h2 className="text-2xl font-bold text-blue-black-900">Fresh & Ready Stock</h2>
        </div>

        {/* Responsive Grid - Requirement FE.01 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <span className="text-xs font-bold text-gold-500 uppercase">{product.category}</span>
              <h3 className="text-xl font-bold text-blue-black-900 mt-1">{product.name}</h3>
              <p className="text-gray-500 text-sm mt-2 mb-4">{product.description}</p>
              <p className="text-lg font-bold text-blue-black-900">${product.price.toFixed(2)}</p>
              <button className="mt-4 w-full py-2 border border-blue-black-900 text-blue-black-900 rounded-lg hover:bg-blue-black-900 hover:text-white transition-colors">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Intercontinental Banner - Requirement FE.05 */}
      <footer className="mt-20 bg-blue-black-900 text-white p-8 rounded-2xl text-center">
        <p className="text-xl font-medium">🌍 Intercontinental Shipping Available</p>
      </footer>
    </main>
  );
}