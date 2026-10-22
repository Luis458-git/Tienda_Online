import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { getProductoById } from '../services/api';
import { generarDescripcionProducto } from '../services/aiService';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AiAssistantModal from '../components/AiAssistantModal';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [cantidad, setCantidad] = useState(1);
    const [agregadoMensaje, setAgregadoMensaje] = useState(false);
    const [copiado, setCopiado] = useState(false);
    const [mostrarContrato, setMostrarContrato] = useState(false);

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

    const handleComprarAhora = () => {
        if (!producto || producto.stock <= 0) return;
        addToCart(producto, cantidad);
        navigate('/checkout');
    };

    const handleCopiarTexto = (texto) => {
        navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    const handleConsultarIA = async () => {
        if (!producto) return;
        setConsultandoIA(true);
        setErrorIA(null);
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

    if (loading) return <LoadingSpinner mensaje="Cargando ficha técnica y telemetría de hardware..." />;
    if (error) {
        return (
            <div className="py-16 max-w-lg mx-auto text-center">
                <ErrorMessage error={error} />
                <div className="mt-6">
                    <Link
                        to="/catalogo"
                        className="inline-flex items-center gap-2 bg-[#141724] border border-[#22283a] text-slate-300 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold transition"
                    >
                        ← Volver al catálogo de hardware
                    </Link>
                </div>
            </div>
        );
    }
    if (!producto) return null;

    const agotado = producto.stock <= 0;
    const precioNumerico = parseFloat(producto.precio || 0);
    const precioReferencia = Math.round(precioNumerico * 1.15); // Precio sugerido de mercado

    // Iconografía y badge tecnológico según categoría
    const getCategoriaIcon = (cat) => {
        switch (cat) {
            case 'Periféricos':
                return {
                    badge: 'USB-C · Ultra Low Latency',
                    icon: (
                        <svg className="w-16 h-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    ),
                    specs: [
                        { label: 'Sensor Óptico', val: '16,000 - 25,000 DPI' },
                        { label: 'Tiempo de Respuesta', val: '0.2 ms Instantáneo' },
                        { label: 'Conexión', val: 'USB-C Paracord Blindado' },
                        { label: 'Switches', val: 'Ópticos Mecánicos Gen 2' }
                    ]
                };
            case 'Monitores':
                return {
                    badge: '144Hz · IPS Panel HDR',
                    icon: (
                        <svg className="w-16 h-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    ),
                    specs: [
                        { label: 'Tasa de Refresco', val: '144Hz - 165Hz FreeSync' },
                        { label: 'Resolución', val: 'QHD 2560x1440 IPS' },
                        { label: 'Tiempo de Respuesta', val: '1ms GTG' },
                        { label: 'Puertos', val: '2x DP 1.4 + 2x HDMI 2.1' }
                    ]
                };
            case 'Componentes':
                return {
                    badge: 'NVMe Gen4 · High Transfer',
                    icon: (
                        <svg className="w-16 h-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    ),
                    specs: [
                        { label: 'Interfaz', val: 'PCIe 4.0 x4 NVMe' },
                        { label: 'Lectura Secuencial', val: 'Hasta 7000 MB/s' },
                        { label: 'Disipación', val: 'Armadura Térmica Grafeno' },
                        { label: 'Factor de Forma', val: 'M.2 2280' }
                    ]
                };
            default:
                return {
                    badge: 'Hardware Certificado TechStore',
                    icon: (
                        <svg className="w-16 h-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    ),
                    specs: [
                        { label: 'Calidad de Construcción', val: 'Grado Industrial' },
                        { label: 'Compatibilidad', val: 'Multiplataforma Plug & Play' },
                        { label: 'Eficiencia', val: 'Certificación Energética' },
                        { label: 'Garantía Oficial', val: '24 Meses Tech Direct' }
                    ]
                };
        }
    };

    const categoryMeta = getCategoriaIcon(producto.categoria);

    return (
        <div className="pb-16 animate-fadeIn">
            
            {/* Breadcrumb de Navegación de Alta Gama */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#1b2030] text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                    <Link to="/catalogo" className="hover:text-white transition">
                        Catálogo
                    </Link>
                    <span>/</span>
                    <span className="text-slate-400">{producto.categoria}</span>
                    <span>/</span>
                    <span className="text-white font-semibold truncate max-w-[200px] sm:max-w-none">
                        {producto.nombre}
                    </span>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Inventario en tiempo real sincronizado</span>
                </div>
            </div>

            {/* Layout Principal 2 Columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
                
                {/* ============================================================== */}
                {/* COLUMNA IZQUIERDA: Hero del Producto & Ficha Técnica (7 cols)  */}
                {/* ============================================================== */}
                <div className="lg:col-span-7 space-y-5">
                    
                    {/* Tarjeta Principal de Presentación */}
                    <div className="bg-[#10131c] border border-[#1e2333] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                        
                        {/* Glow ambiental superior */}
                        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <div className="flex items-center gap-2">
                                <span className="bg-[#181a28] text-indigo-300 border border-[#2b3148] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                                    {producto.categoria}
                                </span>
                                <span className="hidden sm:inline-flex bg-[#141724] text-slate-400 border border-[#22283a] px-2.5 py-1 rounded-full text-[11px] font-medium">
                                    {categoryMeta.badge}
                                </span>
                            </div>

                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                    agotado
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : producto.stock <= 5
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${agotado ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                                {agotado ? 'Agotado' : `${producto.stock} unidades en stock`}
                            </span>
                        </div>

                        {/* Showcase Visual del Dispositivo */}
                        <div className="bg-[#0b0d14] border border-[#1e2332] rounded-2xl p-8 mb-6 flex flex-col items-center justify-center relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-2xl pointer-events-none"></div>
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#141724] border border-[#22283a] flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                {categoryMeta.icon}
                            </div>
                            <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                    <span className="text-emerald-400">✓</span> Entrega Express
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <span className="text-indigo-400">🛡️</span> 24 Meses Garantía
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <span className="text-amber-400">⚡</span> Hardware Genuino
                                </span>
                            </div>
                        </div>

                        {/* Nombre del Producto */}
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
                            {producto.nombre}
                        </h1>

                        {/* Bloque de Precio con Descuento */}
                        <div className="bg-[#0c0e15] border border-[#1a1f2d] rounded-2xl p-4.5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                    Precio Final con IVA incluido
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                                        {formatoMoneda(precioNumerico)}
                                    </span>
                                    <span className="text-sm font-mono text-slate-500 line-through">
                                        {formatoMoneda(precioReferencia)}
                                    </span>
                                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-md">
                                        -15% OFF
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 font-medium sm:text-right">
                                <div>🚚 Envío gratuito en compras &gt; ₡35.000</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">Retiro inmediato en bodega disponible</div>
                            </div>
                        </div>

                        {/* Descripción del Producto */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Descripción y Especificaciones
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0b0d14] border border-[#1e2332] rounded-xl p-4">
                                {producto.descripcion}
                            </p>
                        </div>

                        {/* Grid de Especificaciones Rápidas */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {categoryMeta.specs.map((spec, i) => (
                                <div key={i} className="bg-[#0b0d14] border border-[#1e2332] rounded-xl p-3">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                                        {spec.label}
                                    </span>
                                    <span className="text-xs font-bold text-white mt-1 block">
                                        {spec.val}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Disponibilidad en Tiempo Real */}
                        <div className="bg-[#0b0d14] border border-[#1e2332] rounded-2xl p-4 mb-6">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${agotado ? 'bg-red-500' : 'bg-emerald-400 animate-pulse'}`}></span>
                                    <span className="font-semibold text-white">
                                        {agotado ? 'Inventario agotado para este artículo' : `Disponibles ${producto.stock} artículos para entrega inmediata`}
                                    </span>
                                </div>
                                {producto.unidades_vendidas > 0 && (
                                    <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                        🔥 {producto.unidades_vendidas} vendidas históricamente
                                    </span>
                                )}
                            </div>
                            
                            {/* Barra de progreso de stock */}
                            <div className="w-full bg-[#141724] h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        agotado
                                            ? 'bg-red-500 w-0'
                                            : producto.stock <= 5
                                            ? 'bg-amber-500 w-1/4'
                                            : 'bg-emerald-500 w-3/4'
                                    }`}
                                ></div>
                            </div>
                        </div>

                        {/* Panel de Compra y Stepper */}
                        <div className="pt-5 border-t border-[#1b2030] flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                            {/* Stepper */}
                            <div className="flex items-center justify-between sm:justify-start gap-2.5 bg-[#0b0d14] border border-[#1e2332] rounded-xl px-3 py-2">
                                <span className="text-xs font-semibold text-slate-400">Cantidad:</span>
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

                            {/* Botón Añadir al Carrito */}
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={agotado}
                                className="flex-1 bg-[#141724] hover:bg-[#1c2133] border border-[#22283a] text-white font-bold py-3 px-5 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <span>{agotado ? 'Sin Stock' : 'Añadir al Carrito'}</span>
                            </button>

                            {/* Botón Comprar Ahora */}
                            <button
                                type="button"
                                onClick={handleComprarAhora}
                                disabled={agotado}
                                className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold py-3 px-5 rounded-xl text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <span>⚡</span>
                                <span>Comprar Ahora</span>
                            </button>
                        </div>

                        {agregadoMensaje && (
                            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between animate-fadeIn">
                                <div className="flex items-center gap-2">
                                    <span>✅</span>
                                    <span>¡{cantidad} unidad(es) de "{producto.nombre}" agregada(s) al carrito!</span>
                                </div>
                                <Link to="/checkout" className="underline font-bold hover:text-white">
                                    Ir a pagar →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* ============================================================== */}
                {/* COLUMNA DERECHA: Copiloto de IA (n8n & LangChain) (5 cols)    */}
                                {/* ============================================================== */}
                {/* COLUMNA DERECHA: Copiloto de IA (Diseño Pulido & Letras Grandes) */}
                {/* ============================================================== */}
                <div className="lg:col-span-5 space-y-4">
                    
                    {/* Tarjeta del Copiloto IA */}
                    <div className="bg-[#10131c] border border-[#1e2333] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                        
                        {/* Glow ambiental */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Header del Agente */}
                        <div className="flex items-center justify-between pb-5 border-b border-[#1b2030] mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white tracking-tight">
                                        Copiloto de IA TechStore
                                    </h3>
                                    <p className="text-xs text-indigo-300/80 font-medium">Inteligencia Generativa de Hardware</p>
                                </div>
                            </div>

                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#14231f] text-emerald-400 border border-[#1b3d33]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Online
                            </span>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-lg font-bold text-white mb-1.5">
                                Asistente Técnico y Comercial
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Genera argumentos de venta persuasivos en tiempo real y analiza compatibilidad con periféricos y accesorios clave.
                            </p>
                        </div>

                        {/* Botón Principal de Invocación con Estilo Premium */}
                        <button
                            type="button"
                            onClick={handleConsultarIA}
                            disabled={consultandoIA}
                            className="w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#8b5cf6] hover:from-[#4f46e5] hover:via-[#6d28d9] hover:to-[#7c3aed] shadow-xl shadow-indigo-600/30 transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer"
                        >
                            {consultandoIA ? (
                                <>
                                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    <span>Generando Análisis Inteligente...</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-lg">✨</span>
                                    <span>Generar Copy y Recomendaciones con IA</span>
                                </>
                            )}
                        </button>

                        {/* Manejo de Errores */}
                        {errorIA && (
                            <div className="mt-4">
                                <ErrorMessage error={errorIA} onClose={() => setErrorIA(null)} />
                            </div>
                        )}

                        {/* Resultados del Agente de IA con Letras Grandes y Espaciadas */}
                        {respuestaIA ? (
                            <div className="mt-7 space-y-6 pt-6 border-t border-[#1b2030] animate-fadeIn">
                                
                                {/* Bloque: Copy Comercial Persuasivo con Letra Grande */}
                                {respuestaIA.copy_comercial && (
                                    <div className="bg-[#0b0d14] border border-[#22283a] rounded-2xl p-5 sm:p-6 shadow-xl relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-[#818cf8] uppercase tracking-wider flex items-center gap-2">
                                                <span>📝</span> Copy Comercial Persuasivo
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopiarTexto(respuestaIA.copy_comercial)}
                                                className="text-xs font-semibold text-slate-300 hover:text-white bg-[#181a28] hover:bg-[#202438] border border-[#2b3145] px-3 py-1 rounded-lg flex items-center gap-1.5 transition"
                                                title="Copiar texto al portapapeles"
                                            >
                                                {copiado ? '✓ Copiado' : '📋 Copiar'}
                                            </button>
                                        </div>

                                        {respuestaIA.titular && (
                                            <h5 className="text-base sm:text-lg font-extrabold text-white mb-2.5 tracking-tight">
                                                {respuestaIA.titular}
                                            </h5>
                                        )}

                                        <p className="text-sm sm:text-base leading-relaxed text-slate-100 font-normal">
                                            "{respuestaIA.copy_comercial}"
                                        </p>
                                    </div>
                                )}

                                {/* Bloque: Puntos Fuertes Destacados */}
                                {respuestaIA.puntos_clave && respuestaIA.puntos_clave.length > 0 && (
                                    <div>
                                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                                            <span>⚡</span> Puntos Fuertes Destacados:
                                        </span>
                                        <div className="space-y-2.5">
                                            {respuestaIA.puntos_clave.map((punto, idx) => {
                                                const titulo = typeof punto === 'object' ? punto.titulo : punto;
                                                const desc = typeof punto === 'object' ? punto.descripcion : null;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="bg-[#0b0d14] border border-[#1e2332] rounded-2xl p-4 flex items-start gap-3.5 shadow-sm"
                                                    >
                                                        <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">
                                                            ✓
                                                        </div>
                                                        <div>
                                                            <h5 className="font-bold text-white text-sm sm:text-base leading-snug">
                                                                {titulo}
                                                            </h5>
                                                            {desc && (
                                                                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                                                                    {desc}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Bloque: Productos Complementarios Recomendados */}
                                {respuestaIA.recomendados && respuestaIA.recomendados.length > 0 && (
                                    <div>
                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                                            <span>🎯</span> Productos Complementarios Sugeridos:
                                        </span>
                                        <div className="space-y-3">
                                            {respuestaIA.recomendados.map((item, idx) => {
                                                const nombreItem = typeof item === 'string' ? item : item.nombre;
                                                const justificacion = typeof item === 'object' && item.justificacion ? item.justificacion : null;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="bg-[#0b0d14] border border-[#1e2332] hover:border-[#2b3248] rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition shadow-sm"
                                                    >
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                                                                #{idx + 1}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-bold text-white text-sm sm:text-base">
                                                                    {nombreItem}
                                                                </h5>
                                                                {justificacion && (
                                                                    <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                                                                        {justificacion}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <Link
                                                            to="/catalogo"
                                                            className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#141724] hover:bg-[#1c2133] border border-[#22283a] text-xs font-semibold text-indigo-300 hover:text-white transition shrink-0"
                                                        >
                                                            <span>Ver en catálogo</span>
                                                            <span>→</span>
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="mt-6 p-6 rounded-2xl bg-[#0b0d14] border border-[#1e2332] text-center text-xs sm:text-sm text-slate-400 leading-relaxed">
                                <div className="text-2xl mb-2">⚡</div>
                                Presiona el botón superior para generar un análisis comercial y recomendaciones de hardware adaptadas a este artículo.
                            </div>
                        )}

                    </div>

                </div>

            </div>

            {/* Modal Reusable del Copiloto IA (opcional para vista ampliada) */}
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
