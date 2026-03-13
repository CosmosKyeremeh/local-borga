"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';

// -------------------------------------------------------------------
// Types
// SHELF         = regular product from food catalog
// CUSTOM_MILLING= custom production order
// FARM_TOOL     = equipment from the farm-tools storefront
// -------------------------------------------------------------------

export type ItemType = 'SHELF' | 'CUSTOM_MILLING' | 'FARM_TOOL';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  type: ItemType;
  quantity: number;
  description?: string;
  config?: {
    millingStyle?: string;
    weightKg?: number;
    texture?: 'Fine' | 'Medium' | 'Coarse';
    instruction?: string;
  };
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (newItem: CartItem) => {
    setCart(prev => {
      // SHELF and FARM_TOOL items: stack quantity if already in cart
      if (newItem.type === 'SHELF' || newItem.type === 'FARM_TOOL') {
        const existing = prev.find(
          item => item.id === newItem.id && item.type === newItem.type
        );
        if (existing) {
          return prev.map(item =>
            item.id === newItem.id && item.type === newItem.type
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          );
        }
      }
      // CUSTOM_MILLING: always a new unique line item
      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: string) =>
    setCart(prev => prev.filter(item => item.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const totalAmount = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};