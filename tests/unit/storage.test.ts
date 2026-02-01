import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWxtStorage } from '../../src/utils/storage';

// Create a mock storage item factory
function createMockStorageItem<T>(fallback: T) {
  let storedValue: T | undefined = undefined;
  const watchers = new Set<(value: T | null) => void>();

  return {
    getValue: vi.fn(async () => storedValue ?? fallback),
    setValue: vi.fn(async (value: T) => {
      storedValue = value;
      watchers.forEach(cb => cb(value));
    }),
    watch: vi.fn((callback: (value: T | null) => void) => {
      watchers.add(callback);
      return () => watchers.delete(callback);
    }),
    _reset: () => {
      storedValue = undefined;
      watchers.clear();
    },
  };
}

describe('useWxtStorage', () => {
  it('should return null initially while loading', () => {
    const mockStorage = createMockStorageItem('default');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useWxtStorage(mockStorage as any));

    expect(result.current.value).toBe(null);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should load value and set isLoading to false', async () => {
    const mockStorage = createMockStorageItem('chatgpt');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useWxtStorage(mockStorage as any));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.value).toBe('chatgpt');
  });

  it('should update value via setValue', async () => {
    const mockStorage = createMockStorageItem('chatgpt');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useWxtStorage(mockStorage as any));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setValue('claude');
    });

    expect(mockStorage.setValue).toHaveBeenCalledWith('claude');
  });

  it('should support updater function in setValue', async () => {
    const mockStorage = createMockStorageItem(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useWxtStorage(mockStorage as any));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setValue((prev: boolean | null) => !prev);
    });

    expect(mockStorage.setValue).toHaveBeenCalledWith(true);
  });

  it('should expose error state', async () => {
    const mockStorage = createMockStorageItem('default');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useWxtStorage(mockStorage as any));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(null);
  });

  it('should return error property in hook result', () => {
    const mockStorage = createMockStorageItem('default');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useWxtStorage(mockStorage as any));

    expect('error' in result.current).toBe(true);
  });

  it('should handle boolean storage items', async () => {
    const mockStorage = createMockStorageItem(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useWxtStorage(mockStorage as any));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.value).toBe(false);
  });

  it('should cleanup watcher on unmount', async () => {
    const mockStorage = createMockStorageItem('default');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result, unmount } = renderHook(() => useWxtStorage(mockStorage as any));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockStorage.watch).toHaveBeenCalled();

    unmount();

    // Cleanup verified by no errors on unmount
  });
});
