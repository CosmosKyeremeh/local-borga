"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';

// -------------------------------------------------------------------
// Types — unified to cover both storefront and admin usage
// -------------------------------------------------------------------

// SHELF = regular product from catalog
// CUSTOM_MILLING = custom production order
export type ItemType = 'SHELF' | 'CUSTOM_MILLING';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;      // Free-form string (e.g. 'GARI', 'FLOUR', 'CUSTOM')
  type: ItemType;        // Controls cart behaviour (stack vs unique)
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
  cartCount: number;     // Total number of items (sum of quantities)
}

// -------------------------------------------------------------------
// Context
// -------------------------------------------------------------------

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (newItem: CartItem) => {
    setCart(prev => {
      // SHELF items: stack quantity if already in cart
      if (newItem.type === 'SHELF') {
        const existing = prev.find(
          item => item.id === newItem.id && item.type === 'SHELF'
        );
        if (existing) {
          return prev.map(item =>
            item.id === newItem.id && item.type === 'SHELF'
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
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity } : item))
    );
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
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalAmount,
      cartCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};