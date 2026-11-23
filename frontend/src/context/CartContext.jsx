import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from '../api/cart';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user || user.role !== 'student') return;
    try {
      setLoading(true);
      const { data } = await getCart();
      setCart(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchCart();
    } else {
      setCart({ items: [], total: 0, item_count: 0 });
    }
  }, [user, fetchCart]);

  const addItem = async (food_item_id, quantity = 1) => {
    try {
      const { data } = await addToCart({ food_item_id, quantity });
      setCart(data);
      toast.success('Added to cart!');
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to add item';
      toast.error(errorMsg);
    }
  };

  const updateItem = async (cartItemId, quantity) => {
    try {
      const { data } = await updateCartItem(cartItemId, quantity);
      setCart(data);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update quantity');
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      const { data } = await removeCartItem(cartItemId);
      setCart(data);
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const emptyCart = async () => {
    try {
      await clearCart();
      setCart({ items: [], total: 0, item_count: 0 });
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    }
  };

  const getItemQuantity = (food_item_id) => {
    if (!cart?.items) return 0;
    const item = cart.items.find(
      (i) => i.food_item === food_item_id || i.food_item?.id === food_item_id
    );
    return item ? item.quantity : 0;
  };

  const getCartItemId = (food_item_id) => {
    if (!cart?.items) return null;
    const item = cart.items.find(
      (i) => i.food_item === food_item_id || i.food_item?.id === food_item_id
    );
    return item ? item.id : null;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        emptyCart,
        getItemQuantity,
        getCartItemId,
        itemCount: cart?.item_count || cart?.items?.length || 0,
        total: cart?.total || 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
