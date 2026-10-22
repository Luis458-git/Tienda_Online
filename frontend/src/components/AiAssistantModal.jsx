import React, { useState } from 'react';

/**
 * Componente Modal Reusable del Copiloto de Inteligencia Artificial.
 * Admite tanto el modo de generación de descripciones técnicas como recomendaciones de carrito.
 * Diseñado con tipografía grande, ordenada, legible y estética oscura de alta gama.
 */
export default function AiAssistantModal({
    isOpen,
    onClose,
    title = 'Copiloto de Inteligencia Artificial',
    subtitle = 'Asistencia en tiempo real potenciada por agente inteligente',
    loading = false,
    error = null,
    data = null,
    tipo = 'descripcion', // 'descripcion' | 'carrito'
    onEjecutarConsulta
}) {
    const [copiado, setCopiado] = useState(false);

    if (!isOpen) return null;

    const handleCopiarTexto = (texto) => {
        navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-[#0f121a] border border-[#232a3d] rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Glow ambiental */}
                <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header del Modal */}
                <div className="flex items-start justify-between pb-5 border-b border-[#1f2638] shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                                COPILOTO IA TECHSTORE
                            </div>
                            <h3 className="text-xl font-extrabold text-white tracking-tight">{title}</h3>
                            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{subtitle}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 transition"
                        title="Cerrar modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Contenido Central con Scroll Interno Suave */}
                <div className="py-6 overflow-y-auto flex-1 space-y-5 pr-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="w-12 h-12 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                            <div>
                                <h4 className="text-base font-bold text-white">Generando Análisis de Inteligencia Artificial...</h4>
                                <p className="text-xs text-slate-400 mt-1">Estructurando copy comercial y recomendaciones optimizadas</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <div className="flex items-center gap-2 font-bold mb-1">
                                <span>⚠️ Error de Comunicación</span>
                            </div>
                            <p>{error}</p>
                            {onEjecutarConsulta && (
                                <button
                                    onClick={onEjecutarConsulta}
                                    className="mt-3 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-white font-semibold text-xs transition"
                                >
                                    Reintentar Consulta
                                </button>
                            )}
                        </div>
                    ) : data ? (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Caso A: Descripción Comercial de Producto */}
                            {tipo === 'descripcion' && (
                                <>
                                    {data.copy_comercial && (
                                        <div className="bg-[#090b10] border border-[#1f2638] rounded-2xl p-5 sm:p-6 shadow-inner relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span>✨</span> Copy Comercial Persuasivo
                                                </span>
                                                <button
                                                    onClick={() => handleCopiarTexto(data.copy_comercial)}
                                                    className="text-xs font-semibold text-slate-300 hover:text-white bg-[#141724] border border-[#232a3d] px-3 py-1 rounded-lg flex items-center gap-1.5 transition"
                                                >
                                                    {copiado ? '✓ Copiado' : '📋 Copiar'}
                                                </button>
                                            </div>

                                            {data.titular && (
                                                <h5 className="text-lg sm:text-xl font-extrabold text-white mb-2.5 tracking-tight">
                                                    {data.titular}
                                                </h5>
                                            )}

                                            <p className="text-base sm:text-lg text-slate-100 font-normal leading-relaxed">
                                                "{data.copy_comercial}"
                                            </p>
                                        </div>
                                    )}

                                    {data.puntos_clave && data.puntos_clave.length > 0 && (
                                        <div className="space-y-3">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                                <span>⚡</span> Puntos Fuertes Destacados:
                                            </span>
                                            <div className="space-y-2.5">
                                                {data.puntos_clave.map((punto, idx) => {
                                                    const titulo = typeof punto === 'object' ? punto.titulo : punto;
                                                    const desc = typeof punto === 'object' ? punto.descripcion : null;
                                                    return (
                                                        <div key={idx} className="flex items-start gap-3.5 bg-[#090b10] border border-[#1f2638] p-4 rounded-2xl">
                                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                                                                ✓
                                                            </div>
                                                            <div>
                                                                <h6 className="font-bold text-white text-sm sm:text-base leading-snug">{titulo}</h6>
                                                                {desc && (
                                                                    <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">{desc}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {data.recomendados && data.recomendados.length > 0 && (
                                        <div className="space-y-3 pt-2">
                                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                                                <span>🎯</span> Complementos Sugeridos:
                                            </span>
                                            <div className="space-y-2.5">
                                                {data.recomendados.map((rec, idx) => (
                                                    <div key={idx} className="p-4 rounded-2xl bg-[#090b10] border border-[#1f2638] flex items-start gap-3.5">
                                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                                                            #{idx + 1}
                                                        </div>
                                                        <div>
                                                            <h6 className="font-bold text-white text-sm sm:text-base">{typeof rec === 'string' ? rec : rec.nombre}</h6>
                                                            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                                                                {typeof rec === 'object' && rec.justificacion ? rec.justificacion : 'Complemento de alta afinidad para tu setup.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Caso B: Análisis y Recomendaciones de Carrito */}
                            {tipo === 'carrito' && (
                                <>
                                    {data.analisis_carrito && (
                                        <div className="bg-[#090b10] border border-[#1f2638] rounded-2xl p-5 sm:p-6 shadow-inner">
                                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                                                <span>🧠</span> Diagnóstico del Carrito:
                                            </span>
                                            <p className="text-base sm:text-lg text-slate-100 font-normal leading-relaxed">
                                                {data.analisis_carrito}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-3 pt-2">
                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                                            <span>🎯</span> Sugerencias de Adición para tu Pedido:
                                        </span>
                                        <div className="space-y-3">
                                            {(data.recomendados || []).map((rec, idx) => (
                                                <div key={idx} className="p-4 rounded-2xl bg-[#090b10] border border-[#1f2638] flex items-start gap-3.5">
                                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                                                        #{idx + 1}
                                                    </div>
                                                    <div>
                                                        <h6 className="font-bold text-white text-sm sm:text-base">{typeof rec === 'string' ? rec : rec.nombre}</h6>
                                                        <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                                                            {typeof rec === 'object' && rec.justificacion ? rec.justificacion : 'Complemento de alta afinidad para tu pedido.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Presiona el botón inferior para activar el copiloto de IA.
                        </div>
                    )}
                </div>

                {/* Footer del Modal */}
                <div className="flex items-center justify-between pt-4 border-t border-[#1f2638] text-xs shrink-0">
                    <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Respuesta estructurada y validada
                    </span>
                    <div className="flex gap-2.5">
                        {onEjecutarConsulta && (
                            <button
                                type="button"
                                onClick={onEjecutarConsulta}
                                disabled={loading}
                                className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 transition disabled:opacity-40"
                            >
                                {loading ? 'Procesando...' : 'Reejecutar Consulta'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-slate-300 bg-[#141724] hover:bg-[#1c2133] border border-[#232a3d] hover:text-white transition font-semibold text-xs sm:text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
