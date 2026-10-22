import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getResumen, cancelarOrden } from '../services/api';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Dashboard() {
    const { data: resumen, loading, error, refetch } = useFetch(getResumen, []);
    const [ordenIdACancelar, setOrdenIdACancelar] = useState('');
    const [cancelando, setCancelando] = useState(false);
    const [cancelacionRespuesta, setCancelacionRespuesta] = useState(null);
    const [cancelacionError, setCancelacionError] = useState(null);

    const formatoMoneda = (monto) => {
        const num = Math.round(Number(monto) || 0);
        return `₡${num.toLocaleString('es-CR')}`;
    };

    const handleCancelarOrden = async (e) => {
        e.preventDefault();
        if (!ordenIdACancelar || isNaN(ordenIdACancelar)) return;

        setCancelando(true);
        setCancelacionRespuesta(null);
        setCancelacionError(null);

        try {
            const res = await cancelarOrden(ordenIdACancelar);
            setCancelacionRespuesta(res);
            refetch(); // Refrescar métricas tras la cancelación
        } catch (err) {
            setCancelacionError(err);
        } finally {
            setCancelando(false);
        }
    };

    if (loading) return <LoadingSpinner mensaje="Cargando métricas y análisis de ventas..." />;
    if (error) return <ErrorMessage error={error} onClose={() => refetch()} />;
    if (!resumen) return null;

    const { kpis, ventas_por_categoria, top_productos } = resumen;

    return (
        <div className="pb-12 animate-fadeIn space-y-7">
            {/* Header de Página con Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-1.5 bg-[#181a2e] text-[#818cf8] border border-[#292e4c] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider mb-2 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8]"></span>
                        ANALYTICS & MONITORING · EN TIEMPO REAL
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Panel de Control & Métricas
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                        Indicadores calculados en tiempo real mediante SQL (SUM, COUNT, AVG, GROUP BY).
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-1.5 bg-[#141724] hover:bg-[#1b2031] border border-[#22283a] text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition self-start sm:self-auto"
                >
                    <span>🔄</span>
                    <span>Actualizar</span>
                </button>
            </div>

            {/* Fila de Tarjetas de Indicadores Clave (KPIs) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <MetricCard
                    title="Ingreso Total"
                    value={formatoMoneda(kpis.ingreso_total)}
                    icon="💰"
                    subtitle="Ventas acumuladas efectivas"
                />
                <MetricCard
                    title="Ticket Promedio"
                    value={formatoMoneda(kpis.ticket_promedio)}
                    icon="🏷️"
                    subtitle="Promedio monetario por orden"
                />
                <MetricCard
                    title="Total de Órdenes"
                    value={kpis.total_ordenes}
                    icon="📦"
                    subtitle={`${kpis.ordenes_activas} activas · ${kpis.ordenes_entregadas} entregadas`}
                />
                <MetricCard
                    title="Órdenes Canceladas"
                    value={kpis.ordenes_canceladas}
                    icon="↩️"
                    subtitle="Con reposición de inventario"
                />
            </section>

            {/* Sección de Tablas y Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Ventas Agrupadas por Categoría (7 cols) */}
                <section className="lg:col-span-7 bg-[#10131c] border border-[#1e2333] rounded-2xl p-5 sm:p-6 shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-[#1b2030] mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-base">📊</span>
                            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                                Ventas por Categoría
                            </h2>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#181a28] text-indigo-300 border border-[#2b3148]">
                            GROUP BY categoria
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-[#1b2030] text-slate-400 uppercase tracking-wider text-[11px]">
                                    <th className="pb-3 font-semibold">Categoría</th>
                                    <th className="pb-3 font-semibold text-center">Órdenes</th>
                                    <th className="pb-3 font-semibold text-center">Unidades</th>
                                    <th className="pb-3 font-semibold text-right">Total Ventas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#181d2a]">
                                {ventas_por_categoria.map((cat) => (
                                    <tr key={cat.categoria} className="hover:bg-[#141724]/50 transition-colors">
                                        <td className="py-3 font-semibold text-white flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                            {cat.categoria}
                                        </td>
                                        <td className="py-3 text-center text-slate-300 font-mono">{cat.ordenes_asociadas}</td>
                                        <td className="py-3 text-center text-slate-300 font-mono">{cat.unidades_vendidas}</td>
                                        <td className="py-3 text-right font-mono font-bold text-white">
                                            {formatoMoneda(cat.total_ventas)}
                                        </td>
                                    </tr>
                                ))}
                                {ventas_por_categoria.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-6 text-slate-500">
                                            No hay ventas registradas aún
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Top 3 Productos Más Vendidos (5 cols) */}
                <section className="lg:col-span-5 bg-[#10131c] border border-[#1e2333] rounded-2xl p-5 sm:p-6 shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-[#1b2030] mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-base">🏆</span>
                            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                                Top 3 Más Vendidos
                            </h2>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#181a28] text-indigo-300 border border-[#2b3148]">
                            LIMIT 3
                        </span>
                    </div>

                    <div className="space-y-3">
                        {top_productos.map((prod, index) => (
                            <div
                                key={prod.id}
                                className="bg-[#0c0e15] border border-[#1a1f2d] rounded-xl p-3.5 flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-[#141724] border border-[#22283a] text-indigo-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                        #{index + 1}
                                    </div>
                                    <div className="truncate">
                                        <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                                            {prod.nombre}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {prod.categoria} · {formatoMoneda(prod.precio)}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <span className="text-xs font-bold text-emerald-400 font-mono block">
                                        {prod.unidades_vendidas} unds
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-400">
                                        {formatoMoneda(prod.ingresos_generados)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>

            {/* Sección Interactiva: Demostración de Cancelación Transaccional */}
            <section className="bg-[#10131c] border border-[#1e2333] rounded-2xl p-5 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-[#1b2030] mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-base">🛡️</span>
                        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                            Regla Transaccional: Cancelación y Reposición
                        </h2>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#251717] text-red-300 border border-[#442323]">
                        HTTP 200 vs 409
                    </span>
                </div>
                <p className="text-xs text-slate-400 mb-4 max-w-2xl leading-relaxed">
                    Prueba cancelar una orden: si está en estado <strong>'nueva'</strong> o <strong>'pagada'</strong> (ej. Orden #4), se cancela y repone el stock atómicamente (HTTP 200). Si ya fue <strong>'enviada'</strong> o <strong>'entregada'</strong> (ej. Orden #1 o #3), el servidor aborta la transacción con <strong>HTTP 409 Conflict</strong>.
                </p>

                <form onSubmit={handleCancelarOrden} className="flex flex-col sm:flex-row gap-3 max-w-lg">
                    <input
                        type="number"
                        placeholder="Ingresa el ID de la orden (ej: 1, 3, 4)"
                        value={ordenIdACancelar}
                        onChange={(e) => setOrdenIdACancelar(e.target.value)}
                        className="flex-1 bg-[#0b0d14] border border-[#1e2332] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6366f1] transition"
                        required
                        min="1"
                    />
                    <button
                        type="submit"
                        disabled={cancelando}
                        className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition disabled:opacity-40"
                    >
                        {cancelando ? 'Verificando con servidor...' : 'Intentar Cancelar Orden'}
                    </button>
                </form>

                {cancelacionError && (
                    <div className="mt-4">
                        <ErrorMessage
                            error={cancelacionError}
                            onClose={() => setCancelacionError(null)}
                        />
                    </div>
                )}

                {cancelacionRespuesta && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
                        <span className="text-base">✅</span>
                        <div>
                            <strong>Cancelación exitosa (HTTP 200):</strong> {cancelacionRespuesta.mensaje}.
                            <div className="text-xs text-slate-300 mt-1">
                                Orden #{cancelacionRespuesta.orden.id} pasó a estado <code className="bg-[#141724] px-1 py-0.5 rounded text-emerald-300">{cancelacionRespuesta.orden.estado}</code> y se devolvieron las unidades exactas a la tabla <code>productos</code>.
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
