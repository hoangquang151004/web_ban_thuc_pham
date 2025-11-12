'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface CartItem {
    id: number;
    product: {
        id: number;
        name: string;
        slug: string;
        price: number;
        old_price?: number;
        main_image?: string;
        main_image_url?: string;
        stock: number;
        unit: string;
        category_name: string;
    };
    quantity: number;
    price: number;
    subtotal: number;
}

export interface Cart {
    items: CartItem[];
    total_items: number;
    total_price: number;
    items_count: number;
}

interface CartContextType {
    cart: Cart | null;
    loading: boolean;
    addToCart: (product: any, quantity?: number) => Promise<boolean>;
    updateCartItem: (productId: number, quantity: number) => Promise<boolean>;
    removeFromCart: (productId: number) => Promise<boolean>;
    clearCart: () => Promise<boolean>;
    refreshCart: () => void;
    getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'shopping_cart';

// Hook để sử dụng Cart Context
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

// Cart Provider Component
interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(false);

    // Load cart từ localStorage khi component mount
    useEffect(() => {
        loadCartFromLocalStorage();
    }, []);

    // Load cart từ localStorage
    const loadCartFromLocalStorage = () => {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                setCart(parsedCart);
            } else {
                // Khởi tạo giỏ hàng trống
                const emptyCart: Cart = {
                    items: [],
                    total_items: 0,
                    total_price: 0,
                    items_count: 0
                };
                setCart(emptyCart);
            }
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            // Nếu có lỗi, khởi tạo giỏ hàng trống
            const emptyCart: Cart = {
                items: [],
                total_items: 0,
                total_price: 0,
                items_count: 0
            };
            setCart(emptyCart);
        }
    };

    // Save cart to localStorage
    const saveCartToLocalStorage = (cartData: Cart) => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    };

    // Tính toán lại tổng giỏ hàng
    const calculateCartTotals = (items: CartItem[]): Cart => {
        const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
        const total_price = items.reduce((sum, item) => sum + item.subtotal, 0);
        const items_count = items.length;

        return {
            items,
            total_items,
            total_price,
            items_count
        };
    };

    // Refresh cart (reload từ localStorage)
    const refreshCart = () => {
        loadCartFromLocalStorage();
    };

    // Thêm sản phẩm vào giỏ hàng
    const addToCart = async (product: any, quantity: number = 1): Promise<boolean> => {
        setLoading(true);
        try {
            if (!cart) {
                return false;
            }

            // Kiểm tra sản phẩm đã có trong giỏ chưa
            const existingItemIndex = cart.items.findIndex((item) => item.product.id === product.id);

            let newItems: CartItem[];

            if (existingItemIndex >= 0) {
                // Sản phẩm đã có trong giỏ -> tăng số lượng
                newItems = [...cart.items];
                const newQuantity = newItems[existingItemIndex].quantity + quantity;

                // Kiểm tra tồn kho
                if (newQuantity > product.stock) {
                    throw new Error(`Chỉ còn ${product.stock} ${product.unit} trong kho`);
                }

                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newQuantity,
                    subtotal: newQuantity * product.price
                };
            } else {
                // Sản phẩm chưa có -> thêm mới
                if (quantity > product.stock) {
                    throw new Error(`Chỉ còn ${product.stock} ${product.unit} trong kho`);
                }

                const newItem: CartItem = {
                    id: Date.now(), // Tạo ID tạm thời
                    product: {
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        old_price: product.old_price,
                        main_image: product.main_image,
                        main_image_url: product.main_image_url,
                        stock: product.stock,
                        unit: product.unit,
                        category_name: product.category_name
                    },
                    quantity: quantity,
                    price: product.price,
                    subtotal: quantity * product.price
                };

                newItems = [...cart.items, newItem];
            }

            // Tính toán lại tổng và cập nhật
            const updatedCart = calculateCartTotals(newItems);
            setCart(updatedCart);
            saveCartToLocalStorage(updatedCart);

            return true;
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật số lượng sản phẩm
    const updateCartItem = async (productId: number, quantity: number): Promise<boolean> => {
        setLoading(true);
        try {
            if (!cart) {
                return false;
            }

            if (quantity <= 0) {
                // Nếu số lượng = 0, xóa sản phẩm
                return await removeFromCart(productId);
            }

            const itemIndex = cart.items.findIndex((item) => item.product.id === productId);

            if (itemIndex < 0) {
                throw new Error('Sản phẩm không tồn tại trong giỏ hàng');
            }

            const newItems = [...cart.items];
            const item = newItems[itemIndex];

            // Kiểm tra tồn kho
            if (quantity > item.product.stock) {
                throw new Error(`Chỉ còn ${item.product.stock} ${item.product.unit} trong kho`);
            }

            newItems[itemIndex] = {
                ...item,
                quantity: quantity,
                subtotal: quantity * item.price
            };

            // Tính toán lại tổng và cập nhật
            const updatedCart = calculateCartTotals(newItems);
            setCart(updatedCart);
            saveCartToLocalStorage(updatedCart);

            return true;
        } catch (error: any) {
            console.error('Error updating cart item:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Xóa sản phẩm khỏi giỏ hàng
    const removeFromCart = async (productId: number): Promise<boolean> => {
        setLoading(true);
        try {
            if (!cart) {
                return false;
            }

            const newItems = cart.items.filter((item) => item.product.id !== productId);

            // Tính toán lại tổng và cập nhật
            const updatedCart = calculateCartTotals(newItems);
            setCart(updatedCart);
            saveCartToLocalStorage(updatedCart);

            return true;
        } catch (error: any) {
            console.error('Error removing from cart:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Xóa toàn bộ giỏ hàng
    const clearCart = async (): Promise<boolean> => {
        setLoading(true);
        try {
            const emptyCart: Cart = {
                items: [],
                total_items: 0,
                total_price: 0,
                items_count: 0
            };
            setCart(emptyCart);
            saveCartToLocalStorage(emptyCart);
            return true;
        } catch (error: any) {
            console.error('Error clearing cart:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Lấy số lượng items trong giỏ
    const getCartCount = (): number => {
        return cart?.total_items || 0;
    };

    const value: CartContextType = {
        cart,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart,
        getCartCount
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
