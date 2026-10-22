import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { getProductoById } from '../services/api';
import { consultarAgenteIA } from '../services/aiService';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function ProductDetail() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [cantidad, setCantidad] = useState(1);
    const [agregadoMensaje, setAgregadoMensaje] = useState(false);

    // Estado del Agente de IA
    const [consultandoIA, setConsultandoIA] = useState(false);
    const [respuestaIA, setRespuestaIA] = useState(null);
    const [errorIA, setErrorIA] = useState(null);

    const {
        data: producto,
        loading,
        error
    } = useFetch(() => getProductoById(id), [id]);

    const formatoMoneda = (monto) => {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            maximumFractionDigits: 0
        }).format(monto || 0);
    };

    const handleAddToCart = () => {
        if (!producto || producto.stock <= 0) return;
        addToCart(producto, cantidad);
        setAgregadoMensaje(true);
        setTimeout(() => setAgregadoMensaje(false), 2500);
    };

    const handleConsultarIA = async () => {
        if (!producto) return;
        setConsultandoIA(true);
        setErrorIA(null);
        try {
            const respuesta = await consultarAgenteIA(producto);
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

    if (loading) return <LoadingSpinner mensaje="Cargando ficha técnica del producto..." />;
    if (error) {
        return (
            <div className="page-container">
                <ErrorMessage error={error} />
                <div className="mt-4">
                    <Link to="/catalogo" className="btn-secondary">
                        ← Volver al catálogo
                    </Link>
                </div>
            </div>
        );
    }
    if (!producto) return null;

    const agotado = producto.stock <= 0;
    const precioNumerico = parseFloat(producto.precio);

    return (
        <div className="page-container product-detail-page">
            <div className="mb-4">
                <Link to="/catalogo" className="breadcrumb-link">
                    ← Volver al catálogo de productos
                </Link>
            </div>

            <div className="detail-layout">
                {/* Columna Izquierda: Ficha Técnica */}
                <div className="detail-main-card">
                    <div className="detail-header">
                        <span className="product-category">{producto.categoria}</span>
                        <span className={`stock-badge ${agotado ? 'stock-agotado' : producto.stock <= 5 ? 'stock-bajo' : 'stock-disponible'}`}>
                            {agotado ? 'Agotado' : `${producto.stock} unidades en stock`}
                        </span>
                    </div>

                    <h1 className="detail-title">{producto.nombre}</h1>
                    <div className="detail-price">{formatoMoneda(precioNumerico)}</div>

                    <div className="detail-section">
                        <h3>Descripción del Producto</h3>
                        <p className="detail-description">{producto.descripcion}</p>
                    </div>

                    <div className="detail-section">
                        <h3>Disponibilidad en Tiempo Real</h3>
                        <div className="stock-info-box">
                            <div className="stock-indicator">
                                <span className="indicator-dot" style={{ backgroundColor: agotado ? '#ef4444' : '#10b981' }}></span>
                                <span>{agotado ? 'Inventario agotado para este artículo' : `Disponibles ${producto.stock} artículos para entrega inmediata`}</span>
                            </div>
                            {producto.unidades_vendidas > 0 && (
                                <p className="text-muted text-sm mt-1">
                                    🔥 {producto.unidades_vendidas} unidades vendidas históricamente
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Acciones de Compra */}
                    <div className="purchase-panel">
                        <div className="quantity-control">
                            <label htmlFor="qty">Cantidad:</label>
                            <input
                                id="qty"
                                type="number"
                                min="1"
                                max={producto.stock || 1}
                                value={cantidad}
                                onChange={(e) => setCantidad(Math.max(1, Math.min(parseInt(e.target.value, 10) || 1, producto.stock)))}
                                disabled={agotado}
                                className="qty-input"
                            />
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={agotado}
                            className="btn-primary btn-lg"
                        >
                            {agotado ? 'Producto Agotado' : '🛒 Añadir al Carrito'}
                        </button>
                    </div>

                    {agregadoMensaje && (
                        <div className="alert-success mt-4">
                            ✅ ¡{cantidad} unidad(es) de "{producto.nombre}" agregada(s) al carrito!
                        </div>
                    )}
                </div>

                {/* Columna Derecha: Integración con Agente de IA en n8n */}
                <div className="detail-ai-card">
                    <div className="ai-card-header">
                        <div className="ai-badge">
                            <span className="ai-sparkle">✨</span>
                            <span>Agente de IA (n8n Webhook)</span>
                        </div>
                        <h2>Copywriter & Recomendador</h2>
                        <p className="text-muted text-sm">
                            Genera una descripción comercial persuasiva y productos complementarios en función de este artículo.
                        </p>
                    </div>

                    <button
                        onClick={handleConsultarIA}
                        disabled={consultandoIA}
                        className="btn-ai-generate w-full"
                    >
                        {consultandoIA ? 'Consultando al Agente de IA...' : '⚡ Generar Copy y Recomendaciones con IA'}
                    </button>

                    {errorIA && (
                        <div className="mt-4">
                            <ErrorMessage error={errorIA} onClose={() => setErrorIA(null)} />
                        </div>
                    )}

                    {respuestaIA && (
                        <div className="ai-response-box mt-4">
                            <div className="ai-response-item">
                                <span className="ai-label">📝 Copy Comercial Persuasivo:</span>
                                <p className="ai-text">{respuestaIA.copy_comercial}</p>
                            </div>

                            {respuestaIA.recomendados && respuestaIA.recomendados.length > 0 && (
                                <div className="ai-response-item mt-4">
                                    <span className="ai-label">🎯 Productos Complementarios Sugeridos:</span>
                                    <ul className="ai-recommendations-list">
                                        {respuestaIA.recomendados.map((item, idx) => (
                                            <li key={idx} className="ai-recommendation-item">
                                                <span>✓ {item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="ai-contract-badge">
                                Contrato cumplido: <code>&#123; ok: true, data: &#123; copy_comercial, recomendados &#125; &#125;</code>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
