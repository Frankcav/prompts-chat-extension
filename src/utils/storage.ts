import { storage } from '@wxt-dev/storage';
import { useEffect, useState } from 'react';

// Define storage items with type safety
export const selectedModelStorage = storage.defineItem<string>('sync:selectedModel', {
  fallback: 'chatgpt',
});

export const isDarkModeStorage = storage.defineItem<boolean>('sync:isDarkMode', {
  fallback: false,
});

// React hook for WXT storage with type safety
export function useWxtStorage<T>(item: ReturnType<typeof storage.defineItem<T>>) {
  const [value, setValue] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unwatch: (() => void) | undefined;

    item.getValue()
      .then(v => {
        setValue(v);
        setError(null);
      })
      .catch(err => {
        console.error('Storage read error:', err);
        setError(err instanceof Error ? err : new Error('Failed to read from storage'));
      })
      .finally(() => {
        setIsLoading(false);
      });

    try {
      unwatch = item.watch(newValue => {
        setValue(newValue);
        setError(null);
      });
    } catch (err) {
      console.error('Storage watch error:', err);
    }

    return () => unwatch?.();
  }, [item]);

  const update = async (newValue: T | ((prev: T | null) => T)) => {
    const valueToSet = typeof newValue === 'function'
      ? (newValue as (prev: T | null) => T)(value)
      : newValue;
    try {
      await item.setValue(valueToSet);
      setError(null);
    } catch (err) {
      console.error('Storage write error:', err);
      setError(err instanceof Error ? err : new Error('Failed to write to storage'));
      throw err;
    }
  };

  return { value, isLoading, error, setValue: update };
}
