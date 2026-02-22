/**
 * useCategories.js
 * Fetches and caches the category list. Exposes a refresh function.
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "../api/api";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (e) {
      console.error("Failed to load categories:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { categories, loading, refresh: load };
}
