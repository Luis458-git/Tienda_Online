import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ producto }) {
    const { addToCart } = useCart();
    const precioNumerico = parseFloat(producto.precio);
    const agotado = producto.stock <= 0;

    const formatoMoneda = (monto) => {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            maximumFractionDigits: 0
        }).format(monto);
    };

    return (
        <div className="product-card">
            <div className="product-card-top">
                <span className="product-category">{producto.categoria}</span>
                <span className={`stock-badge ${agotado ? 'stock-agotado' : producto.stock <= 5 ? 'stock-bajo' : 'stock-disponible'}`}>
                    {agotado ? 'Agotado' : `${producto.stock} en stock`}
                </span>
            </div>

            <h3 className="product-title">{producto.nombre}</h3>
            <p className="product-description">{producto.descripcion}</p>

            <div className="product-footer">
                <div className="product-price">{formatoMoneda(precioNumerico)}</div>
                <div className="product-actions">
                    <Link to={`/producto/${producto.id}`} className="btn-secondary btn-sm">
                        Ver Detalle
                    </Link>
                    <button
                        onClick={() => addToCart(producto, 1)}
                        disabled={agotado}
                        className="btn-primary btn-sm"
                        title={agotado ? 'Sin stock disponible' : 'Añadir al carrito'}
                    >
                        {agotado ? 'Sin Stock' : '+ Carrito'}
                    </button>
                </div>
            </div>
        </div>
    );
}
