/**
 * useDashboardLayout.js
 *
 * Manages widget order AND per-widget column widths (1–12 grid columns).
 * Layout is stored as [{ id, w }] and persisted to localStorage.
 */

import { useState, useCallback } from "react";
import { DEFAULT_LAYOUT, WIDGET_REGISTRY } from "./widgetRegistry";

const STORAGE_KEY = "financeflow_dashboard_layout_v2";

const registryMap = Object.fromEntries(WIDGET_REGISTRY.map((w) => [w.id, w]));

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/** Normalise raw saved data to [{ id, w }], filtering dead IDs */
function normalise(raw) {
  const validIds = new Set(WIDGET_REGISTRY.map((w) => w.id));
  return raw
    .map((item) => {
      const id = typeof item === "string" ? item : item?.id;
      if (!id || !validIds.has(id)) return null;
      const def = registryMap[id];
      const w   = typeof item === "object" && item.w ? item.w : def.defaultW;
      return { id, w: clamp(w, def.minW, 12) };
    })
    .filter(Boolean);
}

function loadLayout() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalise(JSON.parse(saved));
  } catch (_) {}
  return normalise(DEFAULT_LAYOUT);
}

function save(layout) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch (_) {}
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState(loadLayout); // [{ id, w }]

  const update = useCallback((fn) => {
    setLayout((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, []);

  const reorder = useCallback((oldIndex, newIndex) => {
    update((prev) => {
      const next = [...prev];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      return next;
    });
  }, [update]);

  const addWidget = useCallback((id) => {
    update((prev) => {
      if (prev.find((w) => w.id === id)) return prev;
      const def = registryMap[id];
      return [...prev, { id, w: def?.defaultW ?? 6 }];
    });
  }, [update]);

  const removeWidget = useCallback((id) => {
    update((prev) => prev.filter((w) => w.id !== id));
  }, [update]);

  /** Set absolute new column width for a widget (called during live resize) */
  const setWidgetWidth = useCallback((id, newW) => {
    update((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const def = registryMap[id];
        return { ...item, w: clamp(newW, def?.minW ?? 2, 12) };
      })
    );
  }, [update]);

  const resetLayout = useCallback(() => {
    const next = normalise(DEFAULT_LAYOUT);
    setLayout(next);
    save(next);
  }, []);

  const activeIds = new Set(layout.map((w) => w.id));
  const availableWidgets = WIDGET_REGISTRY.filter((w) => !activeIds.has(w.id));

  return {
    activeWidgets: layout,  // [{ id, w }]
    availableWidgets,
    reorder,
    addWidget,
    removeWidget,
    setWidgetWidth,
    resetLayout,
  };
}
