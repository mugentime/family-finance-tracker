import { useState, useEffect, useCallback } from 'react';
// Hook that works with Netlify functions for data persistence
function useNetlifyData(apiEndpoint, localStorageKey, initialValue) {
    const [data, setData] = useState(initialValue);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Detect if we're running on Netlify
    const isNetlify = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    // Load data from localStorage or API
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            if (isNetlify) {
                // On Netlify, use API
                const response = await fetch(`/api${apiEndpoint}`);
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
                else {
                    throw new Error(`API error: ${response.status}`);
                }
            }
            else {
                // Locally, use localStorage as fallback
                const stored = localStorage.getItem(localStorageKey);
                if (stored) {
                    setData(JSON.parse(stored));
                }
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
            // Fallback to localStorage even on Netlify if API fails
            try {
                const stored = localStorage.getItem(localStorageKey);
                if (stored) {
                    setData(JSON.parse(stored));
                }
            }
            catch (localErr) {
                console.warn('LocalStorage fallback failed:', localErr);
            }
        }
        finally {
            setLoading(false);
        }
    }, [apiEndpoint, localStorageKey, isNetlify]);
    // Save data to localStorage or API
    const saveData = useCallback(async (value) => {
        try {
            setError(null);
            const newValue = value instanceof Function ? value(data) : value;
            if (isNetlify) {
                // On Netlify, use API
                const response = await fetch(`/api${apiEndpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newValue),
                });
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
                else {
                    throw new Error(`API error: ${response.status}`);
                }
            }
            else {
                // Locally, use localStorage
                localStorage.setItem(localStorageKey, JSON.stringify(newValue));
                setData(newValue);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save data');
            // Fallback to localStorage even on Netlify
            try {
                const newValue = value instanceof Function ? value(data) : value;
                localStorage.setItem(localStorageKey, JSON.stringify(newValue));
                setData(newValue);
            }
            catch (localErr) {
                console.warn('LocalStorage fallback failed:', localErr);
            }
            throw err;
        }
    }, [apiEndpoint, localStorageKey, isNetlify, data]);
    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);
    return [data, saveData, loading, error];
}
export default useNetlifyData;
