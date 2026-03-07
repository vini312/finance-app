/**
 * DraggableWidget.jsx — Sortable + Resizable Widget Shell
 * ─────────────────────────────────────────────────────────────────────────────
 * This component wraps each dashboard widget and provides two interaction modes:
 *
 * 1. DRAG TO REORDER (edit mode only):
 *    dnd-kit's useSortable hook makes the entire widget draggable.
 *    A drag handle icon (⠿) is shown in the card header to signal draggability.
 *    While dragging, the widget becomes translucent (opacity 0.35) and a
 *    ghost preview (DragOverlay in Dashboard.jsx) follows the cursor.
 *
 * 2. RESIZE BY DRAGGING THE RIGHT BORDER (always available):
 *    A 6px invisible strip sits on the right edge of every widget.
 *    When the user's mouse enters it, the cursor changes to col-resize (↔).
 *    Dragging it computes how many grid columns the movement represents and
 *    updates the widget width in real time — exactly like resizing a window in an OS.
 *
 * STAT CARDS vs CHART WIDGETS:
 *    Stat cards (isStatCard=true) render their own Card shell (via StatCard in UI.jsx).
 *    Chart widgets (isStatCard=false) get a full Card shell with a labelled header here.
 *    The resize handle and drag overlay work identically for both types.
 *
 * GRID INTEGRATION:
 *    The component sets gridColumn: `span ${effectiveW}` on its outer Box.
 *    The parent grid has gridTemplateColumns: "repeat(12, 1fr)" so a span of 6
 *    means the widget takes up exactly half the grid width.
 *
 * PROPS:
 *   id          {string}   — widget ID (passed to useSortable)
 *   label       {string}   — displayed in the card header
 *   icon        {string}   — emoji in the card header
 *   isStatCard  {boolean}  — whether the child manages its own Card shell
 *   colSpan     {number}   — current column width from layout state
 *   minW        {number}   — minimum allowed column width (enforced during resize)
 *   isEditMode  {boolean}  — whether drag handles and remove buttons are visible
 *   onRemove    {Function} — (id) => void — called when X button is clicked
 *   onResize    {Function} — (id, newW) => void — called during and after resize drag
 *   gridRef     {React.Ref} — ref to the grid container, used to measure column pixel width
 *   children    {ReactNode} — the widget's actual content component
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
  id, label, icon, isStatCard, colSpan, minW = 2,
  isEditMode, onRemove, onResize, gridRef, children,
}) {
  // ── dnd-kit Sortable Setup ───────────────────────────────────────────────
  // useSortable registers this element with the parent SortableContext.
  // It provides:
  //   setNodeRef  — attach to the DOM element so dnd-kit can track its position
  //   transform   — CSS transform to apply while dragging (moves the element visually)
  //   transition  — CSS transition string for smooth animation when elements shift
  //   isDragging  — true while this widget is the one being dragged
  //   listeners   — { onPointerDown, ... } spread onto the drag handle button
  //   attributes  — ARIA attributes for accessibility spread onto the drag handle
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id });

  // ── Resize State ─────────────────────────────────────────────────────────
  // liveW is non-null only during an active resize drag.
  // It holds the "in-progress" column span shown to the user before committing.
  const [liveW, setLiveW] = useState(null);

  // Ref stores the drag session data so event listeners can read it without
  // being recreated on every render (avoids stale closure issues)
  const resizeState = useRef(null); // { startX, startCols, colPx }

  // ── Resize Handle: Mouse Down Handler ────────────────────────────────────
  /**
   * Starts a resize drag session when the user presses down on the right border.
   *
   * COLUMN WIDTH MEASUREMENT:
   *   We read the grid container's actual pixel width at drag-start and divide
   *   by 12 to get the pixel width of one column. This is more accurate than
   *   a hardcoded value because it accounts for the current window size and
   *   any CSS gaps between columns.
   *
   * GLOBAL EVENT LISTENERS:
   *   We attach mousemove and mouseup to window (not the resize handle element)
   *   so the resize continues correctly even if the user moves the mouse very
   *   quickly and the cursor leaves the handle area. This is the same technique
   *   used by browser DevTools panel resizers and OS window chrome.
   */
  const handleResizeDown = useCallback((e) => {
    e.preventDefault(); // prevent text selection during drag
    e.stopPropagation(); // prevent the click from bubbling to the dnd-kit drag handler

    // Measure the pixel width of one grid column from the live DOM
    const grid  = gridRef?.current;
    const colPx = grid
      ? grid.getBoundingClientRect().width / 12
      : 80; // fallback if ref isn't available yet

    // Store session data in a ref so mousemove handler can read it
    resizeState.current = {
      startX:     e.clientX, // horizontal position where the drag started
      startCols:  colSpan,   // column span at the start of the drag
      colPx,                 // pixel width of one column
    };

    // Show the current width immediately so the badge appears right away
    setLiveW(colSpan);

    // Set global cursor to col-resize so it doesn't flicker back to the default
    // cursor when the mouse moves quickly off the handle
    document.body.style.cursor    = "col-resize";
    document.body.style.userSelect = "none"; // prevent text selection during drag

    // ── mousemove: update live width as the user drags ───────────────────
    const onMove = (ev) => {
      const { startX, startCols, colPx } = resizeState.current;

      // How far has the mouse moved from where the drag started?
      const deltaX = ev.clientX - startX;

      // Convert pixel delta to column delta, rounding to the nearest column
      const deltaCols = Math.round(deltaX / colPx);

      // Apply delta to the starting column count and clamp to valid range
      const newW = Math.max(minW, Math.min(12, startCols + deltaCols));

      // Update the live display — this changes gridColumn span in real time
      setLiveW(newW);
    };

    // ── mouseup: commit the final width and clean up ─────────────────────
    const onUp = (ev) => {
      // Restore normal cursor and text selection behaviour
      document.body.style.cursor    = "";
      document.body.style.userSelect = "";

      // Remove the temporary global listeners
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);

      // Calculate the final width one more time (in case mouseup fires
      // at a different position than the last mousemove)
      const { startX, startCols, colPx } = resizeState.current;
      const deltaX    = ev.clientX - startX;
      const deltaCols = Math.round(deltaX / colPx);
      const newW      = Math.max(minW, Math.min(12, startCols + deltaCols));

      resizeState.current = null; // clear session data
      setLiveW(null);             // exit live resize mode

      // Commit the final width to the layout state (persisted to localStorage)
      onResize(id, newW);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, [id, colSpan, minW, onResize, gridRef]);

  // ── Derived Values ───────────────────────────────────────────────────────

  // During a drag, show liveW. Otherwise show the committed colSpan.
  const effectiveW = liveW ?? colSpan;

  // True when a resize drag is in progress
  const isResizing = liveW !== null;

  // ── CSS Grid Style ───────────────────────────────────────────────────────
  // Applied to the outermost Box so the widget takes up the correct number
  // of columns in the CSS grid. gridColumn changes live during resize.
  const outerStyle = {
    transform:  CSS.Transform.toString(transform), // dnd-kit drag position
    transition: isDragging ? undefined : transition, // smooth snap animation (not during drag)
    gridColumn: `span ${effectiveW}`,              // ← this changes live during resize
    opacity:    isDragging ? 0.35 : 1,             // translucent while being dragged
    zIndex:     isDragging ? 50 : isResizing ? 40 : "auto", // float above siblings
    position:   "relative",                        // needed for absolute-positioned children
  };

  // ── Resize Handle Element ────────────────────────────────────────────────
  // An invisible 6px strip on the right edge of the widget.
  // The ::after pseudo-element shows a visible line on hover and during resize.
  const ResizeHandle = (
    <Box
      onMouseDown={handleResizeDown}
      title="Drag to resize"
      sx={{
        position: "absolute",
        top:      0,
        right:    -3,  // extends 3px outside the widget border on the right
        width:    6,   // total width: 3px inside + 3px outside the border
        bottom:   0,
        zIndex:   20,
        cursor:   "col-resize", // ↔ resize cursor on hover

        // The visible indicator line (shown on hover and while resizing)
        "&::after": {
          content:      '""',
          position:     "absolute",
          top:          "10%",   // doesn't extend to the very corners
          bottom:       "10%",
          left:         "50%",
          width:        isResizing ? 3 : 2,  // slightly wider while active
          transform:    "translateX(-50%)",   // centre within the handle
          borderRadius: 4,
          bgcolor:      isResizing ? "primary.main" : "transparent", // visible when resizing
          transition:   "background-color 0.15s, width 0.15s",
        },

        // Brighten the indicator on hover even when not resizing
        "&:hover::after": {
          bgcolor: "primary.main",
          width:   3,
        },
      }}
    />
  );

  // ── Column Badge ─────────────────────────────────────────────────────────
  // Shows "4 / 12 col" above the widget while a resize drag is in progress.
  // Helps the user know exactly where they'll land before releasing the mouse.
  const ColBadge = isResizing && (
    <Box
      sx={{
        position:     "absolute",
        top:          8,
        left:         "50%",
        transform:    "translateX(-50%)", // horizontally centred
        zIndex:       30,
        bgcolor:      "primary.main",
        color:        "#fff",
        borderRadius: 2,
        px:           1,
        py:           0.25,
        fontSize:     11,
        fontWeight:   700,
        fontFamily:   "monospace",
        pointerEvents: "none", // don't interfere with mouse events underneath
        boxShadow:    "0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      {effectiveW} / 12 col
    </Box>
  );

  // ── Stat Card Layout (no Card shell added here) ──────────────────────────
  // Stat cards wrap themselves in a Card via StatCard in UI.jsx.
  // We just add the resize handle, optional edit overlay, and badge.
  if (isStatCard) {
    return (
      <Box ref={setNodeRef} style={outerStyle}>
        <Box sx={{ position: "relative" }}>
          {ResizeHandle}
          {ColBadge}

          {/* Dashed border outline shown in edit mode to indicate draggability */}
          {isEditMode && (
            <Box sx={{
              position: "absolute", inset: 0, zIndex: 10,
              borderRadius: 2, border: "1px dashed", borderColor: "primary.main",
              pointerEvents: "none", // overlay shouldn't block clicks on the card
            }} />
          )}

          {/* Drag and remove buttons shown in edit mode */}
          {isEditMode && (
            <Box sx={{ position: "absolute", top: 4, right: 8, zIndex: 15, display: "flex", gap: 0.5 }}>
              <IconButton
                size="small"
                {...listeners} {...attributes} // spread dnd-kit props onto the handle
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

          {/* The actual widget content (e.g. StatCard) */}
          {children}
        </Box>
      </Box>
    );
  }

  // ── Chart / List Widget Layout (Card shell added here) ───────────────────
  return (
    <Box ref={setNodeRef} style={outerStyle}>
      <Card
        elevation={0}
        sx={{
          height:      "100%",
          // Highlight the border in primary colour while dragging or resizing
          borderColor: (isResizing || isDragging) ? "primary.main" : "divider",
          transition:  "border-color 0.15s",
          position:    "relative", // needed for ResizeHandle absolute positioning
          overflow:    "visible",  // allow the resize handle to extend outside the card border
        }}
      >
        {ResizeHandle}
        {ColBadge}

        {/* ── Card Header ── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pt: 2, pb: 0 }}>
          <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 700 }}>
            {icon} {label}
          </Typography>

          {/* Drag handle and remove button — only visible in edit mode */}
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
                <IconButton
                  size="small"
                  onClick={() => onRemove(id)}
                  sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* ── Card Content ── */}
        <CardContent sx={{ pt: 1.5 }}>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}
