'use client';
import { useEffect, useState } from 'react';

/**
 * @interface Product
 * Updated to include 'image' field for Task #7: Asset Integration.
 * Matches the TypeScript structure in server/src/index.ts.
 */
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string; // New: Path to product image in /public/images
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    /**
     * Requirement BE.02: Fetching live data from Express Server.
     * Port 5000 is used for the backend service.
     */
    fetch('http://localhost:5000/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      
      {/* Brand Header - Requirement FE.02 (Brand Identity) */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-blue-black-900 mb-2">Local Borga</h1>
        <div className="h-1 w-20 bg-gold-500"></div>
      </header>

      {/* Production Section - Primary Business Feature */}
      <section className="mb-16 border-2 border-gray-100 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">⚙️</span>
          <h2 className="text-2xl font-bold text-blue-black-900">Custom Milling & Production</h2>
        </div>
        <p className="text-gray-600 mb-8">Order custom **Gari, Flours, and Powdered Stuff** milled fresh for you.</p>
        
        {/* Requirement FE.02: Using Brand Gold for Primary Action */}
        <button className="bg-gold-500 hover:bg-yellow-600 text-blue-black-900 font-bold py-4 px-8 rounded-xl transition-all uppercase tracking-wide">
          Build Your Custom Order
        </button>
      </section>

      {/* Retail Section - Task #7 (Asset Integration) */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <span className="text-2xl">🛒</span>
          <h2 className="text-2xl font-bold text-blue-black-900">Fresh & Ready Stock</h2>
        </div>

        {/* Responsive Grid - Requirement FE.01 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all bg-white flex flex-col">
              
              {/* Product Image Container - Task #7 Implementation */}
              <div className="h-52 w-full bg-gray-50 relative border-b border-gray-100">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  // Note: Images must be placed in web-client/public/images/
                />
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <span className="text-[10px] font-black text-gold-500 uppercase tracking-widest">{product.category}</span>
                <h3 className="text-lg font-bold text-blue-black-900 mt-1">{product.name}</h3>
                <p className="text-gray-500 text-xs mt-2 mb-4 line-clamp-2">{product.description}</p>
                
                <div className="mt-auto">
                  <p className="text-xl font-black text-blue-black-900">${product.price.toFixed(2)}</p>
                  
                  {/* Interaction - Requirement #8 (Shopping Cart Prep) */}
                  <button className="mt-4 w-full py-2.5 border-2 border-blue-black-900 text-blue-black-900 font-bold rounded-lg hover:bg-blue-black-900 hover:text-white transition-colors duration-200">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Intercontinental Banner - Requirement FE.05 */}
      <footer className="mt-20 bg-blue-black-900 text-white p-10 rounded-2xl text-center shadow-lg">
        <p className="text-xl font-medium tracking-tight">🌍 Intercontinental Shipping Available</p>
        <p className="text-blue-black-400 text-sm mt-2 opacity-60 text-gray-400">Ghana to the World</p>
      </footer>
    </main>
  );
}