// FILE: /frontend/src/hooks/useFetch.js
// FIX: file was named UseFetch.js (capital U) but every import uses useFetch (lowercase u)
// On Linux (case-sensitive filesystem) this causes a fatal module resolution error.
// RENAME the file from UseFetch.js to useFetch.js

import { useState, useEffect, useCallback } from 'react';

export function useFetch(fetchFn, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const execute = useCallback(async() => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchFn();
            setData(res.data.data);
        } catch (err) {
            let errorMessage = 'An error occurred';
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = err.response.data.message;
            } else if (err.response && err.response.data && err.response.data.error) {
                errorMessage = err.response.data.error;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, deps);

    useEffect(() => {
        execute();
    }, [execute]);

    return { data, loading, error, refetch: execute };
}