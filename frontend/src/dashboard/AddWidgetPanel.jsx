/**
 * AddWidgetPanel.jsx
 *
 * A slide-in drawer listing all widgets not currently on the dashboard.
 * Users can click any widget to add it back.
 */

import React from "react";
import {
  Drawer, Box, Typography, IconButton, Divider,
  List, ListItem, ListItemButton, ListItemText, ListItemIcon,
  Tooltip, Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

export default function AddWidgetPanel({ open, onClose, availableWidgets, onAdd }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 300,
          bgcolor: "background.paper",
          borderLeft: "1px solid",
          borderColor: "divider",
          p: 0,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, pb: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>Add Widget</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "text.disabled" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      {/* Widget list */}
      {availableWidgets.length === 0 ? (
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
                  onClick={() => { onAdd(w.id); }}
                  sx={{ borderRadius: 1, mx: 1, "&:hover": { bgcolor: "primary.main" + "18" } }}
                >
                  <ListItemIcon sx={{ minWidth: 36, fontSize: 20 }}>
                    {w.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={w.label}
                    primaryTypographyProps={{ variant: "body2", fontWeight: 500, color: "text.primary" }}
                  />
                  <AddCircleOutlineIcon fontSize="small" sx={{ color: "primary.main" }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      <Divider sx={{ mt: "auto" }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.disabled">
          Drag widgets to reorder them. Your layout is saved automatically.
        </Typography>
      </Box>
    </Drawer>
  );
}
