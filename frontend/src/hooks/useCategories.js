/**
 * useCategories.js — Custom Hook for Category Data
 * ─────────────────────────────────────────────────────────────────────────────
 * Encapsulates the fetch-and-cache pattern for categories so that any component
 * that needs categories doesn't have to repeat the loading logic.
 *
 * Returned values:
 *   categories — the current array of category objects ([] while loading)
 *   loading    — true while the first fetch is in flight
 *   refresh    — call this function to re-fetch categories from the server
 *                (used after creating or deleting a category)
 *
 * PATTERN — useCallback + useEffect:
 *   `load` is wrapped in useCallback so its reference stays stable across
 *   renders. This prevents the useEffect from re-running on every render —
 *   it only re-runs when `load` changes (which never happens in this case).
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "../api/api";

/**
 * @returns {{ categories: Category[], loading: boolean, refresh: () => void }}
 */
export function useCategories() {
  // Start with an empty array — components should handle the empty state gracefully
  const [categories, setCategories] = useState([]);

  // Track loading state so consumers can show a spinner or skeleton
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the latest categories from the API and updates state.
   * useCallback ensures this function reference is stable (doesn't change
   * between renders), so it's safe to include in useEffect's dependency array.
   */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (e) {
      // Log the error but don't crash the app — categories failing to load
      // is recoverable (UI degrades gracefully with empty arrays)
      console.error("Failed to load categories:", e);
    } finally {
      // Always clear the loading flag, even if the request failed
      setLoading(false);
    }
  }, []); // empty deps — this function never needs to be recreated

  // Fetch categories once on mount. Re-runs only if `load` changes (it doesn't).
  useEffect(() => { load(); }, [load]);

  return {
    categories,
    loading,
    refresh: load, // expose `load` as `refresh` so callers have a meaningful name
  };
}
