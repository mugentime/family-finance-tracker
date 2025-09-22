import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../src/services/apiService';

// Hook that works with Netlify functions for data persistence
function useNetlifyData<T>(
  apiEndpoint: string,
  localStorageKey: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => Promise<void>, boolean, string | null] {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setData(result as T);
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      } else {
        // Locally, use localStorage as fallback
        const stored = localStorage.getItem(localStorageKey);
        if (stored) {
          setData(JSON.parse(stored));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // Fallback to localStorage even on Netlify if API fails
      try {
        const stored = localStorage.getItem(localStorageKey);
        if (stored) {
          setData(JSON.parse(stored));
        }
      } catch (localErr) {
        console.warn('LocalStorage fallback failed:', localErr);
      }
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, localStorageKey, isNetlify]);

  // Save data to localStorage or API
  const saveData = useCallback(async (value: T | ((val: T) => T)) => {
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
          setData(result as T);
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      } else {
        // Locally, use localStorage
        localStorage.setItem(localStorageKey, JSON.stringify(newValue));
        setData(newValue);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save data');
      // Fallback to localStorage even on Netlify
      try {
        const newValue = value instanceof Function ? value(data) : value;
        localStorage.setItem(localStorageKey, JSON.stringify(newValue));
        setData(newValue);
      } catch (localErr) {
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