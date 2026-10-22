import React, { useState } from 'react';

/**
 * Componente Modal Reusable del Copiloto de Inteligencia Artificial (n8n Agent).
 * Admite tanto el modo de generación de descripciones técnicas como recomendaciones de carrito.
 */
export default function AiAssistantModal({
    isOpen,
    onClose,
    title = 'Copiloto de Inteligencia Artificial',
    subtitle = 'Asistencia en tiempo real potenciada por agente n8n',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
                {/* Glow ambiental */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header del Modal */}
                <div className="flex items-start justify-between pb-5 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider mb-0.5">
                                <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></span>
                                Agente n8n · LangChain
                            </div>
                            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                            <p className="text-xs text-slate-400">{subtitle}</p>
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

                {/* Contenido Central */}
                <div className="py-6 min-h-[220px] flex flex-col justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="w-12 h-12 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Consultando Agente de IA en n8n...</h4>
                                <p className="text-xs text-slate-400 mt-1">Generando análisis y estructurando respuesta JSON</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm">
                            <div className="flex items-center gap-2 font-bold mb-1">
                                <span>⚠️ Error de Comunicación</span>
                            </div>
                            <p>{error}</p>
                            {onEjecutarConsulta && (
                                <button
                                    onClick={onEjecutarConsulta}
                                    className="mt-3 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-semibold text-xs transition"
                                >
                                    Reintentar Consulta
                                </button>
                            )}
                        </div>
                    ) : data ? (
                        <div className="space-y-4 animate-fadeIn">
                            {/* Caso A: Descripción Comercial de Producto */}
                            {tipo === 'descripcion' && (
                                <>
                                    {data.copy_comercial && (
                                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4.5 shadow-inner">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                                    ✨ Copy Comercial Persuasivo:
                                                </span>
                                                <button
                                                    onClick={() => handleCopiarTexto(data.copy_comercial)}
                                                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                                                >
                                                    {copiado ? '✓ Copiado' : '📋 Copiar'}
                                                </button>
                                            </div>
                                            <p className="text-sm text-slate-200 leading-relaxed">
                                                {data.copy_comercial}
                                            </p>
                                        </div>
                                    )}

                                    {data.puntos_clave && data.puntos_clave.length > 0 && (
                                        <div className="space-y-1.5">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                                Características Destacadas:
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {data.puntos_clave.map((punto, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl">
                                                        <span className="text-emerald-400 font-bold">✓</span>
                                                        <span>{punto}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {data.recomendados && data.recomendados.length > 0 && (
                                        <div className="space-y-1.5 pt-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                                Complementos Sugeridos:
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {data.recomendados.map((rec, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                                                        <span>+</span> {typeof rec === 'string' ? rec : rec.nombre}
                                                    </span>
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
                                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4.5 shadow-inner">
                                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1.5">
                                                🧠 Diagnóstico del Carrito:
                                            </span>
                                            <p className="text-sm text-slate-200 leading-relaxed">
                                                {data.analisis_carrito}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                            Sugerencias de Adición:
                                        </span>
                                        <div className="space-y-2.5">
                                            {(data.recomendados || []).map((rec, idx) => (
                                                <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                                                        #{idx + 1}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-100 text-sm">{typeof rec === 'string' ? rec : rec.nombre}</h5>
                                                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
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
                        <div className="text-center py-6 text-slate-400 text-xs">
                            Presiona el botón inferior para activar el flujo del agente de IA en n8n.
                        </div>
                    )}
                </div>

                {/* Footer del Modal */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">
                        Contrato: &#123; ok: true, data: &#123;...&#125;, error: null &#125;
                    </span>
                    <div className="flex gap-2">
                        {onEjecutarConsulta && (
                            <button
                                type="button"
                                onClick={onEjecutarConsulta}
                                disabled={loading}
                                className="px-4 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-indigo-500/20 transition disabled:opacity-40"
                            >
                                {loading ? 'Procesando...' : 'Reejecutar Consulta'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition font-semibold"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
