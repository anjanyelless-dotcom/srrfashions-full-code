import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCartApi, updateCartItemApi, removeCartItemApi } from '../services/cartApi.js';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'srfashion_cart';

function getInitialCart() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && item.id && String(item.id) !== '0');
    }
    return [];
  } catch {
    return [];
  }
}

function isUnauthorizedError(err) {
  const message = (err?.message || '').toLowerCase();
  return message.includes('unauthorized') || message.includes('401');
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(getInitialCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('customer_token');
    setCart([]);
  }, []);

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      console.log('CartContext: No token found');
      return;
    }
    try {
      console.log('CartContext: Fetching cart from API...');
      const data = await getCartApi();
      console.log('CartContext: API response:', data);
      const items = data?.cart?.items || [];
      console.log('CartContext: Items from API:', items.length, 'items');
      const mapped = items.map((item) => ({
        id: item.item_id,
        productId: item.product_id,
        variantId: item.variant_id,
        name: item.product_name,
        image: item.image_url,
        price: Number(item.current_price || item.price_at_add || 0),
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      }));
      console.log('CartContext: Mapped cart items:', mapped.length, 'items');
      setCart(mapped);
    } catch (err) {
      console.error('CartContext: Error fetching cart:', err);
      if (isUnauthorizedError(err)) {
        handleAuthError();
      }
      // other errors are silently ignored; cart stays as-is
    }
  }, [handleAuthError]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(
    (product) => {
      const qty = Math.max(1, Number(product.quantity) || 1);
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...product, quantity: item.quantity + qty }
              : item
          );
        }
        return [...prev, { ...product, quantity: qty }];
      });
    },
    []
  );

  const removeFromCart = useCallback(
    async (id) => {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        window.location.hash = '#my-account';
        return;
      }

      setCart((prev) => prev.filter((item) => item.id !== id));

      try {
        await removeCartItemApi(id);
      } catch (err) {
        if (isUnauthorizedError(err)) {
          handleAuthError();
          window.location.hash = '#my-account';
        }
      }
      await fetchCart();
    },
    [fetchCart, handleAuthError]
  );

  const updateQuantity = useCallback(
    async (id, quantity) => {
      const token = localStorage.getItem('customer_token');

      if (!token) {
        window.location.hash = '#my-account';
        return;
      }

      if (quantity <= 0) {
        return removeFromCart(id);
      }

      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );

      try {
        await updateCartItemApi(id, quantity);
      } catch (err) {
        if (isUnauthorizedError(err)) {
          handleAuthError();
          window.location.hash = '#my-account';
        }
      }
      await fetchCart();
    },
    [fetchCart, handleAuthError, removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    // No backend endpoint for clearing the entire cart exists.
    // Each item would need to be removed individually or a new backend endpoint would need to be added.
  }, []);

  const openCart = useCallback(() => {
    setIsOpen(true);
    fetchCart();
  }, [fetchCart]);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * item.quantity,
    0
  );

  const value = {
    cart,
    isOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    totalQuantity,
    subtotal,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
