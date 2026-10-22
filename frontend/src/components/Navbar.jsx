import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { consultarEstadoN8N } from '../services/aiService';

export default function Navbar() {
    const { totalItems } = useCart();
    const [n8nStatus, setN8nStatus] = useState({ status: 'inactive' });

    useEffect(() => {
        let isMounted = true;
        const check = async () => {
            const data = await consultarEstadoN8N();
            if (isMounted && data) {
                setN8nStatus(data);
            }
        };
        check();
        const t = setInterval(check, 8000);
        return () => {
            isMounted = false;
            clearInterval(t);
        };
    }, []);

    return (
        <header className="cf-navbar">
            <div className="cf-navbar-container">
                
                {/* Logo CyberForge Hardware & AI Copilot */}
                <div className="flex items-center gap-3">
                    <Link to="/catalogo" className="cf-brand">
                        <div className="cf-logo-hex">
                            <svg className="w-10 h-10 cf-glow-cyan" viewBox="0 0 100 100" fill="none">
                                <defs>
                                    <linearGradient id="nbHex" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#00f0ff" />
                                        <stop offset="50%" stopColor="#38bdf8" />
                                        <stop offset="100%" stopColor="#c026d3" />
                                    </linearGradient>
                                    <linearGradient id="nbBolt" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ffffff" />
                                        <stop offset="40%" stopColor="#38bdf8" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                    <filter id="nbGlow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>
                                <polygon points="50,4 92,26 92,74 50,96 8,74 8,26" stroke="url(#nbHex)" strokeWidth="4.5" fill="#080c18" />
                                <polygon points="50,12 84,30 84,70 50,88 16,70 16,30" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeDasharray="4 2" />
                                <polygon points="54,16 34,50 48,50 44,84 66,46 52,46" fill="url(#nbBolt)" filter="url(#nbGlow)" />
                            </svg>
                        </div>
                        <div className="cf-brand-text">
                            <span className="cf-brand-title">CYBERFORGE</span>
                            <span className="cf-brand-subtitle">HARDWARE</span>
                        </div>
                    </Link>

                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('abrir-chat-ia'))}
                        className="cf-badge-copilot hover:border-cyan-400 hover:text-white transition cursor-pointer"
                        title={
                            n8nStatus.status === 'active'
                                ? 'AI Copilot: Conectado a n8n Live'
                                : n8nStatus.status === 'testing'
                                ? 'AI Copilot: n8n en Modo Test'
                                : n8nStatus.status === 'inactive'
                                ? 'AI Copilot: n8n Inactivo (Workflow pausado en localhost:5678)'
                                : 'AI Copilot: n8n Desconectado'
                        }
                    >
                        <span className={`w-2 h-2 rounded-full ${
                            n8nStatus.status === 'active'
                                ? 'bg-emerald-400 animate-pulse'
                                : n8nStatus.status === 'testing'
                                ? 'bg-cyan-400 animate-pulse'
                                : n8nStatus.status === 'inactive'
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                        }`}></span>
                        <span>
                            {n8nStatus.status === 'active' ? 'AI Copilot • Online' :
                             n8nStatus.status === 'testing' ? 'AI Copilot • Test' :
                             n8nStatus.status === 'inactive' ? 'AI Copilot • Inactivo' : 'AI Copilot • Offline'}
                        </span>
                    </button>
                </div>

                {/* Central Navigation Pills: Dashboard | Catálogo | Componentes */}
                <nav className="cf-nav-pills hidden md:flex">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `cf-nav-pill-item ${isActive ? 'active' : ''}`
                        }
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/catalogo"
                        className={({ isActive }) =>
                            `cf-nav-pill-item ${isActive ? 'active' : ''}`
                        }
                    >
                        Catálogo
                    </NavLink>
                    <NavLink
                        to="/catalogo?cat=Componentes"
                        className={({ isActive }) =>
                            `cf-nav-pill-item ${isActive ? 'active' : ''}`
                        }
                    >
                        Componentes
                    </NavLink>
                </nav>

                {/* Right: Checkout Button & User Profile */}
                <div className="flex items-center gap-3">
                    <Link
                        to="/checkout"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition shadow-lg shadow-indigo-900/40 border border-indigo-500/40"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Checkout</span>
                        <span className="ml-0.5 px-1.5 py-0.2 bg-white/20 text-white rounded-md text-[11px] font-extrabold">
                            {totalItems}
                        </span>
                    </Link>

                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-300 hover:border-slate-500 transition cursor-pointer">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                </div>

            </div>
        </header>
    );
}
