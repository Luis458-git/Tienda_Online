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
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            maximumFractionDigits: 0
        }).format(monto || 0);
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
        <div className="page-container dashboard-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Panel de Control & Métricas</h1>
                    <p className="page-subtitle">Indicadores calculados en tiempo real mediante SQL (SUM, COUNT, AVG, GROUP BY)</p>
                </div>
                <button onClick={() => refetch()} className="btn-secondary btn-sm" title="Refrescar métricas">
                    🔄 Actualizar
                </button>
            </header>

            {/* Fila de Tarjetas de Indicadores Clave (KPIs) */}
            <section className="metrics-grid">
                <MetricCard
                    title="Ingreso Total"
                    value={formatoMoneda(kpis.ingreso_total)}
                    icon="💰"
                    subtitle="Ventas acumuladas efectivas"
                    color="emerald"
                />
                <MetricCard
                    title="Ticket Promedio"
                    value={formatoMoneda(kpis.ticket_promedio)}
                    icon="🏷️"
                    subtitle="Promedio monetario por orden"
                    color="blue"
                />
                <MetricCard
                    title="Total de Órdenes"
                    value={kpis.total_ordenes}
                    icon="📦"
                    subtitle={`${kpis.ordenes_activas} activas · ${kpis.ordenes_entregadas} entregadas`}
                    color="purple"
                />
                <MetricCard
                    title="Órdenes Canceladas"
                    value={kpis.ordenes_canceladas}
                    icon="↩️"
                    subtitle="Con reposición de inventario"
                    color="amber"
                />
            </section>

            {/* Sección de Tablas y Rankings */}
            <div className="dashboard-columns">
                {/* Ventas Agrupadas por Categoría */}
                <section className="card-panel">
                    <div className="card-panel-header">
                        <h2>📊 Ventas por Categoría</h2>
                        <span className="badge-tag">GROUP BY categoria</span>
                    </div>

                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Categoría</th>
                                    <th>Órdenes</th>
                                    <th>Unidades</th>
                                    <th>Total Ventas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventas_por_categoria.map((cat) => (
                                    <tr key={cat.categoria}>
                                        <td className="font-semibold">{cat.categoria}</td>
                                        <td>{cat.ordenes_asociadas}</td>
                                        <td>{cat.unidades_vendidas}</td>
                                        <td className="font-mono">{formatoMoneda(cat.total_ventas)}</td>
                                    </tr>
                                ))}
                                {ventas_por_categoria.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4">No hay ventas registradas aún</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Top 3 Productos Más Vendidos */}
                <section className="card-panel">
                    <div className="card-panel-header">
                        <h2>🏆 Top 3 Más Vendidos</h2>
                        <span className="badge-tag">LIMIT 3</span>
                    </div>

                    <div className="top-products-list">
                        {top_productos.map((prod, index) => (
                            <div key={prod.id} className="top-product-item">
                                <div className={`rank-badge rank-${index + 1}`}>
                                    #{index + 1}
                                </div>
                                <div className="top-product-info">
                                    <h4>{prod.nombre}</h4>
                                    <p className="text-muted">{prod.categoria} · {formatoMoneda(prod.precio)}</p>
                                </div>
                                <div className="top-product-stats">
                                    <span className="units-sold">{prod.unidades_vendidas} unidades</span>
                                    <span className="revenue-generated">{formatoMoneda(prod.ingresos_generados)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Sección Interactiva: Demostración de Cancelación y Regla HTTP 409 Server-Side */}
            <section className="card-panel mt-6">
                <div className="card-panel-header">
                    <h2>🛡️ Demostración de Regla Transaccional: Cancelación y Reposición</h2>
                    <span className="badge-conflict">HTTP 200 vs 409</span>
                </div>
                <p className="text-muted mb-4">
                    Prueba cancelar una orden: si está en <strong>'nueva'</strong> o <strong>'pagada'</strong> (ej. Orden #4), se cancela y repone el stock (HTTP 200). Si ya fue <strong>'enviada'</strong> o <strong>'entregada'</strong> (ej. Orden #1 o #3), el servidor aborta la transacción con <strong>HTTP 409 Conflict</strong>.
                </p>

                <form onSubmit={handleCancelarOrden} className="cancel-form">
                    <input
                        type="number"
                        placeholder="Ingresa el ID de la orden (ej: 1, 3, 4)"
                        value={ordenIdACancelar}
                        onChange={(e) => setOrdenIdACancelar(e.target.value)}
                        className="filter-input"
                        required
                        min="1"
                    />
                    <button
                        type="submit"
                        disabled={cancelando}
                        className="btn-danger"
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
                    <div className="alert-success mt-4">
                        <span className="alert-icon">✅</span>
                        <div>
                            <strong>Cancelación exitosa (HTTP 200):</strong> {cancelacionRespuesta.mensaje}.
                            <div className="text-sm mt-1">
                                Orden #{cancelacionRespuesta.orden.id} pasó a estado <code>{cancelacionRespuesta.orden.estado}</code> y se devolvieron las unidades exactas a la tabla <code>productos</code>.
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
