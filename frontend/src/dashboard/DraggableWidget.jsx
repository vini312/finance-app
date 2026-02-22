/**
 * DraggableWidget.jsx
 *
 * Sortable + resizable wrapper for each dashboard widget.
 *
 * Resizing works exactly like OS window resizing:
 *  - A 6px invisible border strip sits on the right edge of every widget
 *  - Hovering it shows a col-resize cursor (↔)
 *  - Dragging it snaps to the nearest 1/12 column boundary in real time
 *  - A live blue highlight shows the current snap target while dragging
 *  - On mouse-up the new width is committed to state + localStorage
 *  - Works in both edit mode and normal mode (resize always available)
 */

import React, { useRef, useCallback, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS }         from "@dnd-kit/utilities";
import {
  Card, CardContent, Box, Typography, IconButton, Tooltip,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CloseIcon         from "@mui/icons-material/Close";

export default function DraggableWidget({
  id,
  label,
  icon,
  isStatCard,
  colSpan,
  minW = 2,
  isEditMode,
  onRemove,
  onResize,        // (id, newColSpan) => void
  gridRef,         // ref to the grid container element (to measure column width)
  children,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Live resize state — only non-null while a resize drag is in progress
  const [liveW, setLiveW] = useState(null);
  const resizeState = useRef(null); // { startX, startCols, colPx }

  // ── Resize handle: mousedown ────────────────────────────────────────────────
  const handleResizeDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // Measure the pixel width of one grid column from the live grid element
    const grid = gridRef?.current;
    const colPx = grid
      ? grid.getBoundingClientRect().width / 12
      : 80; // fallback

    resizeState.current = { startX: e.clientX, startCols: colSpan, colPx };
    setLiveW(colSpan);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev) => {
      const { startX, startCols, colPx } = resizeState.current;
      const deltaX    = ev.clientX - startX;
      const deltaCols = Math.round(deltaX / colPx);
      const newW      = Math.max(minW, Math.min(12, startCols + deltaCols));
      setLiveW(newW);
    };

    const onUp = (ev) => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);

      const { startX, startCols, colPx } = resizeState.current;
      const deltaX    = ev.clientX - startX;
      const deltaCols = Math.round(deltaX / colPx);
      const newW      = Math.max(minW, Math.min(12, startCols + deltaCols));
      resizeState.current = null;
      setLiveW(null);
      onResize(id, newW);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, [id, colSpan, minW, onResize, gridRef]);

  const effectiveW = liveW ?? colSpan;
  const isResizing = liveW !== null;

  const outerStyle = {
    transform:  CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    gridColumn: `span ${effectiveW}`,
    opacity:    isDragging ? 0.35 : 1,
    zIndex:     isDragging ? 50 : isResizing ? 40 : "auto",
    position:   "relative",
    // Smoothly animate column span changes when NOT dragging/resizing
    ...(isResizing ? {} : { transition: `${transition || ""}, grid-column 0.1s ease` }),
  };

  // Shared resize handle element (right border strip)
  const ResizeHandle = (
    <Box
      onMouseDown={handleResizeDown}
      title="Drag to resize"
      sx={{
        position:  "absolute",
        top:       0,
        right:     -3,
        width:     6,
        bottom:    0,
        zIndex:    20,
        cursor:    "col-resize",
        // Show a subtle visual indicator on hover / while resizing
        "&::after": {
          content:  '""',
          position: "absolute",
          top:      "10%",
          bottom:   "10%",
          left:     "50%",
          width:    isResizing ? 3 : 2,
          transform: "translateX(-50%)",
          borderRadius: 4,
          bgcolor:  isResizing ? "primary.main" : "transparent",
          transition: "background-color 0.15s, width 0.15s",
        },
        "&:hover::after": {
          bgcolor: "primary.main",
          width:   3,
        },
      }}
    />
  );

  // Column badge shown while actively resizing
  const ColBadge = isResizing && (
    <Box
      sx={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 30,
        bgcolor: "primary.main",
        color: "#fff",
        borderRadius: 2,
        px: 1,
        py: 0.25,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "monospace",
        pointerEvents: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      {effectiveW} / 12 col
    </Box>
  );

  // ── Stat cards (supply their own Card shell) ────────────────────────────────
  if (isStatCard) {
    return (
      <Box ref={setNodeRef} style={outerStyle}>
        <Box sx={{ position: "relative" }}>
          {ResizeHandle}
          {ColBadge}
          {isEditMode && (
            <Box
              sx={{
                position: "absolute", inset: 0, zIndex: 10,
                borderRadius: 2,
                border: "1px dashed", borderColor: "primary.main",
                pointerEvents: "none",
              }}
            />
          )}
          {isEditMode && (
            <Box sx={{ position: "absolute", top: 4, right: 8, zIndex: 15, display: "flex", gap: 0.5 }}>
              <IconButton
                size="small"
                {...listeners} {...attributes}
                sx={{ bgcolor: "background.paper", cursor: "grab", p: 0.4, "&:active": { cursor: "grabbing" } }}
              >
                <DragIndicatorIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onRemove(id)}
                sx={{ bgcolor: "background.paper", p: 0.4, "&:hover": { color: "error.main" } }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          )}
          {children}
        </Box>
      </Box>
    );
  }

  // ── Chart / list widgets (full Card shell) ──────────────────────────────────
  return (
    <Box ref={setNodeRef} style={outerStyle}>
      <Card
        elevation={0}
        sx={{
          height: "100%",
          borderColor: (isResizing || isDragging) ? "primary.main" : "divider",
          transition: "border-color 0.15s",
          position: "relative",
          overflow: "visible",
        }}
      >
        {ResizeHandle}
        {ColBadge}

        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pt: 2, pb: 0 }}>
          <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 700 }}>
            {icon} {label}
          </Typography>

          {isEditMode && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip title="Drag to reorder">
                <IconButton
                  size="small"
                  {...listeners} {...attributes}
                  sx={{ cursor: "grab", color: "text.disabled", "&:active": { cursor: "grabbing" } }}
                >
                  <DragIndicatorIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove widget">
                <IconButton size="small" onClick={() => onRemove(id)} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        <CardContent sx={{ pt: 1.5 }}>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}
