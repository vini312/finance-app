/**
 * useDashboardLayout.js — Dashboard Layout State Management
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom hook that owns everything about which widgets are on the dashboard
 * and how wide each one is. Layout changes are persisted to localStorage so
 * they survive page refreshes.
 *
 * LAYOUT FORMAT:
 *   Internal state is an array of { id, w } objects:
 *     id — widget ID string (matches WIDGET_REGISTRY entries)
 *     w  — column span on the 12-column CSS grid (integer 1–12)
 *
 *   Stored as JSON in localStorage under STORAGE_KEY.
 *
 * MIGRATION SUPPORT:
 *   The normalise() function handles both the old format (plain string IDs)
 *   and the new format ({ id, w } objects), so users upgrading from v5 don't
 *   lose their layout.
 *
 * EXPOSED API:
 *   activeWidgets   — current ordered layout [{ id, w }, ...]
 *   availableWidgets — WIDGET_REGISTRY entries NOT in activeWidgets (for Add panel)
 *   reorder(oldIndex, newIndex) — move a widget to a new position
 *   addWidget(id)              — append a widget to the end of the layout
 *   removeWidget(id)           — remove a widget from the layout
 *   setWidgetWidth(id, newW)   — update a widget's column span (called during resize)
 *   resetLayout()              — restore DEFAULT_LAYOUT
 */

import { useState, useCallback } from "react";
import { DEFAULT_LAYOUT, WIDGET_REGISTRY } from "./widgetRegistry";

// Key under which the layout array is stored in localStorage
const STORAGE_KEY = "financeflow_dashboard_layout_v2";

// Build a lookup map once so we don't scan the array on every operation
const registryMap = Object.fromEntries(WIDGET_REGISTRY.map((w) => [w.id, w]));

/**
 * Clamps a number between a minimum and maximum (inclusive).
 * Used to prevent widgets from being resized beyond the grid boundaries.
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Converts any raw saved value into the canonical [{ id, w }] format.
 * Also filters out IDs for widgets that no longer exist in the registry
 * (e.g. after a widget is removed from the codebase).
 *
 * @param  {Array} raw - Either old format (string[]) or new format ({ id, w }[])
 * @returns {{ id: string, w: number }[]}
 */
function normalise(raw) {
  const validIds = new Set(WIDGET_REGISTRY.map((w) => w.id));

  return raw
    .map((item) => {
      // Support both old plain-string format and new object format
      const id = typeof item === "string" ? item : item?.id;

      // Skip any ID that no longer exists in the registry
      if (!id || !validIds.has(id)) return null;

      const def = registryMap[id];

      // Use saved width if it's an object, otherwise fall back to the registry default
      const w = typeof item === "object" && item.w ? item.w : def.defaultW;

      // Clamp to the widget's minimum width and the grid maximum (12 columns)
      return { id, w: clamp(w, def.minW, 12) };
    })
    .filter(Boolean); // remove the null entries from skipped IDs
}

/**
 * Loads the layout from localStorage, normalises it, and returns the result.
 * Returns the DEFAULT_LAYOUT if nothing is saved or parsing fails.
 */
function loadLayout() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalise(JSON.parse(saved));
  } catch (_) {
    // JSON.parse can throw on corrupted data — silently fall back to default
  }
  return normalise(DEFAULT_LAYOUT);
}

/**
 * Serialises and writes the layout to localStorage.
 * Silently ignores write errors (e.g. storage quota exceeded).
 */
function save(layout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch (_) {}
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDashboardLayout() {
  // The layout array is the single source of truth for the dashboard
  const [layout, setLayout] = useState(loadLayout);

  /**
   * Internal helper: applies a transformation function to the layout,
   * then saves the result to localStorage.
   * All public methods use this instead of calling setLayout directly.
   *
   * @param {Function} fn - Pure function: (prev: Layout[]) => Layout[]
   */
  const update = useCallback((fn) => {
    setLayout((prev) => {
      const next = fn(prev);
      save(next); // persist immediately after every change
      return next;
    });
  }, []);

  /**
   * Moves a widget from one position to another in the layout array.
   * Called by the dnd-kit drag-and-drop handler in Dashboard.jsx.
   *
   * @param {number} oldIndex - Current position of the widget
   * @param {number} newIndex - Target position
   */
  const reorder = useCallback((oldIndex, newIndex) => {
    update((prev) => {
      const next = [...prev];
      const [moved] = next.splice(oldIndex, 1); // remove from old position
      next.splice(newIndex, 0, moved);           // insert at new position
      return next;
    });
  }, [update]);

  /**
   * Adds a widget to the end of the layout with its default column width.
   * Does nothing if the widget is already in the layout (idempotent).
   *
   * @param {string} id - Widget ID from WIDGET_REGISTRY
   */
  const addWidget = useCallback((id) => {
    update((prev) => {
      // Guard: don't add the same widget twice
      if (prev.find((w) => w.id === id)) return prev;
      const def = registryMap[id];
      return [...prev, { id, w: def?.defaultW ?? 6 }];
    });
  }, [update]);

  /**
   * Removes a widget from the layout by ID.
   * The widget remains in WIDGET_REGISTRY and can be re-added from the Add panel.
   *
   * @param {string} id - Widget ID to remove
   */
  const removeWidget = useCallback((id) => {
    update((prev) => prev.filter((w) => w.id !== id));
  }, [update]);

  /**
   * Updates the column span of a specific widget.
   * Called continuously during a resize drag (many times per second) and
   * once more on mouse-up to commit the final value.
   *
   * @param {string} id   - Widget ID
   * @param {number} newW - New column span (will be clamped to [minW, 12])
   */
  const setWidgetWidth = useCallback((id, newW) => {
    update((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item; // leave all other widgets unchanged
        const def = registryMap[id];
        // Clamp to the widget's own minimum and the 12-column grid maximum
        return { ...item, w: clamp(newW, def?.minW ?? 2, 12) };
      })
    );
  }, [update]);

  /**
   * Resets the layout to the application default, clearing any customisations.
   * Also updates localStorage so the reset persists across page refreshes.
   */
  const resetLayout = useCallback(() => {
    const next = normalise(DEFAULT_LAYOUT);
    setLayout(next);
    save(next);
  }, []);

  // Derive the list of widgets NOT currently in the layout.
  // Used by AddWidgetPanel to show what can be added back.
  const activeIds = new Set(layout.map((w) => w.id));
  const availableWidgets = WIDGET_REGISTRY.filter((w) => !activeIds.has(w.id));

  return {
    activeWidgets: layout, // [{ id, w }] — the ordered layout
    availableWidgets,      // WIDGET_REGISTRY entries not in the layout
    reorder,
    addWidget,
    removeWidget,
    setWidgetWidth,
    resetLayout,
  };
}
