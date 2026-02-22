/**
 * Dashboard.jsx
 *
 * Drag-and-drop + border-resize customizable widget grid.
 *
 * Resize UX:
 *  - Every widget has a 6px invisible right-border handle (cursor: col-resize)
 *  - Dragging it snaps to 1/12 column increments, live, with a "3 / 12 col" badge
 *  - Works always (not gated behind edit mode)
 *
 * Drag-to-reorder UX:
 *  - Click "Customize" to enter edit mode
 *  - Drag handle (⠿) appears in the widget header to move it
 *  - X button removes the widget
 *  - "Add Widget" drawer restores removed ones
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
  Box, Button, Paper, Typography, Skeleton, Card, CardContent,
  Stack, Tooltip,
} from "@mui/material";
import EditIcon       from "@mui/icons-material/Edit";
import EditOffIcon    from "@mui/icons-material/EditOff";
import AddIcon        from "@mui/icons-material/Add";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import { api }                    from "../api/api";
import { WIDGET_REGISTRY }        from "../dashboard/widgetRegistry";
import { useDashboardLayout }     from "../dashboard/useDashboardLayout";
import DraggableWidget            from "../dashboard/DraggableWidget";
import AddWidgetPanel             from "../dashboard/AddWidgetPanel";

const registryMap = Object.fromEntries(WIDGET_REGISTRY.map((w) => [w.id, w]));

export default function Dashboard({ categories, refresh }) {
  const [analytics,    setAnalytics]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [isEditMode,   setIsEditMode]   = useState(false);
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [activeId,     setActiveId]     = useState(null);

  // ref to the grid DOM element so resize handle can measure column width
  const gridRef = useRef(null);

  const {
    activeWidgets, availableWidgets,
    reorder, addWidget, removeWidget, setWidgetWidth, resetLayout,
  } = useDashboardLayout();

  // ── Data ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.getAnalytics().catch(() => null);
    setAnalytics(data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load, refresh]);

  // ── DnD (reordering only — resize is handled separately via mouse events) ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart({ active }) { setActiveId(active.id); }
  function handleDragEnd({ active, over }) {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = activeWidgets.findIndex((w) => w.id === active.id);
    const newIndex  = activeWidgets.findIndex((w) => w.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) reorder(oldIndex, newIndex);
  }

  // ── States ──────────────────────────────────────────────────────────────────
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

  const activeWidget = activeId ? registryMap[activeId] : null;

  return (
    <Box>
      {/* Toolbar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Typography variant="h6" fontWeight={700}>Dashboard</Typography>
        <Stack direction="row" spacing={1}>
          {isEditMode && (
            <>
              <Tooltip title="Add a removed widget back">
                <span>
                  <Button
                    size="small" variant="outlined" startIcon={<AddIcon />}
                    onClick={() => setAddPanelOpen(true)}
                    disabled={availableWidgets.length === 0}
                  >
                    Add Widget
                    {availableWidgets.length > 0 && (
                      <Box component="span" sx={{ ml: 0.8, bgcolor: "primary.main", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                        {availableWidgets.length}
                      </Box>
                    )}
                  </Button>
                </span>
              </Tooltip>
              <Button size="small" variant="outlined" startIcon={<RestartAltIcon />} onClick={resetLayout} color="warning">
                Reset
              </Button>
            </>
          )}
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

      {/* Hint banners */}
      {isEditMode && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: "primary.main" + "14", borderRadius: 2, border: "1px dashed", borderColor: "primary.main" + "44" }}>
          <Typography variant="caption" color="primary.light">
            ✏️ <strong>Edit mode</strong> — drag ⠿ to reorder · click ✕ to remove · <strong>Add Widget</strong> to restore hidden ones
          </Typography>
        </Box>
      )}
      <Box sx={{ mb: 2, p: 1.5, bgcolor: "divider", borderRadius: 2, opacity: 0.6 }}>
        <Typography variant="caption" color="text.disabled">
          ↔ Drag the right border of any widget to resize it
        </Typography>
      </Box>

      {/* Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activeWidgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <Box
            ref={gridRef}
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 2,
              alignItems: "start",
            }}
          >
            {activeWidgets.map(({ id: widgetId, w }) => {
              const def = registryMap[widgetId];
              if (!def) return null;
              const Component = def.component;
              return (
                <DraggableWidget
                  key={widgetId}
                  id={widgetId}
                  label={def.label}
                  icon={def.icon}
                  isStatCard={def.isStatCard}
                  colSpan={w}
                  minW={def.minW}
                  isEditMode={isEditMode}
                  onRemove={removeWidget}
                  onResize={setWidgetWidth}
                  gridRef={gridRef}
                >
                  <Component analytics={analytics} categories={categories} />
                </DraggableWidget>
              );
            })}
          </Box>
        </SortableContext>

        {/* Ghost shown at pointer while dragging to reorder */}
        <DragOverlay>
          {activeWidget ? (
            <Box sx={{ bgcolor: "background.paper", border: "2px solid", borderColor: "primary.main", borderRadius: 3, p: 2, opacity: 0.9, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 1, minWidth: 160 }}>
              <Typography fontSize={20}>{activeWidget.icon}</Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">{activeWidget.label}</Typography>
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddWidgetPanel
        open={addPanelOpen}
        onClose={() => setAddPanelOpen(false)}
        availableWidgets={availableWidgets}
        onAdd={addWidget}
      />
    </Box>
  );
}

function LoadingSkeleton() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
      {[3, 3, 3, 3, 8, 4, 12].map((span, i) => (
        <Box key={i} sx={{ gridColumn: `span ${span}` }}>
          <Card elevation={0}><CardContent><Skeleton variant="rectangular" height={i < 4 ? 90 : 220} /></CardContent></Card>
        </Box>
      ))}
    </Box>
  );
}
