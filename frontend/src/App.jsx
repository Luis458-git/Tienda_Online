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
                <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
                    <Navbar />
                    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/catalogo" element={<Catalog />} />
                            <Route path="/producto/:id" element={<ProductDetail />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                    
                    {/* Modern Sleek Footer matching screenshot */}
                    <footer className="border-t border-[#1a1f2e] bg-[#08090d] text-xs text-slate-500 py-6 mt-auto">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <p>© 2026 TechStore Inc. Raycast-inspired developer hardware · Laboratorio #2 (Caso 5)</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="hover:text-slate-400 cursor-pointer transition">Privacidad</span>
                                <span className="hover:text-slate-400 cursor-pointer transition">Términos</span>
                                <span className="hover:text-indigo-400 cursor-pointer transition flex items-center gap-1 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                    Soporte IA
                                </span>
                            </div>
                        </div>
                    </footer>
                </div>
            </BrowserRouter>
        </CartProvider>
    );
}
