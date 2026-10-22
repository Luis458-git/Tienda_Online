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
        <div className="filter-bar">
            <div className="filter-group search-group">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Buscar por nombre o descripción..."
                    value={busqueda}
                    onChange={(e) => onBusquedaChange(e.target.value)}
                    className="filter-input"
                />
                {busqueda && (
                    <button
                        type="button"
                        onClick={() => onBusquedaChange('')}
                        className="btn-clear-search"
                        title="Borrar búsqueda"
                    >
                        ×
                    </button>
                )}
            </div>

            <div className="filter-controls">
                <div className="filter-select-wrapper">
                    <label htmlFor="categoria-select" className="filter-label">Categoría:</label>
                    <select
                        id="categoria-select"
                        value={categoria}
                        onChange={(e) => onCategoriaChange(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-select-wrapper">
                    <label htmlFor="orden-select" className="filter-label">Ordenar por:</label>
                    <select
                        id="orden-select"
                        value={orden}
                        onChange={(e) => onOrdenChange(e.target.value)}
                        className="filter-select"
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
                        className="btn-text btn-reset"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>
        </div>
    );
}
