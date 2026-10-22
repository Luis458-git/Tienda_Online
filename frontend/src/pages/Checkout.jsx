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

    // Formateador nítido sin espacios excesivos
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

    // Pantalla de Confirmación de Compra (201 Created)
    if (ordenExitosa) {
        return (
            <div className="py-14 px-4 sm:px-6 max-w-2xl mx-auto">
                <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl text-center overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3 tracking-wide uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Transacción Confirmada · HTTP 201 Created
                    </span>

                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                        ¡Orden #{ordenExitosa.id} Procesada con Éxito!
                    </h1>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                        Se ha descontado el inventario de forma atómica en PostgreSQL y se generó el comprobante oficial.
                    </p>

                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 text-left divide-y divide-slate-800/60 mb-8 space-y-3.5 shadow-inner">
                        <div className="flex justify-between items-center pb-3">
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Cliente</span>
                            <span className="text-sm font-semibold text-slate-200">
                                {ordenExitosa.cliente?.nombre} ({ordenExitosa.cliente?.ciudad})
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 pb-3">
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Estado de la Orden</span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                {ordenExitosa.estado}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 pb-3 text-sm">
                            <span className="text-slate-400">Subtotal</span>
                            <span className="font-mono text-slate-200">{formatoMoneda(ordenExitosa.subtotal)}</span>
                        </div>
                        {ordenExitosa.descuento > 0 && (
                            <div className="flex justify-between items-center pt-3 pb-3 text-sm text-emerald-400 font-medium">
                                <span>Descuento Aplicado ({ordenExitosa.descuento_porcentaje}%)</span>
                                <span className="font-mono">-{formatoMoneda(ordenExitosa.descuento)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-3 pb-3 text-sm">
                            <span className="text-slate-400">Costo de Envío</span>
                            <span className="font-mono text-slate-200">
                                {ordenExitosa.envio === 0 ? (
                                    <span className="text-emerald-400 font-bold">GRATIS</span>
                                ) : (
                                    formatoMoneda(ordenExitosa.envio)
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline pt-4">
                            <span className="font-bold text-white text-base">Total Pagado</span>
                            <span className="font-mono font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-indigo-400">
                                {formatoMoneda(ordenExitosa.total)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
                        <Link
                            to="/"
                            className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/60 transition-all shadow-sm"
                        >
                            📊 Ver Dashboard de Métricas
                        </Link>
                        <Link
                            to="/catalogo"
                            className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/25 transition-all"
                        >
                            🛍️ Seguir Comprando
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Carrito Vacío
    if (cart.length === 0) {
        return (
            <div className="py-24 px-4 max-w-xl mx-auto text-center">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-10 sm:p-14 shadow-2xl backdrop-blur-xl">
                    <div className="w-20 h-20 rounded-3xl bg-slate-800/50 border border-slate-700/50 text-slate-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">Tu carrito está vacío</h2>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                        Explora los productos de nuestro catálogo y agrégalos a tu carrito para disfrutar de envío dinámico y descuentos.
                    </p>
                    <Link
                        to="/catalogo"
                        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-indigo-500/25 transition-all duration-200"
                    >
                        <span>Explorar Catálogo</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            
            {/* Header con Badge de Seguridad */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        Checkout Seguro · Transacción Protegida
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Finalizar Compra
                    </h1>
                    <p className="text-slate-400 text-sm mt-1.5">
                        Verifica tus artículos, selecciona tu ubicación de entrega y aplica tus cupones de descuento.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-xl shrink-0">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>PostgreSQL ACID (FOR UPDATE)</span>
                </div>
            </div>

            {/* Banner de Error (400 o 409) */}
            {ordenError && (
                <div className="mb-8">
                    <ErrorMessage error={ordenError} onClose={() => setOrdenError(null)} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ============================================================== */}
                {/* COLUMNA IZQUIERDA: Artículos en el Carrito (7 cols)            */}
                {/* ============================================================== */}
                <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/60 mb-6 gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white tracking-tight">Artículos Seleccionados</h2>
                                <p className="text-xs text-slate-400">Reserva de inventario en tiempo real</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleConsultarIACarrito}
                                disabled={cart.length === 0}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/25 to-indigo-600/25 hover:from-purple-600/40 hover:to-indigo-600/40 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-40"
                                title="Analizar el carrito con IA y sugerir productos complementarios"
                            >
                                <svg className="w-3.5 h-3.5 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Consultar Copiloto IA</span>
                            </button>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60">
                                {cart.length} {cart.length === 1 ? 'item' : 'items'}
                            </span>
                        </div>
                    </div>

                    {/* Lista de Productos en el Carrito */}
                    <div className="space-y-3.5">
                        {cart.map((item) => (
                            <div
                                key={item.id}
                                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-4.5 rounded-2xl bg-slate-950/50 border border-slate-800/70 hover:border-slate-700/80 transition-all duration-200"
                            >
                                {/* Thumbnail & Info */}
                                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner group-hover:border-indigo-500/30 transition-colors">
                                        <svg className="w-7 h-7 text-indigo-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="truncate">
                                        <h4 className="font-bold text-slate-100 text-sm truncate group-hover:text-white transition-colors">
                                            {item.nombre}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                                                {item.categoria}
                                            </span>
                                            <span className="text-slate-600 text-xs">•</span>
                                            <span className="text-xs text-slate-400 font-mono">
                                                {formatoMoneda(item.precio)} c/u
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stepper & Total */}
                                <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800/40">
                                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition text-sm font-bold"
                                            title="Disminuir cantidad"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center text-xs font-bold text-white font-mono">
                                            {item.cantidad}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                                            disabled={item.stock !== undefined && item.cantidad >= item.stock}
                                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition text-sm font-bold disabled:opacity-20"
                                            title="Aumentar cantidad"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="text-right font-mono font-bold text-sm text-slate-100 min-w-[90px]">
                                        {formatoMoneda(parseFloat(item.precio) * item.cantidad)}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition duration-150"
                                        title="Eliminar producto"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Enlaces de Acción Inferior */}
                    <div className="flex items-center justify-between pt-5 mt-6 border-t border-slate-800/60 text-xs">
                        <Link
                            to="/catalogo"
                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 font-semibold transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Seguir comprando</span>
                        </Link>
                        <button
                            type="button"
                            onClick={clearCart}
                            className="text-slate-500 hover:text-red-400 transition-colors font-medium"
                        >
                            Vaciar carrito
                        </button>
                    </div>

                    {/* Bloque Informativo de Garantía */}
                    <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-800/40 text-center">
                        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/40">
                            <span className="text-base block mb-1">⚡</span>
                            <span className="text-[11px] text-slate-400 font-medium block">Despacho Inmediato</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/40">
                            <span className="text-base block mb-1">🛡️</span>
                            <span className="text-[11px] text-slate-400 font-medium block">Garantía Oficial</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/40">
                            <span className="text-base block mb-1">📦</span>
                            <span className="text-[11px] text-slate-400 font-medium block">Embalaje Seguro</span>
                        </div>
                    </div>
                </div>

                {/* ============================================================== */}
                {/* COLUMNA DERECHA: Datos de Envío, Cupones & Resumen (5 cols)     */}
                {/* ============================================================== */}
                <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>

                    <div className="flex items-center gap-3 pb-5 border-b border-slate-800/60 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white tracking-tight">Datos de Entrega y Pago</h2>
                            <p className="text-xs text-slate-400">Tarifas según ciudad y cupones</p>
                        </div>
                    </div>

                    <form onSubmit={handleConfirmarOrden} className="space-y-5">
                        
                        {/* Selector de Cliente Registrado */}
                        <div>
                            <label htmlFor="cliente-select" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
                                Cliente Registrado <span className="text-red-400">*</span>
                            </label>
                            {cargandoClientes ? (
                                <div className="text-xs text-slate-500 py-2">Cargando compradores registrados...</div>
                            ) : (
                                <div className="relative">
                                    <select
                                        id="cliente-select"
                                        value={clienteId}
                                        onChange={(e) => {
                                            setClienteId(e.target.value);
                                            setCuponAplicado(null);
                                        }}
                                        className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl px-4 py-3 text-sm text-slate-100 transition shadow-inner outline-none cursor-pointer appearance-none pr-10"
                                        required
                                    >
                                        <option value="" className="bg-slate-900 text-slate-500">Seleccionar comprador...</option>
                                        {(clientes || []).map((c) => (
                                            <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                                                {c.nombre} ({c.ciudad}) — {c.email}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tarjeta de Política de Envío y Regla de Negocio */}
                        {clienteSeleccionado && (
                            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4.5 text-xs space-y-2.5 shadow-inner">
                                <div className="flex items-center justify-between text-slate-300">
                                    <span className="flex items-center gap-2 text-slate-400 font-medium">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Destino:
                                    </span>
                                    <strong className="text-white font-semibold">{clienteSeleccionado.ciudad}</strong>
                                </div>

                                <div className="flex items-center justify-between text-slate-300">
                                    <span className="flex items-center gap-2 text-slate-400 font-medium">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                        </svg>
                                        Tarifa de Envío:
                                    </span>
                                    {envioGratis ? (
                                        <span className="font-extrabold text-emerald-400 font-mono tracking-wide">GRATIS</span>
                                    ) : (
                                        <span className="font-mono text-slate-200 font-semibold">{formatoMoneda(costoEnvio)}</span>
                                    )}
                                </div>

                                {envioGratis ? (
                                    <div className="pt-2 border-t border-slate-800/60">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Subtotal supera ₡35,000 · Envío Gratuito Activado
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-800/40">
                                        💡 Agrega <strong className="text-slate-300 font-mono">{formatoMoneda(Math.max(0, 35000 - subtotalNeto))}</strong> más para obtener <strong>Envío Gratis</strong>.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Campo de Cupón de Descuento */}
                        <div>
                            <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
                                Cupón Promocional
                            </label>

                            {cuponAplicado ? (
                                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm">
                                    <div className="flex items-center gap-2.5 text-xs font-medium">
                                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <span>
                                            Cupón <strong className="font-mono tracking-wider font-bold">{cuponAplicado.codigo}</strong> (-{cuponAplicado.porcentaje}%)
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoverCupon}
                                        className="text-emerald-400/60 hover:text-emerald-300 text-lg leading-none p-1 transition-colors"
                                        title="Remover cupón"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            placeholder="EJ: DESCUENTO10, SUPERTECH20"
                                            value={cuponCodigo}
                                            onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
                                            className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 font-mono tracking-wider transition shadow-inner outline-none uppercase"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleValidarCupon}
                                        disabled={validandoCupon || !cuponCodigo.trim()}
                                        className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 transition-all duration-150 disabled:opacity-40 shrink-0 shadow-sm"
                                    >
                                        {validandoCupon ? 'Validando...' : 'Aplicar'}
                                    </button>
                                </div>
                            )}

                            {cuponError && (
                                <div className="mt-2.5">
                                    <ErrorMessage error={cuponError} onClose={() => setCuponError(null)} />
                                </div>
                            )}
                        </div>

                        {/* Desglose de Totales */}
                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3 text-sm shadow-inner">
                            <div className="flex justify-between items-center text-slate-400 text-xs sm:text-sm">
                                <span>Subtotal</span>
                                <span className="font-mono text-slate-200 font-semibold">{formatoMoneda(subtotal)}</span>
                            </div>

                            {cuponAplicado && (
                                <div className="flex justify-between items-center text-emerald-400 text-xs sm:text-sm font-medium">
                                    <span>Descuento ({porcentajeDescuento}%)</span>
                                    <span className="font-mono font-bold">-{formatoMoneda(montoDescuento)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-slate-400 text-xs sm:text-sm">
                                <span>Envío ({clienteSeleccionado ? clienteSeleccionado.ciudad : 'Sin seleccionar'})</span>
                                <span className="font-mono">
                                    {envioGratis ? (
                                        <span className="text-emerald-400 font-bold">Gratis</span>
                                    ) : (
                                        <span className="text-slate-200 font-semibold">{formatoMoneda(costoEnvio)}</span>
                                    )}
                                </span>
                            </div>

                            <div className="pt-3.5 border-t border-slate-800/80 flex justify-between items-baseline">
                                <span className="text-base font-bold text-white tracking-tight">Total a Pagar</span>
                                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-indigo-400">
                                    {formatoMoneda(totalFinal)}
                                </span>
                            </div>
                        </div>

                        {/* Botón de Confirmación Principal */}
                        <button
                            type="submit"
                            disabled={procesandoOrden || !clienteId || cart.length === 0}
                            className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-500/25 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 active:scale-[0.99]"
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
                                    <svg className="w-4 h-4 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>Confirmar y Pagar Orden · {formatoMoneda(totalFinal)}</span>
                                </>
                            )}
                        </button>

                        <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Transacción atómica protegida con PostgreSQL (BEGIN / COMMIT / ROLLBACK)</span>
                        </p>
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
