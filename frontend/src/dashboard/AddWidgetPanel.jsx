/**
 * AddWidgetPanel.jsx — Slide-In Widget Picker Drawer
 * ─────────────────────────────────────────────────────────────────────────────
 * A MUI Drawer that slides in from the right edge of the screen when the
 * user clicks "Add Widget" in Dashboard edit mode.
 *
 * It lists every widget that is NOT currently on the dashboard (the
 * `availableWidgets` prop, derived in useDashboardLayout from the registry).
 * Clicking any item calls onAdd(id), which adds it to the layout and
 * persists the change to localStorage.
 *
 * The panel closes automatically when the user clicks outside it (MUI Drawer
 * default behaviour via the onClose prop).
 *
 * PROPS:
 *   open             {boolean}   — whether the drawer is visible
 *   onClose          {Function}  — called to close the drawer (clicks outside, ESC key)
 *   availableWidgets {Widget[]}  — widgets not on the dashboard (from widgetRegistry)
 *   onAdd            {Function}  — (id: string) => void — adds a widget to the layout
 */

import React from "react";
import {
  Drawer, Box, Typography, IconButton, Divider,
  List, ListItem, ListItemButton, ListItemText, ListItemIcon,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

export default function AddWidgetPanel({ open, onClose, availableWidgets, onAdd }) {
  return (
    <Drawer
      anchor="right"    // slides in from the right edge
      open={open}
      onClose={onClose} // handles ESC key and backdrop clicks automatically
      PaperProps={{
        sx: {
          width:       300,
          bgcolor:     "background.paper",
          borderLeft:  "1px solid",
          borderColor: "divider",
          p:           0,
        },
      }}
    >
      {/* ── Panel Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, pb: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>Add Widget</Typography>
        {/* Close button in the top-right corner */}
        <IconButton size="small" onClick={onClose} sx={{ color: "text.disabled" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      {/* ── Widget List or Empty State ── */}
      {availableWidgets.length === 0 ? (
        // Shown when every widget in the registry is already on the dashboard
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography fontSize={36} mb={1}>✅</Typography>
          <Typography variant="body2" color="text.secondary">
            All widgets are on the dashboard
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="caption" color="text.disabled" sx={{ px: 2, pt: 2, display: "block" }}>
            Click a widget to add it to the dashboard
          </Typography>

          <List dense>
            {availableWidgets.map((w) => (
              <ListItem key={w.id} disablePadding>
                <ListItemButton
                  onClick={() => onAdd(w.id)} // add widget and keep panel open so user can add more
                  sx={{ borderRadius: 1, mx: 1, "&:hover": { bgcolor: "primary.main" + "18" } }}
                >
                  {/* Widget emoji icon */}
                  <ListItemIcon sx={{ minWidth: 36, fontSize: 20 }}>
                    {w.icon}
                  </ListItemIcon>

                  {/* Widget name */}
                  <ListItemText
                    primary={w.label}
                    primaryTypographyProps={{ variant: "body2", fontWeight: 500, color: "text.primary" }}
                  />

                  {/* Plus icon on the right signals the add action */}
                  <AddCircleOutlineIcon fontSize="small" sx={{ color: "primary.main" }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* ── Footer Hint ── */}
      {/* Pushed to the bottom of the drawer with mt: "auto" */}
      <Divider sx={{ mt: "auto" }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.disabled">
          Drag widgets to reorder them. Your layout is saved automatically.
        </Typography>
      </Box>
    </Drawer>
  );
}
