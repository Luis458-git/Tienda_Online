import React from 'react';

export default function FilterBar({
    busqueda,
    onBusquedaChange,
    categoria,
    onCategoriaChange,
    orden,
    onOrdenChange,
    categorias = [],
    onLimpiarFiltros
}) {
    // Categorías con iconos correspondientes
    const getCatIcon = (cat) => {
        switch (cat) {
            case 'Periféricos': return '🖱️';
            case 'Monitores': return '🖥️';
            case 'Componentes': return '⚙️';
            case 'Audio': return '🎧';
            case 'Accesorios': return '🎒';
            case 'Computadoras': return '💻';
            default: return '⚡';
        }
    };

    return (
        <div className="space-y-4 mb-6">
            
            {/* Píldoras de Categoría Rápidas (Chips Bar) */}
            <div className="cf-cat-chips-bar">
                <button
                    type="button"
                    onClick={() => onCategoriaChange('')}
                    className={`cf-cat-chip ${categoria === '' ? 'active' : ''}`}
                >
                    <span>⚡</span>
                    <span>Todos los Productos</span>
                </button>
                {categorias.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => onCategoriaChange(cat)}
                        className={`cf-cat-chip ${categoria === cat ? 'active' : ''}`}
                    >
                        <span>{getCatIcon(cat)}</span>
                        <span>{cat}</span>
                    </button>
                ))}
            </div>

            {/* Barra de Búsqueda y Ordenamiento */}
            <div className="cf-card p-4 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                
                {/* Input de Búsqueda */}
                <div className="cf-search-box">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar hardware por modelo, categoría o especificación..."
                        value={busqueda}
                        onChange={(e) => onBusquedaChange(e.target.value)}
                        className="cf-search-input"
                    />
                    {busqueda && (
                        <button
                            type="button"
                            onClick={() => onBusquedaChange('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white font-bold"
                            title="Borrar búsqueda"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Controles de Orden y Limpieza */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="orden-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Ordenar:
                        </label>
                        <select
                            id="orden-select"
                            value={orden}
                            onChange={(e) => onOrdenChange(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                        >
                            <option value="">Por defecto</option>
                            <option value="precio_asc">Precio: Menor a Mayor</option>
                            <option value="precio_desc">Precio: Mayor a Menor</option>
                            <option value="nombre_asc">Nombre: A – Z</option>
                            <option value="nombre_desc">Nombre: Z – A</option>
                            <option value="stock_desc">Mayor Stock Disponible</option>
                        </select>
                    </div>

                    {(busqueda || categoria || orden) && (
                        <button
                            type="button"
                            onClick={onLimpiarFiltros}
                            className="text-xs text-rose-400 hover:text-rose-300 font-bold px-3 py-2 rounded-xl hover:bg-rose-950/30 transition border border-rose-500/20 cursor-pointer"
                        >
                            ✕ Limpiar filtros
                        </button>
                    )}
                </div>

            </div>

        </div>
    );
}
