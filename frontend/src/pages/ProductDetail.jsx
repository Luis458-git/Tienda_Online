import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { getProductoById } from '../services/api';
import { generarDescripcionProducto, consultarEstadoN8N } from '../services/aiService';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [cantidad, setCantidad] = useState(1);
    const [agregadoMensaje, setAgregadoMensaje] = useState(false);
    const [copiado, setCopiado] = useState(false);

    // Estado de n8n y Copiloto
    const [n8nStatus, setN8nStatus] = useState({
        status: 'inactive',
        badge: { texto: 'n8n Inactivo', color: 'amber' }
    });

    useEffect(() => {
        consultarEstadoN8N().then(st => {
            if (st) setN8nStatus(st);
        });
    }, []);

    // Estado del Agente de IA y Copiloto (Únicamente generado si n8n responde)
    const [consultandoIA, setConsultandoIA] = useState(false);
    const [pitchIA, setPitchIA] = useState(null);
    const [errorIA, setErrorIA] = useState(null);
    const [bundle1Checked, setBundle1Checked] = useState(true);
    const [bundle2Checked, setBundle2Checked] = useState(true);
    const [bundleRecomendados, setBundleRecomendados] = useState(null);
    const [inputPregunta, setInputPregunta] = useState('');

    const {
        data: producto,
        loading,
        error
    } = useFetch(() => getProductoById(id || 2), [id]);

    const formatoMoneda = (monto) => {
        const num = Math.round(Number(monto) || 0);
        return `₡${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
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
        if (!texto) return;
        navigator.clipboard.writeText(texto.replace(/^"|"$/g, ''));
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    const handleConsultarIA = async () => {
        if (!producto) return;
        setConsultandoIA(true);
        setErrorIA(null);
        try {
            const respuesta = await generarDescripcionProducto(producto.nombre, producto.categoria);
            if (respuesta && respuesta.ok && respuesta.data) {
                setPitchIA(respuesta.data.pitch || respuesta.data.copy_comercial || respuesta.data.titular);
                if (respuesta.data.recomendados && respuesta.data.recomendados.length > 0) {
                    setBundleRecomendados(respuesta.data.recomendados);
                }
            } else {
                setPitchIA(null);
                setErrorIA(respuesta?.error || 'El workflow de n8n está inactivo en http://localhost:5678. Activa el interruptor "Active" para que la IA responda.');
            }
        } catch {
            setPitchIA(null);
            setErrorIA('No se pudo conectar con n8n. Por favor verifica que el servidor esté encendido y el workflow activo en http://localhost:5678.');
        } finally {
            setConsultandoIA(false);
        }
    };

    const handleAplicarBundle = () => {
        let added = 0;
        if (bundle1Checked && bundleRecomendados?.[0]) {
            const nom1 = typeof bundleRecomendados[0] === 'string' ? bundleRecomendados[0] : (bundleRecomendados[0].nombre || 'Accesorio Compatible');
            addToCart({ id: 501, nombre: nom1, precio: 12000, categoria: 'Accesorios' }, 1);
            added++;
        }
        if (bundle2Checked && bundleRecomendados?.[1]) {
            const nom2 = typeof bundleRecomendados[1] === 'string' ? bundleRecomendados[1] : (bundleRecomendados[1].nombre || 'Accesorio Compatible');
            addToCart({ id: 502, nombre: nom2, precio: 8500, categoria: 'Accesorios' }, 1);
            added++;
        }
        if (added > 0) {
            setAgregadoMensaje(true);
            setTimeout(() => setAgregadoMensaje(false), 2500);
        }
    };

    const handlePreguntarDirecto = (texto) => {
        const q = (texto || inputPregunta).trim();
        if (!q) return;
        setInputPregunta('');
        window.dispatchEvent(new CustomEvent('abrir-chat-ia', {
            detail: { pregunta: q, producto }
        }));
    };

    if (loading) return <LoadingSpinner mensaje="Cargando telemetría de hardware CyberForge..." />;
    if (error) {
        return (
            <div className="py-16 max-w-lg mx-auto text-center">
                <ErrorMessage error={error} />
                <div className="mt-6">
                    <Link to="/catalogo" className="cf-btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">
                        ← Volver al catálogo de hardware
                    </Link>
                </div>
            </div>
        );
    }
    if (!producto) return null;

    const agotado = producto.stock <= 0;
    const precioNumerico = parseFloat(producto.precio || 22000);
    const precioAnterior = Math.round(precioNumerico * 1.15);

    // Cálculo dinámico del precio total del bundle seleccionado
    let bundleTotal = 0;
    if (bundle1Checked) bundleTotal += 9500;
    if (bundle2Checked) bundleTotal += 4200;

    return (
        <div className="space-y-6 animate-fadeIn w-full">
            
            {/* Sub-barra: Breadcrumbs + Estado de Sincronización (Imagen 1) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                    <Link to="/catalogo" className="hover:text-cyan-400 transition">
                        Catálogo
                    </Link>
                    <span className="text-slate-600">/</span>
                    <span className="text-slate-300">{producto.categoria}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-white font-bold tracking-tight">
                        {producto.nombre}
                    </span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Inventario en tiempo real sincronizado</span>
                </div>
            </div>

            {/* Layout Principal en 2 Columnas (Imagen 1) */}
            <div className="cf-product-grid">
                
                {/* ============================================================== */}
                {/* COLUMNA IZQUIERDA: Tarjeta Principal del Producto (7 cols)    */}
                {/* ============================================================== */}
                <div className="space-y-6">
                    
                    {/* Tarjeta de Galería y Badges */}
                    <div className="cf-card p-6 border border-slate-800 relative">
                        
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                                    {producto.categoria.toUpperCase()}
                                </span>
                                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                    USB-C • Ultra Low Latency
                                </span>
                            </div>

                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                <span>{producto.stock} en stock</span>
                            </span>
                        </div>

                        {/* Canvas Visual con Resplandor Neón y Gráfico SVG del Mouse */}
                        <div className="cf-showcase-canvas">
                            <div className="cf-showcase-aura"></div>
                            
                            {/* Ilustración SVG del Hardware Neón */}
                            <svg className="w-40 h-40 cf-glow-cyan relative z-10 transition-transform duration-500 hover:scale-105" viewBox="0 0 160 220" fill="none">
                                <defs>
                                    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#1e293b" />
                                        <stop offset="50%" stopColor="#0f172a" />
                                        <stop offset="100%" stopColor="#070b16" />
                                    </linearGradient>
                                    <linearGradient id="cyanPurple" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#00f0ff" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                                <path d="M80 15 C45 15, 25 50, 25 120 C25 175, 45 205, 80 205 C115 205, 135 175, 135 120 C135 50, 115 15, 80 15 Z" 
                                      fill="url(#bodyGrad)" stroke="url(#cyanPurple)" strokeWidth="2.5" />
                                <line x1="80" y1="15" x2="80" y2="85" stroke="#334155" strokeWidth="2" />
                                <rect x="75" y="38" width="10" height="26" rx="5" fill="#030712" stroke="#00f0ff" strokeWidth="1.8" />
                                <circle cx="80" cy="145" r="14" stroke="#a855f7" strokeWidth="2" strokeDasharray="6 3" />
                                <circle cx="80" cy="145" r="5" fill="#00f0ff" />
                                <path d="M30 110 C36 125, 36 145, 30 160" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                                <path d="M130 110 C124 125, 124 145, 130 160" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                            </svg>

                            {/* Floating Chip Overlay */}
                            <div className="cf-sensor-chip">
                                <span className="text-cyan-400">⚡</span>
                                <span>Sensor PixArt 3395 Next-Gen</span>
                            </div>
                        </div>

                        {/* Value Props Row */}
                        <div className="cf-trust-row">
                            <div className="flex items-center justify-center gap-1.5 text-emerald-400">
                                <span>✓</span>
                                <span className="text-slate-300">Entrega Express</span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 text-sky-400">
                                <span>✓</span>
                                <span className="text-slate-300">24 Meses Garantía</span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 text-amber-400">
                                <span>✦</span>
                                <span className="text-slate-300">Stock Genuino</span>
                            </div>
                        </div>
                    </div>

                    {/* Precios, Descripción & Specs */}
                    <div className="space-y-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                                {producto.nombre}
                            </h1>
                            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-1">
                                PRECIO FINAL CON IVA INCLUIDO
                            </p>
                        </div>

                        {/* Precios */}
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono tracking-tight">
                                {formatoMoneda(precioNumerico)}
                            </span>
                            <span className="text-lg text-slate-500 line-through font-mono">
                                {formatoMoneda(precioAnterior)}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                -15% OFF
                            </span>
                        </div>

                        {/* Alerta de Envío Gratuito */}
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
                            <span className="text-base">🚚</span>
                            <p>
                                <strong className="text-cyan-300">Envío gratuito</strong> en compras &gt; ₡35.000 • Despacho asegurado con tracking directo
                            </p>
                        </div>

                        {/* Descripción */}
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {producto.descripcion}
                        </p>

                        {/* Specs 2x2 Grid (Imagen 1) */}
                        <div className="cf-specs-grid pt-2">
                            <div className="cf-spec-box">
                                <span className="cf-spec-label">SENSOR ÓPTICO</span>
                                <span className="cf-spec-val">16.000 – 26.000 DPI</span>
                            </div>
                            <div className="cf-spec-box">
                                <span className="cf-spec-label">TIEMPO DE RESPUESTA</span>
                                <span className="cf-spec-val">0.2 ms Instantáneo</span>
                            </div>
                            <div className="cf-spec-box">
                                <span className="cf-spec-label">CONEXIÓN</span>
                                <span className="cf-spec-val">USB-C Paracord Blindado</span>
                            </div>
                            <div className="cf-spec-box">
                                <span className="cf-spec-label">SWITCHES</span>
                                <span className="cf-spec-val">Ópticos Mecánicos Gen 2</span>
                            </div>
                        </div>

                        {/* Stock Status Bar */}
                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    <span>Disponibles {producto.stock} unidades para entrega inmediata</span>
                                </span>
                                <span className="text-amber-400 font-medium font-mono">
                                    3 vendidas históricamente
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" style={{ width: '78%' }}></div>
                            </div>
                        </div>

                        {/* Botonera de Compra & Contador (Imagen 1) */}
                        <div className="flex items-center gap-3 pt-3">
                            {/* Stepper */}
                            <div className="cf-stepper">
                                <button
                                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                    disabled={agotado || cantidad <= 1}
                                    className="cf-stepper-btn"
                                >
                                    −
                                </button>
                                <span className="cf-stepper-val">{cantidad}</span>
                                <button
                                    onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                                    disabled={agotado || cantidad >= producto.stock}
                                    className="cf-stepper-btn"
                                >
                                    +
                                </button>
                            </div>

                            {/* Botón Añadir al Carrito */}
                            <button
                                onClick={handleAddToCart}
                                disabled={agotado}
                                className="flex-1 py-3 px-5 rounded-xl cf-btn-secondary text-xs font-bold flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <span>Añadir al Carrito</span>
                            </button>

                            {/* Botón Comprar Ahora */}
                            <button
                                onClick={handleComprarAhora}
                                disabled={agotado}
                                className="flex-1 py-3 px-5 rounded-xl cf-btn-primary text-xs font-bold flex items-center justify-center gap-2"
                            >
                                <span>⚡</span>
                                <span>Comprar Ahora</span>
                            </button>
                        </div>

                        {agregadoMensaje && (
                            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
                                <span>✓ ¡{cantidad}x "{producto.nombre}" agregado al carrito!</span>
                                <Link to="/checkout" className="underline hover:text-white font-bold ml-2">
                                    Ir al Checkout →
                                </Link>
                            </div>
                        )}

                    </div>

                </div>

                {/* ============================================================== */}
                {/* COLUMNA DERECHA: Copiloto de IA CyberForge (Imagen 1)          */}
                {/* ============================================================== */}
                <div className="space-y-6">
                    <div className="cf-copilot-card">
                        
                        {/* Glow ambiental */}
                        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none"></div>

                        {/* Header Copiloto IA */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                                    <span className="text-white text-lg">🪄</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                        Copiloto de IA CyberForge
                                    </h3>
                                    <p className="text-[11px] text-slate-400">Análisis y Recomendaciones de Hardware</p>
                                </div>
                            </div>
                            {n8nStatus.status === 'active' ? (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/30" title="Workflow activo en n8n">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    n8n Online
                                </span>
                            ) : n8nStatus.status === 'testing' ? (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-500/30" title="n8n escuchando en modo test">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                    n8n Test
                                </span>
                            ) : n8nStatus.status === 'inactive' ? (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 px-2 py-0.5 rounded-full bg-amber-950/50 border border-amber-500/30" title="El servidor n8n está encendido en el puerto 5678, pero el workflow 'recomendador-ia' no está activo en el editor">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                    n8n Inactivo
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-300 px-2 py-0.5 rounded-full bg-rose-950/50 border border-rose-500/30" title="Servidor n8n no responde en localhost:5678">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                    n8n Offline
                                </span>
                            )}
                        </div>

                        {/* Asistencia Comercial y Técnica */}
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-xs font-bold text-slate-200">Asistencia Comercial y Técnica</h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Genera argumentos de venta persuasivos en tiempo real y descubre productos complementarios ideales para este dispositivo.
                                </p>
                            </div>

                            {/* Botón Generar Copy y Recomendaciones */}
                            <button
                                onClick={handleConsultarIA}
                                disabled={consultandoIA}
                                className="cf-copilot-btn-generate"
                            >
                                <span>🪄</span>
                                <span>{consultandoIA ? 'Generando Inferencia...' : 'Generar Copy y Recomendaciones con IA'}</span>
                            </button>

                            {/* Campo Interactivo para Responder Preguntas con n8n */}
                            <div className="pt-1">
                                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 focus-within:border-cyan-500/50 transition">
                                    <input
                                        type="text"
                                        value={inputPregunta}
                                        onChange={(e) => setInputPregunta(e.target.value)}
                                        placeholder={`Pregúntale a la IA sobre ${producto.nombre}...`}
                                        className="flex-1 bg-transparent px-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handlePreguntarDirecto();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handlePreguntarDirecto()}
                                        disabled={!inputPregunta.trim()}
                                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                                    >
                                        <span>Consultar</span>
                                        <span>↵</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Error si n8n no está activo */}
                        {errorIA && (
                            <div className="mt-5 p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2.5 animate-fadeIn">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                                    <span>⚠️</span>
                                    <span>n8n Inactivo • Se requiere activar el flujo</span>
                                </div>
                                <p className="text-xs text-amber-200/90 leading-relaxed">
                                    {errorIA}
                                </p>
                                <div className="pt-1">
                                    <a
                                        href="http://localhost:5678"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition"
                                    >
                                        <span>Abrir editor de n8n para activar el switch (Active) →</span>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Estado en espera antes de generar */}
                        {!pitchIA && !errorIA && (
                            <div className="mt-5 p-5 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
                                <div className="w-9 h-9 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 text-base">
                                    🪄
                                </div>
                                <p className="text-xs text-slate-300 font-semibold">
                                    Sin contenido generado aún
                                </p>
                                <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                                    Para recibir la respuesta genuina de la IA, activa tu workflow en n8n y presiona el botón <strong>"Generar Copy y Recomendaciones con IA"</strong>.
                                </p>
                            </div>
                        )}

                        {/* Tarjeta: Pitch Comercial Adaptado REAL de n8n */}
                        {pitchIA && (
                            <div className="mt-5 p-4 rounded-xl bg-slate-900/90 border border-indigo-500/40 space-y-3 shadow-lg shadow-indigo-950/40 animate-fadeIn">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                                        <span>🛡️</span>
                                        <span>Pitch Comercial Adaptado (IA n8n)</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        ⚡ n8n Live
                                    </span>
                                </div>
                                <p className="text-xs text-slate-200 italic leading-relaxed">
                                    "{pitchIA}"
                                </p>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleCopiarTexto(pitchIA)}
                                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition cursor-pointer"
                                    >
                                        <span>📋</span>
                                        <span>{copiado ? '¡Copiado!' : 'Copiar Argumento'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Complementos Sugeridos - Solo se muestran si la IA generó recomendaciones */}
                        {pitchIA && bundleRecomendados && bundleRecomendados.length > 0 && (
                            <div className="mt-5 space-y-3 animate-fadeIn">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                                        <span>⚡</span>
                                        <span>Complementos sugeridos por la IA</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                                        +12% ahorro bundle
                                    </span>
                                </div>

                                {/* Checkboxes de Bundles Dinámicos generados por n8n */}
                                <div className="space-y-2">
                                    {bundleRecomendados.slice(0, 2).map((rec, rIdx) => {
                                        const nombreItem = typeof rec === 'string' ? rec : (rec.nombre || 'Accesorio Compatible');
                                        const descItem = typeof rec === 'object' && rec.justificacion ? rec.justificacion : 'Complemento seleccionado por la IA para este producto';
                                        const precioItem = rIdx === 0 ? 12000 : 8500;
                                        const isChecked = rIdx === 0 ? bundle1Checked : bundle2Checked;
                                        const setChecked = rIdx === 0 ? setBundle1Checked : setBundle2Checked;

                                        return (
                                            <label key={rIdx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => setChecked(e.target.checked)}
                                                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 cursor-pointer"
                                                />
                                                <div className="flex-1 text-xs">
                                                    <div className="flex justify-between font-bold text-white">
                                                        <span>{nombreItem}</span>
                                                        <span className="text-cyan-400 font-mono">₡{precioItem.toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{descItem}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* Botón Aplicar Bundle */}
                                <button
                                    onClick={handleAplicarBundle}
                                    className="w-full py-2.5 px-4 rounded-xl cf-btn-secondary text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <span>+</span>
                                    <span>Aplicar Bundle Recomendado (+ {formatoMoneda((bundle1Checked ? 12000 : 0) + (bundle2Checked ? 8500 : 0))})</span>
                                </button>
                            </div>
                        )}

                        {/* Footer Copiloto */}
                        <div className="mt-5 pt-3 border-t border-slate-800/80 text-center">
                            <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                                <span className={n8nStatus.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}>⚡</span>
                                <span>
                                    {n8nStatus.status === 'active'
                                        ? 'Conectado a Flujo n8n en vivo (DeepSeek / OpenAI)'
                                        : n8nStatus.status === 'testing'
                                        ? 'Flujo n8n en Modo Test Activo'
                                        : 'Flujo n8n Inactivo en puerto 5678 (Sin respuesta de IA)'}
                                </span>
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
