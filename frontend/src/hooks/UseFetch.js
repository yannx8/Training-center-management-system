// FILE: /frontend/src/hooks/useFetch.js
// Generic data-fetching hook — avoids duplicating loading/error state in every component
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
            // Assuming API response structure is { data: { data: [...] } }
            setData(res.data.data);
        } catch (err) {
            // FIX: Rewritten to avoid optional chaining syntax that your formatter breaks
            let errorMessage = 'An error occurred';

            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = err.response.data.message;
            } else if (err.response && err.response.data && err.response.data.error) {
                // Fallback to .error if .message doesn't exist
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