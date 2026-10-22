import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';

export default function App() {
    return (
        <CartProvider>
            <BrowserRouter>
                <div className="app-layout">
                    <Navbar />
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/catalogo" element={<Catalog />} />
                            <Route path="/producto/:id" element={<ProductDetail />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                    <footer className="app-footer">
                        <p>© 2026 TechStore · Laboratorio #2 (Caso 5: React 18 + Node.js + PostgreSQL + n8n AI Agent)</p>
                    </footer>
                </div>
            </BrowserRouter>
        </CartProvider>
    );
}
