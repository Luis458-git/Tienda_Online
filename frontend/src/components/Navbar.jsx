import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const { totalItems } = useCart();

    return (
        <header className="sticky top-0 z-50 bg-[#08090d]/90 backdrop-blur-xl border-b border-[#1b2030] transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                
                {/* Brand Logo & IA Copilot Pill */}
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                            <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                        <span className="font-extrabold text-base tracking-tight text-white group-hover:text-slate-200 transition-colors">
                            TechStore
                        </span>
                    </Link>

                    <div className="hidden sm:inline-flex items-center gap-1.5 bg-[#181a2c] text-[#818cf8] border border-[#2b2f4c] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8] animate-pulse"></span>
                        IA COPILOT
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex items-center gap-1 sm:gap-2">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                                isActive
                                    ? 'text-white bg-[#141724] border border-[#22283a]'
                                    : 'text-slate-400 hover:text-white hover:bg-[#10131d]'
                            }`
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/catalogo"
                        className={({ isActive }) =>
                            `px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                                isActive
                                    ? 'text-white bg-[#141724] border border-[#22283a]'
                                    : 'text-slate-400 hover:text-white hover:bg-[#10131d]'
                            }`
                        }
                    >
                        Catálogo
                    </NavLink>

                    <Link
                        to="/catalogo"
                        className="hidden md:inline-flex px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#10131d] transition-all"
                    >
                        Componentes
                    </Link>
                </nav>

                {/* Right Actions: Checkout Button & User Avatar */}
                <div className="flex items-center gap-2.5">
                    <Link
                        to="/checkout"
                        className="inline-flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition active:scale-95"
                    >
                        <span>Checkout</span>
                        <span className="bg-[#4f46e5] text-white text-[11px] font-extrabold px-1.5 py-0.2 rounded-md">
                            {totalItems}
                        </span>
                    </Link>

                    <div
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#141724] border border-[#23293d] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition"
                        title="Perfil de Usuario"
                    >
                        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                </div>

            </div>
        </header>
    );
}
