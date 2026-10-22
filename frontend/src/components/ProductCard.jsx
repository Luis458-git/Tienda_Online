import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ producto }) {
    const { addToCart } = useCart();
    const precioNumerico = parseFloat(producto.precio || 0);
    const agotado = producto.stock <= 0;
    const [agregado, setAgregado] = useState(false);

    const formatoMoneda = (monto) => {
        const num = Math.round(Number(monto) || 0);
        return `₡${num.toLocaleString('es-CR')}`;
    };

    const handleAdd = () => {
        if (agotado) return;
        addToCart(producto, 1);
        setAgregado(true);
        setTimeout(() => setAgregado(false), 1500);
    };

    return (
        <div className="bg-[#10131c] border border-[#1e2333] hover:border-[#2b3248] rounded-2xl p-4.5 sm:p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group">
            <div>
                {/* Header de la tarjeta: Categoría y Stock */}
                <div className="flex items-center justify-between mb-3.5">
                    <span className="bg-[#181a28] text-indigo-300 border border-[#2b3148] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {producto.categoria}
                    </span>
                    <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            agotado
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : producto.stock <= 5
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                    >
                        {agotado ? 'Agotado' : `✓ ${producto.stock} en stock`}
                    </span>
                </div>

                {/* Thumbnail Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#141724] border border-[#22283a] flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                {/* Título y Descripción */}
                <h3 className="font-bold text-white text-sm sm:text-base mb-1.5 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {producto.nombre}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {producto.descripcion}
                </p>
            </div>

            {/* Pie de tarjeta: Precio y Acciones */}
            <div className="pt-3.5 border-t border-[#1b2030] flex items-center justify-between gap-2">
                <div className="font-mono font-extrabold text-white text-base">
                    {formatoMoneda(precioNumerico)}
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to={`/producto/${producto.id}`}
                        className="px-2.5 py-1.5 rounded-xl bg-[#141724] hover:bg-[#1c2133] border border-[#22283a] text-slate-300 hover:text-white text-xs font-semibold transition"
                    >
                        Detalle
                    </Link>
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={agotado}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
                            agregado
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md shadow-indigo-600/20'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                        {agregado ? '✓ Listo' : agotado ? 'Agotado' : '+ Carrito'}
                    </button>
                </div>
            </div>
        </div>
    );
}
