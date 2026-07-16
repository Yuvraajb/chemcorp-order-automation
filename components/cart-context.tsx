"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { CartItem } from "@/lib/types";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "chemcorp-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage is only readable after mount; hydrating here avoids an SSR mismatch.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // corrupted cart — start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i))
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clear, count, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
