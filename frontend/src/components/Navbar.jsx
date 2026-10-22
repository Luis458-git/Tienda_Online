import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const { totalItems } = useCart();

    return (
        <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                
                {/* Brand Logo & Chip */}
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-all duration-300">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-slate-200 transition-colors">
                            Tech<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Store</span>
                        </span>
                    </Link>

                    <span className="hidden sm:inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                        IA COPILOT
                    </span>
                </div>

                {/* Navigation Links */}
                <nav className="flex items-center gap-1.5 sm:gap-2">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                isActive
                                    ? 'bg-slate-900 text-white border border-slate-800 shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                            }`
                        }
                    >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/catalogo"
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                isActive
                                    ? 'bg-slate-900 text-white border border-slate-800 shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                            }`
                        }
                    >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Catálogo</span>
                    </NavLink>

                    <NavLink
                        to="/checkout"
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                isActive
                                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                            }`
                        }
                    >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Checkout</span>
                        {totalItems > 0 && (
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1 shadow-md shadow-indigo-500/30 animate-pulse">
                                {totalItems}
                            </span>
                        )}
                    </NavLink>
                </nav>

            </div>
        </header>
    );
}
