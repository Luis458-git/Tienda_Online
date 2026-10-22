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
        <div className="pb-12 animate-fadeIn">
            {/* Cabecera de Página con Badge */}
            <div className="mb-7">
                <div className="inline-flex items-center gap-1.5 bg-[#181a2e] text-[#818cf8] border border-[#292e4c] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider mb-2 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8]"></span>
                    HARDWARE CATALOG · INVENTARIO EN TIEMPO REAL
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Catálogo de Productos & Hardware
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Explora y filtra dispositivos tecnológicos con control estricto de inventario.
                </p>
            </div>

            {/* Barra de Filtros */}
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
                <LoadingSpinner mensaje="Cargando productos del catálogo tecnológico..." />
            ) : productos && productos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {productos.map((producto) => (
                        <ProductCard key={producto.id} producto={producto} />
                    ))}
                </div>
            ) : (
                <div className="bg-[#10131c] border border-[#1e2333] rounded-2xl p-10 text-center max-w-md mx-auto shadow-xl">
                    <div className="w-12 h-12 rounded-xl bg-[#141724] border border-[#22283a] flex items-center justify-center text-slate-400 mx-auto mb-3">
                        🔍
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">No se encontraron productos</h3>
                    <p className="text-xs text-slate-400 mb-4">
                        Intenta ajustar tus criterios de búsqueda o limpia los filtros activos.
                    </p>
                    <button
                        onClick={handleLimpiarFiltros}
                        className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                    >
                        Restablecer Filtros
                    </button>
                </div>
            )}
        </div>
    );
}
