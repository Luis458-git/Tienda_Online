import { useState, useEffect, useCallback } from 'react';

/**
 * Custom Hook genérico para desacoplar la carga reactiva de datos y errores.
 * Soporta tanto una función de servicio asíncrona como dependencias reactivas.
 *
 * @param {Function} fetchFn - Función asíncrona que retorna la promesa con los datos
 * @param {Array} deps - Array de dependencias que disparan refetch cuando cambian
 * @returns {{ data: any, loading: boolean, error: string|null, refetch: Function }}
 */
export function useFetch(fetchFn, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const ejecutar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const resultado = await fetchFn();
            setData(resultado);
        } catch (err) {
            console.error('Error capturado en useFetch:', err);
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        let isMounted = true;

        ejecutar();

        return () => {
            isMounted = false;
        };
    }, [ejecutar]);

    return {
        data,
        loading,
        error,
        refetch: ejecutar
    };
}
