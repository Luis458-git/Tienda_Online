import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { responderPreguntaIA, consultarEstadoN8N } from '../services/aiService';
import { useCart } from '../context/CartContext';

export default function AiChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [n8nStatus, setN8nStatus] = useState({
        status: 'checking',
        serverOnline: false,
        webhookActive: false,
        badge: {
            texto: 'Comprobando...',
            color: 'slate',
            descripcion: 'Verificando enlace con n8n...'
        }
    });

    const [mensajes, setMensajes] = useState([
        {
            remitente: 'ia',
            texto: '¡Hola! Soy el Copiloto de IA de CyberForge Hardware conectado a n8n. Para recibir respuestas en vivo de la IA (DeepSeek / OpenAI), asegúrate de tener el workflow activo en http://localhost:5678.',
            sugerencias: [
                '🎮 ¿Qué mouse recomiendan para eSports?',
                '🏷️ ¿Qué cupones hay activos?',
                '🚚 ¿Cómo funciona el envío gratis?',
                '🖥️ ¿Tienen monitores de 144Hz?'
            ],
            origen: 'n8n',
            hora: 'Ahora'
        }
    ]);
    const [inputTexto, setInputTexto] = useState('');
    const [cargando, setCargando] = useState(false);
    const { cart } = useCart();
    const chatEndRef = useRef(null);

    // Monitoreo en tiempo real del estado de n8n cada 6 segundos
    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            const data = await consultarEstadoN8N();
            if (isMounted && data) {
                setN8nStatus(data);
            }
        };

        checkStatus();
        const timer = setInterval(checkStatus, 6000);
        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, []);

    // Auto-scroll al final del chat al recibir mensajes
    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [mensajes, isOpen]);

    // Escuchar evento global para abrir el chat desde el Navbar o la ficha de producto
    useEffect(() => {
        const handleAbrirChat = (e) => {
            setIsOpen(true);
            if (e.detail?.pregunta) {
                setTimeout(() => {
                    enviarMensaje(e.detail.pregunta);
                }, 100);
            }
        };
        window.addEventListener('abrir-chat-ia', handleAbrirChat);
        return () => window.removeEventListener('abrir-chat-ia', handleAbrirChat);
    }, []);

    const enviarMensaje = async (textoAEnviar) => {
        const texto = (textoAEnviar || inputTexto).trim();
        if (!texto || cargando) return;

        const nuevoMensajeUsuario = {
            remitente: 'usuario',
            texto: texto,
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
        setInputTexto('');
        setCargando(true);

        try {
            // Contexto del usuario: artículos en carrito
            const contexto = {
                items: cart,
                timestamp: new Date().toISOString()
            };

            const respuesta = await responderPreguntaIA(texto, contexto);

            if (respuesta && respuesta.ok && respuesta.data) {
                const nuevoMensajeIA = {
                    remitente: 'ia',
                    texto: respuesta.data.respuesta || respuesta.data.resultado_texto || 'Respuesta generada por la IA.',
                    sugerencias: respuesta.data.sugerencias || [],
                    producto_recomendado: respuesta.data.producto_recomendado || null,
                    origen: 'n8n',
                    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMensajes((prev) => [...prev, nuevoMensajeIA]);
            } else {
                const nuevoMensajeError = {
                    remitente: 'ia',
                    texto: respuesta?.error || '⚠️ El workflow de n8n no está activo en http://localhost:5678. Activa el interruptor "Active" en n8n para que la IA responda.',
                    origen: 'inactivo',
                    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMensajes((prev) => [...prev, nuevoMensajeError]);
            }
        } catch {
            setMensajes((prev) => [
                ...prev,
                {
                    remitente: 'ia',
                    texto: '⚠️ No se pudo comunicar con n8n en http://localhost:5678. Verifica que el servidor esté activo y el workflow encendido.',
                    origen: 'inactivo',
                    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setCargando(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    };

    return (
        <aside aria-label="Copiloto de IA" className="fixed bottom-6 right-6 z-50">
            {/* Botón Flotante Neón de Lanzamiento */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white font-bold text-xs shadow-2xl shadow-indigo-600/50 hover:shadow-indigo-500/80 hover:scale-105 transition-all duration-300 border border-indigo-400/50 cursor-pointer group"
                    title={`Abrir Copiloto de IA - Estado: ${n8nStatus.badge?.texto || 'Verificando'}`}
                >
                    <div className="relative w-6 h-6 flex items-center justify-center">
                        <span className="text-base group-hover:rotate-12 transition-transform">🪄</span>
                        <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                            n8nStatus.status === 'active' ? 'bg-emerald-400 animate-ping' :
                            n8nStatus.status === 'testing' ? 'bg-cyan-400 animate-ping' :
                            n8nStatus.status === 'inactive' ? 'bg-amber-400' : 'bg-rose-500'
                        }`}></span>
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="tracking-wider">Copiloto IA</span>
                        <span className={`text-[10px] font-mono font-bold -mt-0.5 ${
                            n8nStatus.status === 'active' ? 'text-emerald-300' :
                            n8nStatus.status === 'testing' ? 'text-cyan-300' :
                            n8nStatus.status === 'inactive' ? 'text-amber-300' : 'text-rose-400'
                        }`}>
                            {n8nStatus.badge?.texto || 'n8n Status'}
                        </span>
                    </div>
                </button>
            )}

            {/* Ventana de Chat Flotante Expandida */}
            {isOpen && (
                <div className="w-[92vw] sm:w-[430px] h-[600px] max-h-[85vh] bg-[#070b14]/95 border border-indigo-500/40 rounded-3xl shadow-2xl shadow-black/80 backdrop-blur-xl flex flex-col overflow-hidden animate-fadeIn">
                    
                    {/* Header del Chat */}
                    <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                                <span className="text-lg">🪄</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-extrabold text-white">Copiloto IA CyberForge</h4>
                                    
                                    {/* Badge con detección REAL de estado de n8n */}
                                    {n8nStatus.status === 'active' ? (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-sm shadow-emerald-500/20" title="Workflow activo en n8n respondiendo con OpenAI">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            n8n Online
                                        </span>
                                    ) : n8nStatus.status === 'testing' ? (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1" title="Escuchando en modo test (/webhook-test)">
                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                            n8n Test
                                        </span>
                                    ) : n8nStatus.status === 'inactive' ? (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1" title="El servidor n8n está encendido en puerto 5678, pero el workflow 'recomendador-ia' no está activo en el editor">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                            n8n Inactivo
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1" title="Servidor n8n no responde en localhost:5678">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                            n8n Offline
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400">Asesor de hardware y ventas en tiempo real</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer font-bold"
                            title="Cerrar chat"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Banner Informativo Dinámico del Estado Real de n8n */}
                    {n8nStatus.status === 'inactive' && (
                        <div className="bg-amber-950/40 border-b border-amber-500/30 px-3.5 py-2 flex items-start gap-2 text-[11px] text-amber-200">
                            <span className="text-amber-400 text-xs">⚠️</span>
                            <div className="flex-1 leading-snug">
                                <span className="font-bold text-amber-300">n8n está Inactivo:</span> El workflow no está activado en <a href="http://localhost:5678" target="_blank" rel="noreferrer" className="underline font-bold text-amber-200 hover:text-white">localhost:5678</a>. Mientras no lo actives con el interruptor en n8n, el copiloto responderá usando el <span className="text-white font-bold">Motor Local CyberForge AI</span>.
                            </div>
                        </div>
                    )}
                    {n8nStatus.status === 'offline' && (
                        <div className="bg-rose-950/40 border-b border-rose-500/30 px-3.5 py-2 flex items-start gap-2 text-[11px] text-rose-200">
                            <span className="text-rose-400 text-xs">🔴</span>
                            <div className="flex-1 leading-snug">
                                <span className="font-bold text-rose-300">n8n Desconectado:</span> Servidor en puerto 5678 inaccesible. Respondiendo mediante el <span className="text-white font-bold">Motor Local CyberForge AI</span>.
                            </div>
                        </div>
                    )}
                    {n8nStatus.status === 'active' && (
                        <div className="bg-emerald-950/30 border-b border-emerald-500/30 px-3.5 py-1.5 flex items-center gap-2 text-[11px] text-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="leading-snug"><strong>Conexión Activa:</strong> Enlazado en vivo al Webhook de n8n con OpenAI gpt-4o-mini.</span>
                        </div>
                    )}

                    {/* Área de Mensajes */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
                        {mensajes.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col ${msg.remitente === 'usuario' ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-lg ${
                                        msg.remitente === 'usuario'
                                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none border border-indigo-500/30 font-medium'
                                            : 'bg-slate-900/90 text-slate-200 rounded-bl-none border border-slate-800'
                                    }`}
                                >
                                    <p className="whitespace-pre-line">{msg.texto}</p>

                                    {/* Chip de sugerencia de producto */}
                                    {msg.producto_recomendado && (
                                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                                                <span>⚡</span> {msg.producto_recomendado}
                                            </span>
                                            <Link
                                                to="/catalogo"
                                                onClick={() => setIsOpen(false)}
                                                className="text-[10px] font-bold text-indigo-400 hover:underline"
                                            >
                                                Ver en Catálogo →
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-1 px-1">
                                    <span className="text-[9px] text-slate-500 font-mono">
                                        {msg.hora}
                                    </span>
                                    {msg.remitente === 'ia' && (
                                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                            msg.origen === 'n8n'
                                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                                                : 'bg-amber-950/50 text-amber-300 border-amber-500/40'
                                        }`}>
                                            {msg.origen === 'n8n' ? '⚡ n8n Live' : '⚠️ n8n Inactivo'}
                                        </span>
                                    )}
                                </div>

                                {/* Píldoras de sugerencias rápidas debajo de respuestas del bot */}
                                {msg.sugerencias && msg.sugerencias.length > 0 && idx === mensajes.length - 1 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                                        {msg.sugerencias.map((sug, sIdx) => (
                                            <button
                                                key={sIdx}
                                                onClick={() => enviarMensaje(sug)}
                                                className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 text-[10px] font-medium transition cursor-pointer text-left"
                                            >
                                                {sug}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Indicador de pensamiento */}
                        {cargando && (
                            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 w-fit">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                                <span className="text-[11px] font-mono">Consultando agente n8n...</span>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Input y Botón de Envío */}
                    <div className="p-3 bg-slate-950 border-t border-slate-800/80">
                        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-1.5 focus-within:border-cyan-500/60 transition">
                            <input
                                type="text"
                                value={inputTexto}
                                onChange={(e) => setInputTexto(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe tu consulta sobre hardware o n8n..."
                                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none py-1.5"
                                disabled={cargando}
                            />
                            <button
                                onClick={() => enviarMensaje()}
                                disabled={!inputTexto.trim() || cargando}
                                className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 cursor-pointer shadow-md shadow-indigo-600/30"
                                title="Enviar mensaje"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center justify-between px-1 pt-2 text-[10px] text-slate-500 font-mono">
                            <span>n8n Webhook: /webhook/recomendador-ia</span>
                            <span>Presiona Enter ↵</span>
                        </div>
                    </div>

                </div>
            )}
        </aside>
    );
}
