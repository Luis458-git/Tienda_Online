import React from 'react';

export default function LoadingSpinner({ mensaje = 'Cargando datos...' }) {
    return (
        <div className="spinner-container">
            <div className="spinner-ring"></div>
            <p className="spinner-text">{mensaje}</p>
        </div>
    );
}
