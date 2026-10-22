import React from 'react';

export default function ErrorMessage({ error, onClose }) {
    if (!error) return null;

    const mensaje = typeof error === 'string' ? error : error.message || 'Ha ocurrido un error inesperado';
    const status = typeof error === 'object' ? error.status : null;

    const esConflicto409 = status === 409 || mensaje.toLowerCase().includes('stock') || mensaje.toLowerCase().includes('cupón') || mensaje.toLowerCase().includes('cancelar');
    const esBadReq400 = status === 400;

    return (
        <div className={`alert-banner ${esConflicto409 ? 'alert-conflict' : esBadReq400 ? 'alert-warning' : 'alert-danger'}`}>
            <div className="alert-content">
                <span className="alert-icon">
                    {esConflicto409 ? '⚠️' : esBadReq400 ? '📋' : '❌'}
                </span>
                <div className="alert-text">
                    <strong className="alert-tag">
                        {status ? `Error ${status}` : esConflicto409 ? 'Conflicto de Regla de Negocio' : 'Error'}:
                    </strong>{' '}
                    <span>{mensaje}</span>
                </div>
            </div>
            {onClose && (
                <button type="button" onClick={onClose} className="alert-close" title="Cerrar mensaje">
                    ×
                </button>
            )}
        </div>
    );
}
