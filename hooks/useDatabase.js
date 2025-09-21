import { useState, useEffect, useCallback } from 'react';
// Generic database hook that replaces localStorage functionality
function useDatabase(apiEndpoint, initialValue, dependencies = []) {
    const [data, setData] = useState(initialValue);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Fetch data from API
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(apiEndpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setData(result);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            if (process.env.NODE_ENV !== 'production') {
                console.error('Database fetch error:', err);
            }
        }
        finally {
            setLoading(false);
        }
    }, [apiEndpoint]);
    // Update data via API
    const updateData = useCallback(async (value) => {
        try {
            setError(null);
            const newValue = value instanceof Function ? value(data) : value;
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newValue),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setData(result);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            if (process.env.NODE_ENV !== 'production') {
                console.error('Database update error:', err);
            }
            throw err; // Re-throw for component error handling
        }
    }, [apiEndpoint, data]);
    // Fetch data on mount and when dependencies change
    useEffect(() => {
        fetchData();
    }, [fetchData, ...dependencies]);
    return [data, updateData, loading, error];
}
export default useDatabase;
