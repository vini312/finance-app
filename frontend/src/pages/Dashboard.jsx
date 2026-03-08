/**
 * Dashboard.jsx — Main Dashboard Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a customisable widget grid with two interaction modes:
 *
 * RESIZE (always available):
 *   Every widget has an invisible 6px strip on its right border.
 *   Hovering shows a col-resize cursor; dragging snaps to 1/12 column increments.
 *   A "3 / 12 col" badge floats above the widget while resizing.
 *   Width is committed to layout state (and localStorage) on mouse-up.
 *
 * CUSTOMIZE MODE (click "Customize" button):
 *   Drag handles (⠿) appear on each widget — drag to reorder.
 *   X buttons appear — click to remove a widget from the dashboard.
 *   "Add Widget" button opens the AddWidgetPanel drawer to restore removed widgets.
 *   "Reset" button restores the default widget layout.
 *   Click "Done" to exit customize mode.
 *
 * DATA FLOW:
 *   analytics + categories props → passed into each widget component
 *   useDashboardLayout()         → owns widget order, widths, add/remove
 *   api.getAnalytics()           → fetched on mount and whenever `refresh` changes
 *
 * DRAG-AND-DROP LIBRARY: @dnd-kit
 *   DndContext      — provides the drag context for all children
 *   SortableContext — tells dnd-kit which items are sortable and their current order
 *   DragOverlay     — renders a floating "ghost" card that follows the cursor
 *                     (separate from the actual widget, which becomes translucent)
 *   useSortable     — used inside DraggableWidget to make each widget draggable
 *
 * RESIZE STRATEGY:
 *   Resize is handled entirely via native mouse events (not dnd-kit).
 *   dnd-kit's PointerSensor requires `distance: 8` to activate, which lets
 *   the resize handle's mousedown fire without accidentally triggering a sort drag.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Box,
  Button,
  Paper,
  Typography,
  Skeleton,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import EditIcon       from "@mui/icons-material/Edit";
import EditOffIcon    from "@mui/icons-material/EditOff";
import AddIcon        from "@mui/icons-material/Add";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import { api }                from "../api/api";
import { WIDGET_REGISTRY }    from "../dashboard/widgetRegistry";
import { useDashboardLayout } from "../dashboard/useDashboardLayout";
import DraggableWidget        from "../dashboard/DraggableWidget";
import AddWidgetPanel         from "../dashboard/AddWidgetPanel";

// Build a lookup map once (module level) — avoids rebuilding on every render
const registryMap = Object.fromEntries(WIDGET_REGISTRY.map((w) => [w.id, w]));

function evaluateFormula(formula, analytics) {
  if (!analytics) return null;

  const income     = analytics.totalIncome ?? 0;
  const expenses   = analytics.totalExpenses ?? 0;
  const net        = analytics.netBalance ?? 0;
  const count      = analytics.transactionCount ?? 0;
  const months     = analytics.byMonth ?? [];
  const categories = analytics.byCategory ?? [];

  try {
    // Allow simple JS expressions using the provided variables + Math
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      "income",
      "expenses",
      "net",
      "count",
      "months",
      "categories",
      "Math",
      `return ${formula};`,
    );
    const result = fn(income, expenses, net, count, months, categories, Math);
    if (typeof result === "number" && Number.isFinite(result)) return result;
    return null;
  } catch (_) {
    return null;
  }
}

export default function Dashboard({ categories, refresh }) {
  const [analytics,    setAnalytics]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [isEditMode,   setIsEditMode]   = useState(false);  // customize mode on/off
  const [addPanelOpen, setAddPanelOpen] = useState(false);  // Add Widget drawer open/closed
  const [activeId,     setActiveId]     = useState(null);   // ID of widget currently being dragged
  const [customMetrics, setCustomMetrics] = useState([]);
  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [metricDraft, setMetricDraft] = useState({
    name:    "",
    icon:    "🧮",
    formula: "",
    format:  "number",
  });

  // Ref to the grid DOM element — passed to DraggableWidget so it can measure
  // the pixel width of one column at drag-start for accurate resize snapping
  const gridRef = useRef(null);

  // All layout state (order, widths, add/remove/resize) lives in this hook
  const {
    activeWidgets,    // [{ id, w }] — ordered list of visible widgets
    availableWidgets, // Widget[] — registry entries not currently in the layout
    reorder,          // (oldIndex, newIndex) => void
    addWidget,        // (id) => void
    removeWidget,     // (id) => void
    setWidgetWidth,   // (id, newW) => void
    resetLayout,      // () => void
  } = useDashboardLayout();

  // ── Data Fetching ────────────────────────────────────────────────────────
  /**
   * Fetches analytics data from the backend.
   * Wrapped in useCallback so it has a stable reference for the useEffect below.
   */
  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.getAnalytics().catch(() => null);
    setAnalytics(data);
    setLoading(false);
  }, []);

  // Re-fetch whenever the parent bumps the `refresh` counter (e.g. after CSV upload)
  useEffect(() => { load(); }, [load, refresh]);

  // Load custom metrics from the database
  const loadCustomMetrics = useCallback(async () => {
    const data = await api.getCustomMetrics().catch(() => []);
    setCustomMetrics(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { loadCustomMetrics(); }, [loadCustomMetrics]);

  // ── Custom Metric CRUD ───────────────────────────────────────────────────
  function openNewMetricDialog() {
    setMetricDraft({
      name:    "",
      icon:    "🧮",
      formula: "",
      format:  "number",
    });
    setMetricDialogOpen(true);
  }

  function handleMetricDraftChange(field, value) {
    setMetricDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveMetric() {
    if (!metricDraft.name.trim() || !metricDraft.formula.trim()) {
      return;
    }
    try {
      await api.createCustomMetric({
        name:    metricDraft.name.trim(),
        icon:    metricDraft.icon || "🧮",
        formula: metricDraft.formula.trim(),
        format:  metricDraft.format || "number",
      });
      setMetricDialogOpen(false);
      loadCustomMetrics();
    } catch (_) {
      // Error shown by API interceptor; keep dialog open
    }
  }

  async function handleRemoveMetric(id) {
    try {
      await api.deleteCustomMetric(id);
      setCustomMetrics((prev) => prev.filter((m) => m.id !== id));
    } catch (_) {
      // Error shown by API interceptor
    }
  }

  // ── DnD Sensor Configuration ─────────────────────────────────────────────
  /**
   * Sensors define how dnd-kit detects drag intent.
   *
   * PointerSensor with distance: 8 — requires the pointer to move at least
   *   8px before activating the drag. This prevents accidental drags when
   *   clicking buttons or interacting with the resize handle.
   *
   * KeyboardSensor — allows keyboard users to reorder widgets with arrow keys,
   *   improving accessibility.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Drag Event Handlers ──────────────────────────────────────────────────

  /** Called when a drag starts — record which widget is being dragged
   *  so the DragOverlay knows which ghost to render */
  function handleDragStart({ active }) {
    setActiveId(active.id);
  }

  /** Called when a drag ends — reorder the layout if the item moved to a new position */
  function handleDragEnd({ active, over }) {
    setActiveId(null); // clear the active ID so the ghost disappears

    // `over` is null if the item was dropped outside any sortable area
    if (!over || active.id === over.id) return; // nothing to do if dropped in place

    // Find the current indices of the dragged item and its drop target
    const oldIndex = activeWidgets.findIndex((w) => w.id === active.id);
    const newIndex  = activeWidgets.findIndex((w) => w.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorder(oldIndex, newIndex);
    }
  }

  // ── Empty / Loading States ───────────────────────────────────────────────
  if (loading) return <LoadingSkeleton />;

  if (!analytics || analytics.transactionCount === 0) {
    return (
      <Paper elevation={0} sx={{ p: 6, textAlign: "center" }}>
        <Typography fontSize={48} mb={2}>📂</Typography>
        <Typography variant="h6" color="text.secondary">No data yet</Typography>
        <Typography variant="body2" color="text.disabled" mt={1}>
          Upload a CSV file to see your dashboard
        </Typography>
      </Paper>
    );
  }

  // Look up the registry entry for the widget currently being dragged
  // (used to render the DragOverlay ghost)
  const activeWidget = activeId ? registryMap[activeId] : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── Toolbar ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Typography variant="h6" fontWeight={700}>Dashboard</Typography>

        <Stack direction="row" spacing={1}>
          {/* These buttons only appear in edit mode */}
          {isEditMode && (
            <>
              {/* Add Widget button — badge shows how many hidden widgets exist */}
              <Tooltip title="Add a removed widget back">
                <span> {/* span wrapper needed because Tooltip can't wrap a disabled Button directly */}
                  <Button
                    size="small" variant="outlined" startIcon={<AddIcon />}
                    onClick={() => setAddPanelOpen(true)}
                    disabled={availableWidgets.length === 0}
                  >
                    Add Widget
                    {/* Pill badge showing available count */}
                    {availableWidgets.length > 0 && (
                      <Box component="span" sx={{ ml: 0.8, bgcolor: "primary.main", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                        {availableWidgets.length}
                      </Box>
                    )}
                  </Button>
                </span>
              </Tooltip>

              {/* Reset button — restores DEFAULT_LAYOUT */}
              <Button size="small" variant="outlined" startIcon={<RestartAltIcon />} onClick={resetLayout} color="warning">
                Reset
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={openNewMetricDialog}
              >
                New Metric
              </Button>
            </>
          )}

          {/* Customize / Done toggle button */}
          <Button
            size="small"
            variant={isEditMode ? "contained" : "outlined"}
            startIcon={isEditMode ? <EditOffIcon /> : <EditIcon />}
            onClick={() => { setIsEditMode((v) => !v); setAddPanelOpen(false); }}
            color={isEditMode ? "primary" : "inherit"}
            sx={!isEditMode ? { borderColor: "divider", color: "text.secondary" } : {}}
          >
            {isEditMode ? "Done" : "Customize"}
          </Button>
        </Stack>
      </Stack>

      {/* ── Contextual Hint Banners ── */}

      {/* Edit mode instructions — only shown when customize is active */}
      {isEditMode && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: "primary.main" + "14", borderRadius: 2, border: "1px dashed", borderColor: "primary.main" + "44" }}>
          <Typography variant="caption" color="primary.light">
            ✏️ <strong>Edit mode</strong> — drag ⠿ to reorder · click ✕ to remove · <strong>Add Widget</strong> to restore hidden ones
          </Typography>
        </Box>
      )}

      {/* ── Drag-and-Drop Grid ── */}
      {/*
        DndContext wraps the entire grid. It listens for drag events and
        coordinates between the sortable items and the DragOverlay.
        closestCenter is the collision algorithm: each dragged item snaps
        to whichever sortable item's centre is nearest to the cursor.
      */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/*
          SortableContext tells dnd-kit the current sort order (via `items`).
          rectSortingStrategy handles 2D grid reordering — items can move
          both horizontally and vertically, unlike a list-only strategy.
        */}
        <SortableContext
          items={activeWidgets.map((w) => w.id)} // must be an array of IDs
          strategy={rectSortingStrategy}
        >
          {/*
            The CSS grid container — 12 equal columns with a gap.
            Each DraggableWidget sets its own gridColumn: `span N` to take
            up the right number of columns.
            gridRef is passed so widgets can measure column pixel width for resize.
          */}
          <Box
            ref={gridRef}
            sx={{
              display:               "grid",
              gridTemplateColumns:   "repeat(12, 1fr)",
              gap:                   2,
              alignItems:            "start", // widgets don't stretch to match each other's height
            }}
          >
            {activeWidgets.map(({ id: widgetId, w }) => {
              const def = registryMap[widgetId];
              if (!def) return null; // skip any ID not in the registry

              const Component = def.component;
              return (
                <DraggableWidget
                  key={widgetId}
                  id={widgetId}
                  label={def.label}
                  icon={def.icon}
                  isStatCard={def.isStatCard}
                  colSpan={w}                    // current column span from layout state
                  minW={def.minW}                // minimum allowed width for resize
                  isEditMode={isEditMode}
                  onRemove={removeWidget}
                  onResize={setWidgetWidth}      // called live during resize drag
                  gridRef={gridRef}              // so widget can measure column width
                >
                  {/* Render the actual widget content, passing analytics + categories */}
                  <Component analytics={analytics} categories={categories} />
                </DraggableWidget>
              );
            })}
          </Box>
        </SortableContext>

        {/*
          DragOverlay renders a floating card that follows the cursor during a drag.
          It's rendered outside the grid so it appears above all other elements.
          The actual widget becomes translucent (opacity 0.35 in DraggableWidget)
          while this ghost is visible.
        */}
        <DragOverlay>
          {activeWidget ? (
            <Box sx={{
              bgcolor: "background.paper", border: "2px solid", borderColor: "primary.main",
              borderRadius: 3, p: 2, opacity: 0.9, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", gap: 1, minWidth: 160,
            }}>
              <Typography fontSize={20}>{activeWidget.icon}</Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {activeWidget.label}
              </Typography>
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Custom Metrics Section ── */}
      {customMetrics.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: "text.secondary" }}>
            Custom metrics
          </Typography>
          <Box
            sx={{
              display:             "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              gap:                 2,
            }}
          >
            {customMetrics.map((m) => {
              const value = evaluateFormula(m.formula, analytics);
              let display = "—";
              if (value !== null) {
                if (m.format === "currency") {
                  display = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);
                } else if (m.format === "percent") {
                  display = `${value.toFixed(1)}%`;
                } else {
                  display = value.toString();
                }
              }

              return (
                <Card key={m.id} elevation={0}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color:         "text.disabled",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontWeight:    600,
                        }}
                      >
                        {m.name}
                      </Typography>
                      <Typography fontSize={22}>{m.icon || "🧮"}</Typography>
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 700,
                      }}
                    >
                      {display}
                    </Typography>
                    {value === null && (
                      <Typography variant="caption" sx={{ color: "error.main" }}>
                        Error evaluating formula
                      </Typography>
                    )}
                    {isEditMode && (
                      <Box sx={{ mt: 1.5, textAlign: "right" }}>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRemoveMetric(m.id)}
                        >
                          Remove
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* ── Add Widget Drawer ── */}
      {/* Slides in from the right when the user clicks "Add Widget" */}
      <AddWidgetPanel
        open={addPanelOpen}
        onClose={() => setAddPanelOpen(false)}
        availableWidgets={availableWidgets}
        onAdd={addWidget}
      />
      {/* ── New Metric Dialog ── */}
      <Dialog open={metricDialogOpen} onClose={() => setMetricDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create custom metric</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <TextField
            label="Name"
            fullWidth
            margin="dense"
            value={metricDraft.name}
            onChange={(e) => handleMetricDraftChange("name", e.target.value)}
          />
          <TextField
            label="Icon (emoji)"
            fullWidth
            margin="dense"
            value={metricDraft.icon}
            onChange={(e) => handleMetricDraftChange("icon", e.target.value)}
          />
          <TextField
            label="Formula"
            fullWidth
            margin="dense"
            multiline
            minRows={2}
            value={metricDraft.formula}
            onChange={(e) => handleMetricDraftChange("formula", e.target.value)}
            helperText="Use: income, expenses, net, count, months, categories and Math.* (e.g. (income - expenses) / income * 100)"
          />
          <TextField
            label="Format"
            select
            fullWidth
            margin="dense"
            value={metricDraft.format}
            onChange={(e) => handleMetricDraftChange("format", e.target.value)}
          >
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="currency">Currency</MenuItem>
            <MenuItem value="percent">Percent</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetricDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveMetric}
            variant="contained"
            disabled={!metricDraft.name.trim() || !metricDraft.formula.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/**
 * Skeleton placeholder shown while analytics data is loading.
 * Mimics the approximate layout of the default dashboard to reduce layout shift.
 */
function LoadingSkeleton() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
      {/* Mimic: 4 stat cards (span 3 each), area chart (span 8), pie (span 4), full-width bar */}
      {[3, 3, 3, 3, 8, 4, 12].map((span, i) => (
        <Box key={i} sx={{ gridColumn: `span ${span}` }}>
          <Card elevation={0}>
            <CardContent>
              {/* Stat cards are shorter; chart cards are taller */}
              <Skeleton variant="rectangular" height={i < 4 ? 90 : 220} />
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
}
