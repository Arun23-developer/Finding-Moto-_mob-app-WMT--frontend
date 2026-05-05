import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import { useAuth } from "./AuthContext";

export interface CartItem {
  _id: string;
  buyerId: string;
  productId: string;
  productName: string;
  productImage: string | null;
  productPrice: number;
  quantity: number;
  totalAmount: number;
  availableStock: number | null;
  productStatus: "ENABLED" | "DISABLED";
  isAvailable: boolean;
  unavailableMessage: string;
  updatedAt?: string;
}

interface AddToCartInput {
  productId: string;
  productName?: string;
  productImage?: string | null;
  productPrice?: number;
  quantity: number;
}

interface AddToCartResult {
  success: boolean;
  status: "added" | "updated";
  message: string;
}

interface CartSummary {
  cartCount: number;
  subtotal: number;
}

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (item: AddToCartInput) => Promise<AddToCartResult>;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => Promise<string>;
  removeCartItem: (cartItemId: string) => Promise<string>;
}

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_SUMMARY: CartSummary = {
  cartCount: 0,
  subtotal: 0,
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    if (!user || user.role !== "buyer") {
      setItems([]);
      setSummary(EMPTY_SUMMARY);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      const nextItems = Array.isArray(data?.data?.items) ? data.data.items : [];
      setItems(nextItems);
      setSummary({
        cartCount: Number(data?.data?.cartCount) || 0,
        subtotal: Number(data?.data?.subtotal) || 0,
      });
    } catch {
      setItems([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshCart();
  }, [user?._id, user?.role]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      cartCount: summary.cartCount,
      subtotal: summary.subtotal,
      loading,
      refreshCart,
      addToCart: async (item) => {
        const normalizedQuantity = Math.max(1, item.quantity);
        const { data } = await api.post("/cart", {
          productId: item.productId,
          quantity: normalizedQuantity,
        });

        await refreshCart();

        const message = data?.message || "Product added to cart successfully";
        return {
          success: true,
          status: message.toLowerCase().includes("updated") ? "updated" : "added",
          message,
        };
      },
      updateCartItemQuantity: async (cartItemId, quantity) => {
        const normalizedQuantity = Math.max(1, quantity);
        const { data } = await api.patch(`/cart/${cartItemId}`, {
          quantity: normalizedQuantity,
        });
        await refreshCart();
        return data?.message || "Cart quantity updated successfully";
      },
      removeCartItem: async (cartItemId) => {
        const { data } = await api.delete(`/cart/${cartItemId}`);
        await refreshCart();
        return data?.message || "Product removed from cart successfully";
      },
    }),
    [items, summary.cartCount, summary.subtotal, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
