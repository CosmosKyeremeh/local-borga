"use client"; // Required for Next.js app router
import React, { createContext, useContext, useState, useMemo } from 'react';

// Define what a Local Borga product looks like
export type ItemCategory = 'SHELF' | 'MILLING_MACHINE';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: ItemCategory;
  quantity: number;
  config?: {
    texture?: 'Fine' | 'Medium' | 'Coarse';
    instruction?: string;
  };
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Logic to add items
  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      // If it's a SHELF item that already exists, just increase quantity
      const isExistingShelfItem = prev.find(item => item.id === newItem.id && item.category === 'SHELF');
      
      if (isExistingShelfItem) {
        return prev.map(item => 
          item.id === newItem.id ? { ...item, quantity: item.quantity + newItem.quantity } : item
        );
      }
      // If it's a MILLING item (custom), add it as a new unique entry
      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const clearCart = () => setCart([]);
  
  // Calculate total price automatically
  const totalAmount = useMemo(() => 
    cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), 
  [cart]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};