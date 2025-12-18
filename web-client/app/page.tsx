// D:\cdm\web\local-borga\web-client\app\page.tsx

import React from 'react';

// The main component for the Local Borga Homepage
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Header/Navigation Placeholder */}
      <header className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-green-700">Local Borga</h1>
          <p className="text-sm text-gray-500 hidden sm:block">Shop all your local foods stuffs here.</p>
        </div>
      </header>

      {/* Main Content Area: The Core Split Section */}
      <main className="container mx-auto p-4 lg:p-8">
        
        {/* Grid Container for Side-by-Side Layout on Large Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ====== LEFT SECTION: FRESH GOODS (The Retail Store) ====== */}
          <section className="bg-white rounded-xl shadow-lg border-t-4 border-yellow-500 p-6">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-4 flex items-center">
              🛒 Fresh & Ready Stock
            </h2>
            <p className="text-gray-600 mb-6">
              Quickly shop **Veges, Game, and Oils** available for immediate delivery.
            </p>

            {/* Product Category Cards Placeholder */}
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-lg text-gray-700">1. Produce & Food Stuff</h3>
                <p className="text-sm text-gray-500">Cassava, Plantain, Yam, etc.</p>
                <a href="#" className="text-sm text-yellow-600 font-medium hover:underline">Browse Veges →</a>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-lg text-gray-700">2. Oils & Medicinal Items</h3>
                <p className="text-sm text-gray-500">Red Oil, Adwe Ngo, Lime, Camwood.</p>
                <a href="#" className="text-sm text-yellow-600 font-medium hover:underline">Explore Wellness →</a>
              </div>
            </div>

            {/* Call to Action */}
            <button className="mt-8 w-full bg-yellow-600 text-white font-bold py-3 rounded-lg hover:bg-yellow-700 transition duration-200">
              START FRESH SHOPPING
            </button>
          </section>
          
          {/* ====== RIGHT SECTION: THE PRODUCTION ROOM (The Unique Service) ====== */}
          <section className="bg-white rounded-xl shadow-lg border-t-4 border-green-700 p-6">
            <h2 className="2xl:text-3xl text-2xl font-extrabold text-gray-800 mb-4 flex items-center">
              ⚙️ Custom Milling & Production
            </h2>
            <p className="text-gray-600 mb-6">
              Order custom **Gari, Flours, and Powdered Stuff** milled fresh for you.
            </p>

            {/* Live Production Status Interactive Widget (2025 Feature) */}
            <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-200">
              <h3 className="font-semibold text-lg text-gray-700 flex justify-between items-center">
                <span className="animate-pulse text-green-700">LIVE: 5 Orders In Queue</span>
                <span className="text-sm text-gray-500">Updated: 10s ago</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Track the journey from raw cassava to packaged flour.
              </p>
            </div>
            
            {/* Custom Order Form Placeholder */}
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-lg text-gray-700">1. Select Product</h3>
                <p className="text-sm text-gray-500">Custom Gari (Fine/Rough), Flour, Dough Mixes.</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-lg text-gray-700">2. Configure Order</h3>
                <p className="text-sm text-gray-500">Weight (Kg), Texture, Additives.</p>
              </div>
            </div>
            
            {/* Call to Action */}
            <button className="mt-8 w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:bg-green-800 transition duration-200">
              BUILD YOUR CUSTOM ORDER
            </button>
          </section>
        </div>

        {/* Intercontinental Footer Banner */}
        <div className="mt-8 bg-blue-900 text-white p-6 rounded-xl shadow-xl text-center">
            <h3 className="text-xl font-bold">🌍 Intercontinental Shipping Available</h3>
            <p className="text-sm text-blue-300">We package and ship dried/milled goods globally to the diaspora.</p>
        </div>

      </main>

    </div>
  );
}