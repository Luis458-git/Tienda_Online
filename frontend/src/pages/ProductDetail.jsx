import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { getProductoById } from '../services/api';
import { generarDescripcionProducto } from '../services/aiService';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AiAssistantModal from '../components/AiAssistantModal';

export default function ProductDetail() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [cantidad, setCantidad] = useState(1);
    const [agregadoMensaje, setAgregadoMensaje] = useState(false);

    // Estado del Agente de IA y Modal
    const [modalAbierto, setModalAbierto] = useState(false);
    const [consultandoIA, setConsultandoIA] = useState(false);
    const [respuestaIA, setRespuestaIA] = useState(null);
    const [errorIA, setErrorIA] = useState(null);

    const {
        data: producto,
        loading,
        error
    } = useFetch(() => getProductoById(id), [id]);

    const formatoMoneda = (monto) => {
        const num = Math.round(Number(monto) || 0);
        return `₡${num.toLocaleString('es-CR')}`;
    };

    const handleAddToCart = () => {
        if (!producto || producto.stock <= 0) return;
        addToCart(producto, cantidad);
        setAgregadoMensaje(true);
        setTimeout(() => setAgregadoMensaje(false), 2500);
    };

    const handleConsultarIA = async () => {
        if (!producto) return;
        setConsultandoIA(true);
        setErrorIA(null);
        setModalAbierto(true);
        try {
            const respuesta = await generarDescripcionProducto(producto.nombre, producto.categoria);
            if (respuesta && respuesta.ok) {
                setRespuestaIA(respuesta.data);
            } else {
                throw new Error(respuesta.error || 'Error al consultar el agente de IA');
            }
        } catch (err) {
            setErrorIA(err.message || 'No fue posible contactar al agente de IA');
        } finally {
            setConsultandoIA(false);
        }
    };

    if (loading) return <LoadingSpinner mensaje="Cargando ficha técnica del hardware..." />;
    if (error) {
        return (
            <div className="py-12 max-w-lg mx-auto">
                <ErrorMessage error={error} />
                <div className="mt-4 text-center">
                    <Link to="/catalogo" className="text-xs text-indigo-400 hover:text-white font-semibold">
                        ← Volver al catálogo
                    </Link>
                </div>
            </div>
        );
    }
    if (!producto) return null;

    const agotado = producto.stock <= 0;
    const precioNumerico = parseFloat(producto.precio || 0);

    return (
        <div className="pb-12 animate-fadeIn">
            {/* Breadcrumb superior */}
            <div className="mb-5">
                <Link
                    to="/catalogo"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Volver al catálogo de hardware</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Columna Izquierda: Ficha Técnica (7 cols) */}
                <div className="lg:col-span-7 bg-[#10131c] border border-[#1e2333] rounded-2xl p-6 sm:p-7 shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-[#1b2030] mb-5">
                        <span className="bg-[#181a28] text-indigo-300 border border-[#2b3148] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {producto.categoria}
                        </span>
                        <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                agotado
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : producto.stock <= 5
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                        >
                            {agotado ? 'Agotado' : `✓ ${producto.stock} unidades disponibles`}
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                        {producto.nombre}
                    </h1>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white mb-6">
                        {formatoMoneda(precioNumerico)}
                    </div>

                    {/* Descripción Técnica */}
                    <div className="mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Descripción Técnica
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0b0d14] border border-[#1e2332] rounded-xl p-4">
                            {producto.descripcion}
                        </p>
                    </div>

                    {/* Disponibilidad e Inventario */}
                    <div className="mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Estado de Inventario en Tiempo Real
                        </h3>
                        <div className="bg-[#0b0d14] border border-[#1e2332] rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 text-xs text-slate-200">
                                <span
                                    className={`w-2.5 h-2.5 rounded-full ${agotado ? 'bg-red-500' : 'bg-emerald-400'}`}
                                ></span>
                                <span>{agotado ? 'Sin stock disponible actualmente' : `${producto.stock} unidades listas para entrega inmediata`}</span>
                            </div>
                            {producto.unidades_vendidas > 0 && (
                                <span className="text-[11px] font-mono text-indigo-300 bg-[#181a28] px-2 py-0.5 rounded border border-[#2b3148]">
                                    🔥 {producto.unidades_vendidas} vendidas
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Panel de Compra */}
                    <div className="pt-4 border-t border-[#1b2030] flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="qty" className="text-xs font-semibold text-slate-400">Cantidad:</label>
                            <div className="flex items-center bg-[#131622] border border-[#222839] rounded-lg p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                    disabled={agotado || cantidad <= 1}
                                    className="w-7 h-7 rounded text-slate-400 hover:text-white hover:bg-[#1c2133] flex items-center justify-center text-xs font-bold transition disabled:opacity-20"
                                >
                                    -
                                </button>
                                <span className="w-8 text-center text-xs font-mono font-bold text-white">
                                    {cantidad}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                                    disabled={agotado || cantidad >= producto.stock}
                                    className="w-7 h-7 rounded text-slate-400 hover:text-white hover:bg-[#1c2133] flex items-center justify-center text-xs font-bold transition disabled:opacity-20"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={agotado}
                            className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold py-3 px-5 rounded-xl text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <span>🛒</span>
                            <span>{agotado ? 'Producto Agotado' : `Añadir ${cantidad} unidad(es) al Carrito`}</span>
                        </button>
                    </div>

                    {agregadoMensaje && (
                        <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
                            <span>✅</span>
                            <span>¡{cantidad} unidad(es) de "{producto.nombre}" agregada(s) al carrito!</span>
                        </div>
                    )}
                </div>

                {/* Columna Derecha: Asistente IA (5 cols) */}
                <div className="lg:col-span-5 bg-[#10131c] border border-[#1e2333] rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-[#1b2030] mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-base">✨</span>
                            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                                Copiloto de IA (n8n Agent)
                            </h2>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#181a2e] text-[#818cf8] border border-[#2b2f4c]">
                            LANGCHAIN
                        </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                        Genera una descripción comercial persuasiva y descubre qué productos complementarios recomienda el modelo de lenguaje para este artículo.
                    </p>

                    <button
                        onClick={handleConsultarIA}
                        disabled={consultandoIA}
                        className="w-full bg-[#181a2e] hover:bg-[#22253f] border border-[#2e3355] text-[#a5b4fc] hover:text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-40"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8] animate-pulse"></span>
                        <span>{consultandoIA ? 'Consultando al Agente de IA...' : '✨ Consultar Copiloto IA'}</span>
                    </button>

                    {errorIA && (
                        <div className="mt-4">
                            <ErrorMessage error={errorIA} onClose={() => setErrorIA(null)} />
                        </div>
                    )}

                    {respuestaIA && (
                        <div className="mt-5 space-y-4 pt-4 border-t border-[#1b2030] animate-fadeIn">
                            {respuestaIA.copy_comercial && (
                                <div className="bg-[#0b0d14] border border-[#1e2332] rounded-xl p-4">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                                        📝 Copy Persuasivo Generado:
                                    </span>
                                    <p className="text-xs text-slate-200 leading-relaxed">
                                        {respuestaIA.copy_comercial}
                                    </p>
                                </div>
                            )}

                            {respuestaIA.recomendados && respuestaIA.recomendados.length > 0 && (
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                        🎯 Complementos Sugeridos:
                                    </span>
                                    <div className="space-y-1.5">
                                        {respuestaIA.recomendados.map((item, idx) => (
                                            <div key={idx} className="bg-[#0b0d14] border border-[#1e2332] rounded-lg p-2.5 text-xs text-slate-300 flex items-center gap-2">
                                                <span className="text-emerald-400 font-bold">✓</span>
                                                <span>{typeof item === 'string' ? item : item.nombre}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Modal Reusable del Copiloto IA */}
            <AiAssistantModal
                isOpen={modalAbierto}
                onClose={() => setModalAbierto(false)}
                title={`Copiloto IA: ${producto.nombre}`}
                subtitle={`Análisis comercial y técnico para categoría "${producto.categoria}"`}
                loading={consultandoIA}
                error={errorIA}
                data={respuestaIA}
                tipo="descripcion"
                onEjecutarConsulta={handleConsultarIA}
            />
        </div>
    );
}
