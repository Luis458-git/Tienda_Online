import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { getProductos, getProductosCategorias } from '../services/api';
import ProductCard from '../components/ProductCard';
import FilterBar from '../components/FilterBar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Catalog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlCategory = searchParams.get('cat') || '';

    const [busqueda, setBusqueda] = useState('');
    const [categoria, setCategoria] = useState(urlCategory);
    const [orden, setOrden] = useState('');

    useEffect(() => {
        if (urlCategory) {
            setCategoria(urlCategory);
        }
    }, [urlCategory]);

    const handleCategoriaChange = (newCat) => {
        setCategoria(newCat);
        if (newCat) {
            setSearchParams({ cat: newCat });
        } else {
            setSearchParams({});
        }
    };

    // Consulta de categorías
    const { data: categoriasData } = useFetch(getProductosCategorias, []);
    const categorias = Array.isArray(categoriasData) ? categoriasData : [
        'Periféricos', 'Monitores', 'Componentes', 'Audio', 'Accesorios', 'Computadoras'
    ];

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
        setSearchParams({});
    };

    return (
        <div className="space-y-6 animate-fadeIn w-full">
            
            {/* Sub-barra: Breadcrumbs + Estado de Sincronización */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                    <span className="text-white font-bold">Catálogo</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-slate-300">
                        {categoria ? categoria : 'Todos los Componentes'}
                    </span>
                    {busqueda && (
                        <>
                            <span className="text-slate-600">/</span>
                            <span className="text-cyan-400 font-mono">"{busqueda}"</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Inventario en tiempo real sincronizado</span>
                </div>
            </div>

            {/* Hero Banner del Catálogo */}
            <div className="cf-catalog-hero">
                <div className="max-w-2xl space-y-3 relative z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                        <span>✦</span> HARDWARE DE ALTO RENDIMIENTO
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Catálogo de Componentes & Periféricos Pro
                    </h1>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Explora periféricos de ultra baja latencia, paneles IPS de alta frecuencia y almacenamiento NVMe con protección atómica de inventario y recomendaciones de IA.
                    </p>

                    {/* Stat Chips */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-300">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                            <span className="text-cyan-400">⚡</span>
                            <span>{productos ? productos.length : 10} Artículos Activos</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                            <span className="text-emerald-400">✓</span>
                            <span>Stock PostgreSQL Protegido</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                            <span className="text-purple-400">🪄</span>
                            <span>Copiloto de IA Activo</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <FilterBar
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                categoria={categoria}
                onCategoriaChange={handleCategoriaChange}
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

            {/* Grid de Productos */}
            {loading ? (
                <LoadingSpinner mensaje="Cargando telemetría de catálogo y stock en tiempo real..." />
            ) : productos && productos.length > 0 ? (
                <div className="cf-catalog-grid">
                    {productos.map((producto) => (
                        <ProductCard key={producto.id} producto={producto} />
                    ))}
                </div>
            ) : (
                <div className="cf-card p-12 text-center max-w-lg mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto text-2xl">
                        🔍
                    </div>
                    <h3 className="text-lg font-bold text-white">No se encontraron productos</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        No hay artículos coincidentes para el filtro seleccionado. Intenta buscar otro término o limpia los filtros activos.
                    </p>
                    <button
                        onClick={handleLimpiarFiltros}
                        className="cf-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold"
                    >
                        Restablecer Filtros
                    </button>
                </div>
            )}

        </div>
    );
}
