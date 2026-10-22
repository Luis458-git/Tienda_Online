import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFetch } from '../hooks/useFetch';
import { getClientes, validarCupon, crearOrden } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

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

    const formatoMoneda = (monto) => {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            maximumFractionDigits: 0
        }).format(monto || 0);
    };

    const handleValidarCupon = async (e) => {
        e.preventDefault();
        if (!cuponCodigo.trim()) return;

        if (!clienteId) {
            setCuponError({ status: 400, message: 'Primero debes seleccionar un cliente para validar el cupón' });
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
            setOrdenError({ status: 400, message: 'Selecciona un cliente antes de procesar la compra' });
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
            // Manejo de errores 400 y 409 sin perder el estado del formulario
            setOrdenError(err);
        } finally {
            setProcesandoOrden(false);
        }
    };

    // Pantalla de Confirmación de Compra (201 Created)
    if (ordenExitosa) {
        return (
            <div className="py-12 px-4 sm:px-6 max-w-2xl mx-auto animate-fadeIn">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>

                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                        ¡Orden #{ordenExitosa.id} Creada con Éxito!
                    </h1>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
                        Transacción atómica completada bajo código <span className="text-emerald-400 font-mono font-semibold">201 Created</span>. El stock ha sido reservado de forma segura en PostgreSQL.
                    </p>

                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 text-left divide-y divide-slate-800/60 mb-8 space-y-3">
                        <div className="flex justify-between items-center pb-3">
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Cliente</span>
                            <span className="text-sm font-semibold text-slate-200">
                                {ordenExitosa.cliente?.nombre} ({ordenExitosa.cliente?.ciudad})
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 pb-3">
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Estado de Orden</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                {ordenExitosa.estado}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 pb-3 text-sm">
                            <span className="text-slate-400">Subtotal</span>
                            <span className="font-mono text-slate-200">{formatoMoneda(ordenExitosa.subtotal)}</span>
                        </div>
                        {ordenExitosa.descuento > 0 && (
                            <div className="flex justify-between items-center pt-3 pb-3 text-sm text-emerald-400">
                                <span>Descuento aplicado ({ordenExitosa.descuento_porcentaje}%)</span>
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
                        <div className="flex justify-between items-center pt-4 text-base">
                            <span className="font-bold text-white">Total Pagado</span>
                            <span className="font-mono font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                {formatoMoneda(ordenExitosa.total)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/"
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/60 transition-all shadow-sm"
                        >
                            Ver Dashboard de Métricas
                        </Link>
                        <Link
                            to="/catalogo"
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/25 transition-all"
                        >
                            Seguir Comprando
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Carrito Vacío
    if (cart.length === 0) {
        return (
            <div className="py-20 px-4 max-w-xl mx-auto text-center animate-fadeIn">
                <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-10 sm:p-12 shadow-xl backdrop-blur-md">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-slate-400 flex items-center justify-center mx-auto mb-5">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">Tu carrito está vacío</h2>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
                        Explora nuestro catálogo tecnológico y añade productos para proceder al pago con cálculo dinámico de envío.
                    </p>
                    <Link
                        to="/catalogo"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/25 transition-all"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
            {/* Header */}
            <div className="mb-8 border-b border-slate-800/80 pb-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Finalizar Compra & Checkout
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Revisa tus artículos, selecciona cliente de destino y aplica tus cupones con validación transaccional.
                </p>
            </div>

            {/* Error global (400 o 409) */}
            {ordenError && (
                <div className="mb-8">
                    <ErrorMessage error={ordenError} onClose={() => setOrdenError(null)} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* COLUMNA IZQUIERDA: Artículos en el Carrito (7 cols) */}
                <div className="lg:col-span-7 bg-slate-900/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-5">
                        <div className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h2 className="text-lg font-bold text-white tracking-tight">
                                Artículos en tu Carrito
                            </h2>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                            {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
                        </span>
                    </div>

                    {/* Lista de Productos */}
                    <div className="space-y-3.5">
                        {cart.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700/80 transition-all"
                            >
                                {/* Info con Thumbnail */}
                                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
                                        <svg className="w-6 h-6 text-indigo-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="truncate">
                                        <h4 className="font-bold text-slate-200 text-sm truncate hover:text-white transition">
                                            {item.nombre}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-500 font-medium">{item.categoria}</span>
                                            <span className="text-slate-600 text-xs">•</span>
                                            <span className="text-xs text-slate-400 font-mono">{formatoMoneda(item.precio)} c/u</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stepper de Cantidad, Total & Papelera */}
                                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 shadow-inner">
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition text-sm font-bold"
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
                                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition text-sm font-bold disabled:opacity-20"
                                            title="Aumentar cantidad"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="text-right font-mono font-bold text-sm text-slate-100 min-w-[85px]">
                                        {formatoMoneda(parseFloat(item.precio) * item.cantidad)}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition duration-150"
                                        title="Eliminar del carrito"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer del Carrito */}
                    <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800/60 text-xs">
                        <Link
                            to="/catalogo"
                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 font-semibold transition"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Seguir comprando</span>
                        </Link>
                        <button
                            type="button"
                            onClick={clearCart}
                            className="text-slate-500 hover:text-red-400 transition font-medium"
                        >
                            Vaciar carrito
                        </button>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Formulario de Envío, Cupones & Resumen (5 cols) */}
                <div className="lg:col-span-5 bg-slate-900/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/60 mb-5">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h2 className="text-lg font-bold text-white tracking-tight">
                            Datos de Envío y Resumen
                        </h2>
                    </div>

                    <form onSubmit={handleConfirmarOrden} className="space-y-5">
                        
                        {/* Selector de Cliente */}
                        <div>
                            <label htmlFor="cliente-select" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                                Cliente Registrado <span className="text-red-400">*</span>
                            </label>
                            {cargandoClientes ? (
                                <div className="text-xs text-slate-500 py-2">Cargando lista de clientes...</div>
                            ) : (
                                <select
                                    id="cliente-select"
                                    value={clienteId}
                                    onChange={(e) => {
                                        setClienteId(e.target.value);
                                        setCuponAplicado(null);
                                    }}
                                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition shadow-inner outline-none cursor-pointer"
                                    required
                                >
                                    <option value="" className="bg-slate-900 text-slate-500">Seleccionar comprador...</option>
                                    {(clientes || []).map((c) => (
                                        <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                                            {c.nombre} ({c.ciudad}) — {c.email}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Banner de Políticas de Envío por Ciudad */}
                        {clienteSeleccionado && (
                            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2">
                                <div className="flex items-center justify-between text-slate-300">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Ciudad de entrega:
                                    </span>
                                    <strong className="text-white font-semibold">{clienteSeleccionado.ciudad}</strong>
                                </div>

                                <div className="flex items-center justify-between text-slate-300">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                        </svg>
                                        Tarifa de envío:
                                    </span>
                                    {envioGratis ? (
                                        <span className="font-bold text-emerald-400 font-mono">GRATIS</span>
                                    ) : (
                                        <span className="font-mono text-slate-200">{formatoMoneda(costoEnvio)}</span>
                                    )}
                                </div>

                                {envioGratis ? (
                                    <div className="pt-1.5">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            ✓ Subtotal supera ₡35.000: Envío gratis activado
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-500 pt-1">
                                        💡 Agrega <strong className="text-slate-300 font-mono">{formatoMoneda(Math.max(0, 35000 - subtotalNeto))}</strong> para obtener <strong>Envío Gratis</strong>.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Campo de Cupón de Descuento */}
                        <div>
                            <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                                Cupón de Descuento
                            </label>

                            {cuponAplicado ? (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <div className="flex items-center gap-2 text-xs font-medium">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <span>
                                            Cupón <strong className="font-mono tracking-wider font-bold">{cuponAplicado.codigo}</strong> (-{cuponAplicado.porcentaje}%)
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoverCupon}
                                        className="text-emerald-400/70 hover:text-emerald-300 text-lg leading-none p-1"
                                        title="Remover cupón"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ej: DESCUENTO10"
                                        value={cuponCodigo}
                                        onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
                                        className="flex-1 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 font-mono tracking-wider transition shadow-inner outline-none uppercase"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleValidarCupon}
                                        disabled={validandoCupon || !cuponCodigo.trim()}
                                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 transition disabled:opacity-40 shrink-0"
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
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2.5 text-sm">
                            <div className="flex justify-between items-center text-slate-400">
                                <span>Subtotal</span>
                                <span className="font-mono text-slate-200 font-semibold">{formatoMoneda(subtotal)}</span>
                            </div>

                            {cuponAplicado && (
                                <div className="flex justify-between items-center text-emerald-400">
                                    <span>Descuento ({porcentajeDescuento}%)</span>
                                    <span className="font-mono font-semibold">-{formatoMoneda(montoDescuento)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-slate-400">
                                <span>Envío ({clienteSeleccionado ? clienteSeleccionado.ciudad : 'Sin seleccionar'})</span>
                                <span className="font-mono">
                                    {envioGratis ? (
                                        <span className="text-emerald-400 font-bold">Gratis</span>
                                    ) : (
                                        <span className="text-slate-200">{formatoMoneda(costoEnvio)}</span>
                                    )}
                                </span>
                            </div>

                            <div className="pt-3 border-t border-slate-800/80 flex justify-between items-baseline">
                                <span className="text-base font-bold text-white tracking-tight">Total a Pagar</span>
                                <span className="text-2xl font-bold text-white tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                    {formatoMoneda(totalFinal)}
                                </span>
                            </div>
                        </div>

                        {/* Botón de Confirmación */}
                        <button
                            type="submit"
                            disabled={procesandoOrden || !clienteId || cart.length === 0}
                            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        </div>
    );
}
