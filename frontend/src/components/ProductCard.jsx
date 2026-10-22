import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ producto }) {
    const { addToCart } = useCart();
    const precioNumerico = parseFloat(producto.precio || 0);
    const precioAnterior = Math.round(precioNumerico * 1.15);
    const agotado = producto.stock <= 0;
    const [agregado, setAgregado] = useState(false);

    const formatoMoneda = (monto) => {
        const num = Math.round(Number(monto) || 0);
        return `₡${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
    };

    const handleAdd = () => {
        if (agotado) return;
        addToCart(producto, 1);
        setAgregado(true);
        setTimeout(() => setAgregado(false), 1500);
    };

    // Renderizado de ilustración SVG de alta fidelidad según producto
    const getProductSvg = () => {
        const nombre = (producto.nombre || '').toLowerCase();
        if (nombre.includes('mouse') && !nombre.includes('pad')) {
            return (
                <svg className="w-24 h-28 cf-glow-cyan transition-transform duration-300 group-hover:scale-105" viewBox="0 0 160 220" fill="none">
                    <defs>
                        <linearGradient id={`mb_${producto.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="50%" stopColor="#0f172a" />
                            <stop offset="100%" stopColor="#070b16" />
                        </linearGradient>
                        <linearGradient id={`ml_${producto.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#00f0ff" />
                            <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                    </defs>
                    <path d="M80 15 C45 15, 25 50, 25 120 C25 175, 45 205, 80 205 C115 205, 135 175, 135 120 C135 50, 115 15, 80 15 Z" 
                          fill={`url(#mb_${producto.id})`} stroke={`url(#ml_${producto.id})`} strokeWidth="2.5" />
                    <line x1="80" y1="15" x2="80" y2="85" stroke="#334155" strokeWidth="2" />
                    <rect x="75" y="38" width="10" height="26" rx="5" fill="#030712" stroke="#00f0ff" strokeWidth="1.8" />
                    <circle cx="80" cy="145" r="14" stroke="#a855f7" strokeWidth="2" strokeDasharray="6 3" />
                    <circle cx="80" cy="145" r="5" fill="#00f0ff" />
                </svg>
            );
        } else if (nombre.includes('teclado')) {
            return (
                <svg className="w-32 h-20 cf-glow-purple transition-transform duration-300 group-hover:scale-105" viewBox="0 0 240 140" fill="none">
                    <rect x="10" y="20" width="220" height="100" rx="10" fill="#090d16" stroke="#a855f7" strokeWidth="2" />
                    <g fill="#1e293b" stroke="#334155" strokeWidth="1">
                        <rect x="22" y="32" width="16" height="12" rx="2" />
                        <rect x="42" y="32" width="16" height="12" rx="2" />
                        <rect x="62" y="32" width="16" height="12" rx="2" fill="#6366f1" />
                        <rect x="82" y="32" width="16" height="12" rx="2" />
                        <rect x="102" y="32" width="16" height="12" rx="2" />
                        <rect x="122" y="32" width="16" height="12" rx="2" fill="#00f0ff" />
                        <rect x="142" y="32" width="16" height="12" rx="2" />
                        <rect x="162" y="32" width="16" height="12" rx="2" />
                        <rect x="182" y="32" width="16" height="12" rx="2" />
                        <rect x="202" y="32" width="16" height="12" rx="2" />
                        <rect x="22" y="50" width="20" height="12" rx="2" />
                        <rect x="46" y="50" width="16" height="12" rx="2" />
                        <rect x="66" y="50" width="16" height="12" rx="2" fill="#ec4899" />
                        <rect x="86" y="50" width="16" height="12" rx="2" />
                        <rect x="106" y="50" width="16" height="12" rx="2" />
                        <rect x="126" y="50" width="16" height="12" rx="2" />
                        <rect x="146" y="50" width="16" height="12" rx="2" />
                        <rect x="166" y="50" width="16" height="12" rx="2" />
                        <rect x="74" y="80" width="92" height="14" rx="3" fill="#3b82f6" stroke="#00f0ff" strokeWidth="1.5" />
                    </g>
                </svg>
            );
        } else if (nombre.includes('monitor')) {
            return (
                <svg className="w-32 h-24 cf-glow-cyan transition-transform duration-300 group-hover:scale-105" viewBox="0 0 220 180" fill="none">
                    <rect x="10" y="15" width="200" height="120" rx="8" fill="#080c16" stroke="#00f0ff" strokeWidth="2" />
                    <path d="M20 120 C70 128, 150 128, 200 120" stroke="#38bdf8" strokeWidth="2" fill="none"/>
                    <polygon points="100,135 120,135 126,165 94,165" fill="#1e293b" stroke="#334155" />
                    <rect x="75" y="165" width="70" height="6" rx="3" fill="#0f172a" stroke="#00f0ff" strokeWidth="1.5" />
                    <circle cx="110" cy="75" r="20" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 2" />
                    <text x="110" y="80" fill="#00f0ff" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">144Hz</text>
                </svg>
            );
        } else if (nombre.includes('headset') || nombre.includes('auricular')) {
            return (
                <svg className="w-28 h-24 cf-glow-purple transition-transform duration-300 group-hover:scale-105" viewBox="0 0 200 180" fill="none">
                    <path d="M40 90 A60 60 0 0 1 160 90" stroke="#a855f7" strokeWidth="6" strokeLinecap="round" />
                    <rect x="25" y="80" width="26" height="45" rx="12" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" />
                    <rect x="149" y="80" width="26" height="45" rx="12" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" />
                    <path d="M38 125 C38 150, 70 160, 95 160" stroke="#38bdf8" strokeWidth="2" fill="none" />
                    <circle cx="95" cy="160" r="4" fill="#a855f7" />
                </svg>
            );
        } else if (nombre.includes('ssd') || nombre.includes('ram') || nombre.includes('memoria') || nombre.includes('disco')) {
            return (
                <svg className="w-28 h-20 cf-glow-cyan transition-transform duration-300 group-hover:scale-105" viewBox="0 0 200 120" fill="none">
                    <rect x="15" y="20" width="170" height="80" rx="6" fill="#060913" stroke="#00f0ff" strokeWidth="2" />
                    <rect x="35" y="35" width="40" height="40" rx="3" fill="#1e293b" stroke="#334155" />
                    <rect x="85" y="35" width="40" height="40" rx="3" fill="#1e293b" stroke="#334155" />
                    <line x1="30" y1="100" x2="170" y2="100" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 2" />
                    <text x="150" y="55" fill="#a855f7" fontSize="10" fontFamily="monospace" fontWeight="bold">NVMe</text>
                </svg>
            );
        } else {
            return (
                <svg className="w-24 h-24 cf-glow-cyan transition-transform duration-300 group-hover:scale-105" viewBox="0 0 160 160" fill="none">
                    <polygon points="80,15 145,52 145,127 80,165 15,127 15,52" fill="#080e1c" stroke="#38bdf8" strokeWidth="2.5" />
                    <circle cx="80" cy="90" r="28" stroke="#c026d3" strokeWidth="2" strokeDasharray="5 3"/>
                    <polygon points="85,55 65,88 78,88 75,115 95,82 82,82" fill="#00f0ff" />
                </svg>
            );
        }
    };

    return (
        <div className="cf-card-product group">
            <div>
                {/* Visual Showcase Thumbnail */}
                <div className="cf-product-thumb">
                    <div className="cf-thumb-aura"></div>
                    
                    {/* SVG Illustration */}
                    <Link to={`/producto/${producto.id}`} className="relative z-10 flex items-center justify-center">
                        {getProductSvg()}
                    </Link>

                    {/* Floating Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-slate-950/80 text-indigo-300 border border-slate-700/80 shadow-md">
                            {producto.categoria}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${
                            agotado
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : producto.stock <= 5
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${agotado ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                            {agotado ? 'Agotado' : `${producto.stock} en stock`}
                        </span>
                    </div>
                </div>

                {/* Título de producto & Descripción */}
                <Link to={`/producto/${producto.id}`} className="block">
                    <h3 className="line-clamp-1 font-extrabold text-white text-sm group-hover:text-cyan-400 transition tracking-tight">
                        {producto.nombre}
                    </h3>
                </Link>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1.5">
                    {producto.descripcion}
                </p>
            </div>

            {/* Precios & Botones de Acción */}
            <div className="pt-3.5 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 line-through font-mono">
                            {formatoMoneda(precioAnterior)}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            -15%
                        </span>
                    </div>
                    <span className="font-mono text-base font-extrabold text-white tracking-tight">
                        {formatoMoneda(precioNumerico)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to={`/producto/${producto.id}`}
                        className="p-2 rounded-xl cf-btn-secondary text-xs flex items-center justify-center transition"
                        title="Ver ficha técnica"
                    >
                        👁️
                    </Link>
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={agotado}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            agregado
                                ? 'bg-emerald-600 text-white'
                                : 'cf-btn-primary'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                        <span>{agregado ? '✓' : '+'}</span>
                        <span>{agregado ? 'Listo' : 'Añadir'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
