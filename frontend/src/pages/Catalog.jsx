import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getProductos, getProductosCategorias } from '../services/api';
import ProductCard from '../components/ProductCard';
import FilterBar from '../components/FilterBar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Catalog() {
    const [busqueda, setBusqueda] = useState('');
    const [categoria, setCategoria] = useState('');
    const [orden, setOrden] = useState('');

    // Consulta de categorías para el dropdown
    const { data: categoriasData } = useFetch(getProductosCategorias, []);
    const categorias = Array.isArray(categoriasData) ? categoriasData : [];

    // Consulta reactiva de productos vinculada a los filtros
    const {
        data: productos,
        loading,
        error,
        refetch
    } = useFetch(() => getProductos({ q: busqueda, categoria, orden }), [busqueda, categoria, orden]);

    const handleLimpiarFiltros = () => {
        setBusqueda('');
        setCategoria('');
        setOrden('');
    };

    return (
        <div className="page-container catalog-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Catálogo de Productos</h1>
                    <p className="page-subtitle">Explora nuestro inventario tecnológico con filtrado en tiempo real</p>
                </div>
            </header>

            {/* Barra de Filtros y Búsqueda */}
            <FilterBar
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                categoria={categoria}
                onCategoriaChange={setCategoria}
                orden={orden}
                onOrdenChange={setOrden}
                categorias={categorias}
                onLimpiarFiltros={handleLimpiarFiltros}
            />

            {error && (
                <div className="mb-6">
                    <ErrorMessage error={error} onClose={() => refetch()} />
                </div>
            )}

            {loading ? (
                <LoadingSpinner mensaje="Cargando productos del catálogo..." />
            ) : productos && productos.length > 0 ? (
                <div className="products-grid">
                    {productos.map((producto) => (
                        <ProductCard key={producto.id} producto={producto} />
                    ))}
                </div>
            ) : (
                <div className="empty-state-card">
                    <span className="empty-icon">🔎</span>
                    <h3>No se encontraron productos</h3>
                    <p>Intenta ajustar tus criterios de búsqueda o limpia los filtros activos.</p>
                    <button onClick={handleLimpiarFiltros} className="btn-secondary mt-4">
                        Restablecer Filtros
                    </button>
                </div>
            )}
        </div>
    );
}
