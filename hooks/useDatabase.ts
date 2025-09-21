import { useState, useEffect, useCallback } from 'react';

// Generic database hook that replaces localStorage functionality
function useDatabase<T>(
  apiEndpoint: string,
  initialValue: T,
  dependencies: any[] = []
): [T, (value: T | ((val: T) => T)) => Promise<void>, boolean, string | null] {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setData(result as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      if (process.env.NODE_ENV !== 'production') {
        console.error('Database fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  // Update data via API
  const updateData = useCallback(async (value: T | ((val: T) => T)) => {
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
      setData(result as T);
    } catch (err) {
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