import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFetch } from '../hooks/useFetch';
import { getClientes, validarCupon, crearOrden } from '../services/api';
import { obtenerRecomendacionesCarrito } from '../services/aiService';
import ErrorMessage from '../components/ErrorMessage';
import AiAssistantModal from '../components/AiAssistantModal';

export default function Checkout() {
    const { cart, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();
    const { data: clientes, loading: cargandoClientes } = useFetch(getClientes, []);

    const [clienteId, setClienteId] = useState('');
    const [cuponCodigo, setCuponCodigo] = useState('');
    const [cuponAplicado, setCuponAplicado] = useState(null);
    const [validandoCupon, setValidandoCupon] = useState(false);
    const [cuponError, setCuponError] = useState(null);

    const [procesandoOrden, setProcesandoOrden] = useState(false);
    const [ordenError, setOrdenError] = useState(null);
    const [ordenExitosa, setOrdenExitosa] = useState(null);

    // Estado para el Copiloto de IA (n8n Webhook)
    const [modalIAAbierto, setModalIAAbierto] = useState(false);
    const [consultandoIA, setConsultandoIA] = useState(false);
    const [respuestaIA, setRespuestaIA] = useState(null);
    const [errorIA, setErrorIA] = useState(null);

    const handleConsultarIACarrito = async () => {
        if (cart.length === 0) return;
        setConsultandoIA(true);
        setErrorIA(null);
        setModalIAAbierto(true);
        try {
            const res = await obtenerRecomendacionesCarrito(cart);
            if (res && res.ok) {
                setRespuestaIA(res.data);
            } else {
                throw new Error(res.error || 'Error al consultar sugerencias del carrito');
            }
        } catch (err) {
            setErrorIA(err.message || 'No fue posible contactar al asistente de IA');
        } finally {
            setConsultandoIA(false);
        }
    };

    const clienteSeleccionado = (clientes || []).find(c => c.id === parseInt(clienteId, 10));

    // Cálculos financieros
    const porcentajeDescuento = cuponAplicado ? parseFloat(cuponAplicado.porcentaje) : 0;
    const montoDescuento = subtotal * (porcentajeDescuento / 100);
    const subtotalNeto = subtotal - montoDescuento;

    // Regla de envío por ciudad y umbral gratuito (> ₡35.000)
    const calcularCostoEnvio = () => {
        if (!clienteSeleccionado) return 0;
        if (subtotalNeto > 35000) return 0;

        const ciudadNorm = (clienteSeleccionado.ciudad || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();

        if (ciudadNorm === 'san jose') return 2000;
        if (['heredia', 'alajuela', 'cartago'].includes(ciudadNorm)) return 3500;
        return 5000;
    };

    const costoEnvio = calcularCostoEnvio();
    const envioGratis = clienteSeleccionado && subtotalNeto > 35000;
    const totalFinal = Math.max(0, subtotalNeto + costoEnvio);

    // Formateador limpio de colones
    const formatoMoneda = (monto) => {
        const num = Math.round(Number(monto) || 0);
        return `₡${num.toLocaleString('es-CR')}`;
    };

    const handleValidarCupon = async (e) => {
        e.preventDefault();
        if (!cuponCodigo.trim()) return;

        if (!clienteId) {
            setCuponError({ status: 400, message: 'Primero selecciona un cliente registrado para validar el cupón' });
            return;
        }

        setValidandoCupon(true);
        setCuponError(null);
        setCuponAplicado(null);

        try {
            const res = await validarCupon({
                codigo: cuponCodigo.trim(),
                cliente_id: parseInt(clienteId, 10)
            });
            if (res.valido) {
                setCuponAplicado(res.cupon);
            }
        } catch (err) {
            setCuponError(err);
        } finally {
            setValidandoCupon(false);
        }
    };

    const handleRemoverCupon = () => {
        setCuponAplicado(null);
        setCuponCodigo('');
        setCuponError(null);
    };

    const handleConfirmarOrden = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;

        if (!clienteId) {
            setOrdenError({ status: 400, message: 'Debes seleccionar un cliente registrado antes de confirmar la compra' });
            return;
        }

        setProcesandoOrden(true);
        setOrdenError(null);

        const payload = {
            cliente_id: parseInt(clienteId, 10),
            cupon_codigo: cuponAplicado ? cuponAplicado.codigo : null,
            items: cart.map(item => ({
                producto_id: item.id,
                cantidad: item.cantidad
            }))
        };

        try {
            const nuevaOrden = await crearOrden(payload);
            setOrdenExitosa(nuevaOrden);
            clearCart();
        } catch (err) {
            setOrdenError(err);
        } finally {
            setProcesandoOrden(false);
        }
    };

    // Pantalla de Confirmación de Compra Exitosa (201 Created)
    if (ordenExitosa) {
        return (
            <div className="py-12 px-4 max-w-2xl mx-auto">
                <div className="bg-[#10131c] border border-[#1e2333] rounded-2xl p-8 sm:p-10 shadow-2xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#14231f] text-emerald-400 border border-[#1b3d33] mb-3 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Transacción Confirmada · HTTP 201 Created
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                        ¡Orden #{ordenExitosa.orden.id} Procesada con Éxito!
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
                        El inventario fue descontado de forma atómica en PostgreSQL y se ha generado la reserva para despacho.
                    </p>

                    <div className="bg-[#0b0d14] border border-[#1e2332] rounded-xl p-5 text-left mb-6 space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between py-1 border-b border-[#1a1f2d]">
                            <span className="text-slate-400">Cliente</span>
                            <span className="font-semibold text-white">{ordenExitosa.orden.cliente_nombre}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#1a1f2d]">
                            <span className="text-slate-400">Total Facturado</span>
                            <span className="font-bold font-mono text-emerald-400">{formatoMoneda(ordenExitosa.orden.total)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#1a1f2d]">
                            <span className="text-slate-400">Costo de Envío</span>
                            <span className="text-slate-200">{formatoMoneda(ordenExitosa.orden.costo_envio)}</span>
                        </div>
                        {ordenExitosa.orden.descuento_aplicado > 0 && (
                            <div className="flex justify-between py-1 border-b border-[#1a1f2d]">
                                <span className="text-slate-400">Descuento ({ordenExitosa.orden.cupon_codigo})</span>
                                <span className="text-indigo-400 font-semibold">-{formatoMoneda(ordenExitosa.orden.descuento_aplicado)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-1">
                            <span className="text-slate-400">Estado de Orden</span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase">
                                {ordenExitosa.orden.estado}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/catalogo"
                            className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold py-2.5 px-6 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-indigo-600/25"
                        >
                            Seguir Explorando Catálogo
                        </Link>
                        <Link
                            to="/"
                            className="bg-[#141724] hover:bg-[#1a1e2f] border border-[#22283a] text-slate-300 hover:text-white font-semibold py-2.5 px-6 rounded-xl text-xs sm:text-sm transition"
                        >
                            Ver Métricas en Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Carrito Vacío
    if (cart.length === 0) {
        return (
            <div className="py-16 text-center max-w-lg mx-auto">
                <div className="bg-[#10131c] border border-[#1e2333] rounded-2xl p-8 sm:p-12 shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-[#141724] border border-[#22283a] text-slate-400 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Tu carrito está vacío</h2>
                    <p className="text-xs sm:text-sm text-slate-400 mb-6">
                        No has añadido ningún producto de tecnología a tu selección de compra aún.
                    </p>
                    <Link
                        to="/catalogo"
                        className="inline-flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-indigo-600/25"
                    >
                        <span>Explorar Hardware</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-12 animate-fadeIn">
            {/* Cabecera Principal con Badge de Paso */}
            <div className="mb-7">
                <div className="inline-flex items-center gap-1.5 bg-[#181a2e] text-[#818cf8] border border-[#292e4c] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider mb-2 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8]"></span>
                    PASO 2 DE 2 · TRANSACCIÓN SEGURA
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Finalizar Compra & Checkout
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Revisa tus artículos, selecciona tu ubicación y aplica tus cupones antes de emitir la orden.
                </p>
            </div>

            {/* Layout en 2 Columnas idéntico a la captura */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-start">
                
                {/* ============================================================== */}
                {/* COLUMNA IZQUIERDA: Artículos en tu Carrito (7 cols)            */}
                {/* ============================================================== */}
                <div className="lg:col-span-7 space-y-4">
                    
                    {/* Tarjeta de Productos */}
                    <div className="bg-[#10131c] border border-[#1e2333] rounded-2xl p-5 sm:p-6 shadow-xl">
                        
                        {/* Header de la tarjeta */}
                        <div className="flex items-center justify-between pb-4 border-b border-[#1b2030] mb-4">
                            <div className="flex items-center gap-2.5">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                                    Artículos en tu Carrito
                                </h2>
                                <span className="bg-[#181a26] text-slate-300 px-2 py-0.5 rounded-md text-xs font-bold border border-[#262b3d]">
                                    {cart.length}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleConsultarIACarrito}
                                    disabled={cart.length === 0}
                                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181a2e] text-[#818cf8] border border-[#2b2f4c] hover:bg-[#20233b] text-[11px] font-bold transition cursor-pointer"
                                    title="Consultar Copiloto IA para sugerencias"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8] animate-pulse"></span>
                                    Copiloto IA
                                </button>
                                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Stock verificado</span>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Items */}
                        <div className="space-y-3">
                            {cart.map((item) => {
                                const precioNum = parseFloat(item.precio || 0);
                                return (
                                    <div
                                        key={item.id}
                                        className="bg-[#0c0e15] border border-[#1a1f2d] rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-[#2b3248] transition-colors"
                                    >
                                        {/* Thumbnail & Info */}
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#141724] border border-[#22283a] flex items-center justify-center text-indigo-400 shrink-0">
                                                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="truncate">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                                                        {item.nombre}
                                                    </h4>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#181a28] text-indigo-300 border border-[#2b3148] shrink-0">
                                                        {item.categoria === 'Periféricos' ? 'USB-C' : item.categoria}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                                    <span>{item.categoria}</span>
                                                    <span>•</span>
                                                    <span>Sensor / Chip de alta gama</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                    {formatoMoneda(precioNum)} c/u
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stepper, Precio y Papelera */}
                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#1a1f2d]">
                                            <div className="flex items-center bg-[#131622] border border-[#222839] rounded-lg p-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                                                    className="w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-[#1c2133] flex items-center justify-center text-xs font-bold transition"
                                                >
                                                    -
                                                </button>
                                                <span className="w-7 text-center text-xs font-mono font-bold text-white">
                                                    {item.cantidad}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                                                    disabled={item.stock !== undefined && item.cantidad >= item.stock}
                                                    className="w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-[#1c2133] flex items-center justify-center text-xs font-bold transition disabled:opacity-20"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="font-mono font-bold text-xs sm:text-sm text-white text-right min-w-[70px]">
                                                {formatoMoneda(precioNum * item.cantidad)}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition"
                                                title="Eliminar producto"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Acciones del pie de carrito */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#1b2030] text-xs">
                            <Link
                                to="/catalogo"
                                className="text-slate-400 hover:text-white font-medium flex items-center gap-1.5 transition"
                            >
                                <span>←</span>
                                <span>Seguir agregando productos</span>
                            </Link>
                            <button
                                type="button"
                                onClick={clearCart}
                                className="text-slate-400 hover:text-red-400 font-medium transition"
                            >
                                🗑️ Vaciar Carrito
                            </button>
                        </div>
                    </div>

                    {/* Dos Tarjetas Informativas Inferiores (Envío Express Priority & Garantía Tech Direct) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="bg-[#10131c] border border-[#1e2333] rounded-2xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#141724] border border-[#22283a] text-slate-300 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1m-6 0a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">Envío Express Priority</h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                                    Entrega estimada en 24-48h con tracking telemétrico en tiempo real.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[#10131c] border border-[#1e2333] rounded-2xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#141724] border border-[#22283a] text-emerald-400 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">Garantía Tech Direct</h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                                    30 días de devolución directa sin preguntas y soporte 24/7 de hardware.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ============================================================== */}
                {/* COLUMNA DERECHA: Datos de Envío y Pago (5 cols)                */}
                {/* ============================================================== */}
                <div className="lg:col-span-5 bg-[#10131c] border border-[#1e2333] rounded-2xl p-5 sm:p-6 shadow-xl">
                    
                    {/* Header Columna Derecha */}
                    <div className="flex items-center gap-2.5 pb-4 border-b border-[#1b2030] mb-5">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                            Datos de Envío y Pago
                        </h2>
                    </div>

                    <form onSubmit={handleConfirmarOrden} className="space-y-4">
                        
                        {/* Selector de Cliente */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="cliente" className="text-xs font-semibold text-slate-300">
                                    Cliente / Comprador <span className="text-red-400">*</span>
                                </label>
                                <span className="text-[11px] text-slate-400">Perfil guardado</span>
                            </div>

                            {cargandoClientes ? (
                                <div className="text-xs text-slate-400 py-2">Cargando compradores registrados...</div>
                            ) : (
                                <select
                                    id="cliente"
                                    value={clienteId}
                                    onChange={(e) => {
                                        setClienteId(e.target.value);
                                        setCuponAplicado(null);
                                        setCuponError(null);
                                    }}
                                    className="w-full bg-[#0b0d14] border border-[#1e2332] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#6366f1] transition cursor-pointer"
                                    required
                                >
                                    <option value="">Selecciona un cliente comprador...</option>
                                    {(clientes || []).map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.nombre} • Dev Lead ({c.email})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Dirección de Despacho */}
                        <div>
                            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                                Dirección de Despacho
                            </label>
                            <div className="bg-[#0b0d14] border border-[#1e2332] rounded-xl p-3 flex items-start justify-between gap-3 text-xs">
                                <div className="flex items-start gap-2.5">
                                    <svg className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                        <div className="font-semibold text-white">
                                            {clienteSeleccionado ? `${clienteSeleccionado.ciudad}, Costa Rica` : 'Edificio Quantum, Silicon Park, CP 28045'}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {clienteSeleccionado
                                                ? `Tarifa estimada según zona geográfica (${clienteSeleccionado.ciudad})`
                                                : 'Selecciona un cliente arriba para calcular tarifa y ruta'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] text-slate-400 hover:text-white cursor-pointer font-medium">
                                    Cambiar
                                </span>
                            </div>
                        </div>

                        {/* Cupón de Descuento */}
                        <div>
                            <label htmlFor="cupon" className="text-xs font-semibold text-slate-300 mb-1.5 block">
                                Cupón de Descuento
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3 text-slate-500 pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                                <input
                                    id="cupon"
                                    type="text"
                                    placeholder="SUPERTECH20 o BIENVENIDA10"
                                    value={cuponCodigo}
                                    onChange={(e) => setCuponCodigo(e.target.value)}
                                    disabled={!!cuponAplicado || validandoCupon}
                                    className="w-full bg-[#0b0d14] border border-[#1e2332] rounded-xl pl-9 pr-24 py-2 text-xs sm:text-sm text-white placeholder-slate-500 uppercase tracking-wider font-mono focus:outline-none focus:border-[#6366f1] transition disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={handleValidarCupon}
                                    disabled={validandoCupon || !cuponCodigo.trim() || !!cuponAplicado}
                                    className="absolute right-1 px-3 py-1.5 rounded-lg bg-[#181b28] hover:bg-[#22273a] text-white text-xs font-bold transition border border-[#2b3145] disabled:opacity-40"
                                >
                                    {validandoCupon ? 'Validando...' : 'Aplicar'}
                                </button>
                            </div>

                            {/* Badge de Cupón Aplicado */}
                            {cuponAplicado && (
                                <div className="mt-2 p-2 px-3 rounded-xl bg-[#1c1a2e] border border-[#373356] text-[#a5b4fc] text-xs flex items-center justify-between animate-fadeIn">
                                    <div className="flex items-center gap-1.5 font-medium truncate">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#a5b4fc]"></span>
                                        <span>¡Cupón {cuponAplicado.codigo} aplicado! -{formatoMoneda(montoDescuento)} ({cuponAplicado.porcentaje}% descuento)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoverCupon}
                                        className="text-slate-400 hover:text-white ml-2 text-sm font-bold"
                                        title="Remover cupón"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {cuponError && (
                                <div className="mt-2">
                                    <ErrorMessage error={cuponError} onClose={() => setCuponError(null)} />
                                </div>
                            )}
                        </div>

                        {/* Desglose de Precios */}
                        <div className="pt-3 border-t border-[#1b2030] space-y-2 text-xs sm:text-sm">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal de artículos</span>
                                <span className="font-mono text-white font-medium">{formatoMoneda(subtotal)}</span>
                            </div>

                            <div className="flex justify-between text-slate-400 items-center">
                                <span className="flex items-center gap-2">
                                    <span>Costo de Envío</span>
                                    {envioGratis && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            Gratis
                                        </span>
                                    )}
                                </span>
                                <span className="font-mono text-white font-medium">
                                    {envioGratis ? '₡0' : formatoMoneda(costoEnvio)}
                                </span>
                            </div>

                            {cuponAplicado && (
                                <div className="flex justify-between text-indigo-400 font-semibold">
                                    <span>Descuento aplicado</span>
                                    <span className="font-mono">-{formatoMoneda(montoDescuento)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-slate-400">
                                <span>Impuestos calculados (IVA 0%)</span>
                                <span className="font-mono text-slate-400">₡0</span>
                            </div>

                            {/* Total Final */}
                            <div className="pt-3.5 border-t border-[#1b2030] flex justify-between items-baseline">
                                <div>
                                    <span className="text-sm sm:text-base font-bold text-white tracking-tight block">
                                        Total a Pagar
                                    </span>
                                    <span className="text-[11px] text-slate-400">Impuestos y tasas incluidos</span>
                                </div>
                                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                                    {formatoMoneda(totalFinal)}
                                </span>
                            </div>
                        </div>

                        {/* Botón de Confirmación Principal */}
                        <button
                            type="submit"
                            disabled={procesandoOrden || !clienteId || cart.length === 0}
                            className="w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white bg-[#6366f1] hover:bg-[#4f46e5] shadow-lg shadow-indigo-600/25 transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {procesandoOrden ? (
                                <>
                                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    <span>Procesando Transacción en Servidor...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>Confirmar y Pagar Orden • {formatoMoneda(totalFinal)}</span>
                                </>
                            )}
                        </button>

                        {ordenError && (
                            <div className="mt-3">
                                <ErrorMessage error={ordenError} onClose={() => setOrdenError(null)} />
                            </div>
                        )}

                        {/* Footer de Seguridad y Pasarelas */}
                        <div className="pt-2 text-center">
                            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Pagos encriptados de extremo a extremo SSL de 256 bits</span>
                            </p>
                            <div className="text-[10px] font-bold tracking-widest text-slate-400 flex justify-center gap-3.5 uppercase mt-1.5">
                                <span>VISA</span>
                                <span>MASTERCARD</span>
                                <span>STRIPE</span>
                                <span>APPLE PAY</span>
                            </div>
                        </div>

                    </form>
                </div>

            </div>

            {/* Modal Reusable del Copiloto IA para el Carrito */}
            <AiAssistantModal
                isOpen={modalIAAbierto}
                onClose={() => setModalIAAbierto(false)}
                title="Copiloto IA: Diagnóstico de Carrito"
                subtitle="Análisis de compatibilidad y sugerencias complementarias personalizadas"
                loading={consultandoIA}
                error={errorIA}
                data={respuestaIA}
                tipo="carrito"
                onEjecutarConsulta={handleConsultarIACarrito}
            />
        </div>
    );
}
