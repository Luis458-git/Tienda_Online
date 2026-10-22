import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';

import AiChatWidget from './components/AiChatWidget';

export default function App() {
    return (
        <CartProvider>
            <BrowserRouter>
                <div className="min-h-screen bg-[#06080f] text-slate-100 flex flex-col w-full selection:bg-cyan-500 selection:text-black">
                    <Navbar />
                    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/catalogo" element={<Catalog />} />
                            <Route path="/producto/:id" element={<ProductDetail />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                    
                    {/* Widget Flotante del Chat de IA con n8n */}
                    <AiChatWidget />

                    <footer className="border-t border-slate-800/80 bg-[#060810] text-xs text-slate-500 py-6 mt-auto w-full">
                        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                <p>© 2026 CyberForge Hardware Inc. Raycast-inspired developer hardware · Laboratorio #2 (Caso 5)</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="hover:text-slate-400 cursor-pointer transition">Privacidad</span>
                                <span className="hover:text-slate-400 cursor-pointer transition">Términos</span>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('abrir-chat-ia'))}
                                    className="hover:text-cyan-400 cursor-pointer transition flex items-center gap-1.5 font-bold text-indigo-400"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                                    Soporte IA n8n
                                </button>
                            </div>
                        </div>
                    </footer>
                </div>
            </BrowserRouter>
        </CartProvider>
    );
}
