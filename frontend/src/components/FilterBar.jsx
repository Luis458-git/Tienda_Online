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
    return (
        <div className="bg-[#10131c] border border-[#1e2333] rounded-2xl p-4 sm:p-5 shadow-xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Buscador de Texto */}
            <div className="relative flex-1 max-w-md">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Buscar hardware por nombre o especificación..."
                    value={busqueda}
                    onChange={(e) => onBusquedaChange(e.target.value)}
                    className="w-full bg-[#0b0d14] border border-[#1e2332] rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6366f1] transition"
                />
                {busqueda && (
                    <button
                        type="button"
                        onClick={() => onBusquedaChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-base font-bold"
                        title="Borrar búsqueda"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Controles de Filtro y Ordenamiento */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <label htmlFor="categoria-select" className="text-xs text-slate-400 font-medium">Categoría:</label>
                    <select
                        id="categoria-select"
                        value={categoria}
                        onChange={(e) => onCategoriaChange(e.target.value)}
                        className="bg-[#0b0d14] border border-[#1e2332] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#6366f1] transition cursor-pointer"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label htmlFor="orden-select" className="text-xs text-slate-400 font-medium">Ordenar:</label>
                    <select
                        id="orden-select"
                        value={orden}
                        onChange={(e) => onOrdenChange(e.target.value)}
                        className="bg-[#0b0d14] border border-[#1e2332] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#6366f1] transition cursor-pointer"
                    >
                        <option value="">Por defecto</option>
                        <option value="precio_asc">Precio: Menor a Mayor</option>
                        <option value="precio_desc">Precio: Mayor a Menor</option>
                        <option value="nombre_asc">Nombre: A - Z</option>
                        <option value="nombre_desc">Nombre: Z - A</option>
                        <option value="stock_desc">Mayor Stock Disponible</option>
                    </select>
                </div>

                {(busqueda || categoria || orden) && (
                    <button
                        type="button"
                        onClick={onLimpiarFiltros}
                        className="text-xs text-slate-400 hover:text-red-400 font-semibold px-2 py-1 rounded-lg transition"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>
        </div>
    );
}
