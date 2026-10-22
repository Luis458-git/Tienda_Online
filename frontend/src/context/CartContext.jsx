import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cart, setCart] = useState(() => {
        try {
            const guardado = localStorage.getItem('techstore_cart');
            return guardado ? JSON.parse(guardado) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('techstore_cart', JSON.stringify(cart));
        } catch (e) {
            console.error('Error al persistir carrito:', e);
        }
    }, [cart]);

    const addToCart = (producto, cantidad = 1) => {
        setCart(prev => {
            const index = prev.findIndex(item => item.id === producto.id);
            if (index >= 0) {
                const copia = [...prev];
                const nuevaCantidad = copia[index].cantidad + cantidad;
                // Validar que no sobrepase el stock disponible si está definido
                const maxStock = producto.stock !== undefined ? producto.stock : 999;
                copia[index].cantidad = Math.min(nuevaCantidad, maxStock);
                return copia;
            }
            return [...prev, { ...producto, cantidad: Math.min(cantidad, producto.stock || 999) }];
        });
    };

    const updateQuantity = (productoId, nuevaCantidad) => {
        if (nuevaCantidad <= 0) {
            removeFromCart(productoId);
            return;
        }
        setCart(prev =>
            prev.map(item =>
                item.id === productoId
                    ? { ...item, cantidad: Math.min(nuevaCantidad, item.stock || 999) }
                    : item
            )
        );
    };

    const removeFromCart = (productoId) => {
        setCart(prev => prev.filter(item => item.id !== productoId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
    const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
                totalItems,
                subtotal
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart debe ser utilizado dentro de un CartProvider');
    }
    return context;
}
