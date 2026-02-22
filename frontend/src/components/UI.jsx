/**
 * UI.jsx — Shared MUI-based primitives.
 */

import React from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";

export function StatCard({ label, value, sub, color, icon }) {
  return (
    <Card elevation={0}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography variant="caption" sx={{ color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography fontSize={22}>{icon}</Typography>
        </Box>
        <Typography
          variant="h5"
          sx={{ fontFamily: "'IBM Plex Mono', monospace", color: color || "text.primary", fontWeight: 700, mb: 0.5 }}
        >
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" sx={{ color: "text.disabled" }}>{sub}</Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoryChip({ category }) {
  return (
    <Chip
      label={`${category.icon} ${category.name}`}
      size="small"
      sx={{
        bgcolor: category.color + "22",
        color: category.color,
        border: `1px solid ${category.color}44`,
        fontWeight: 600,
        fontSize: 12,
        cursor: "pointer",
      }}
    />
  );
}

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1a1f2e",
    border: "1px solid #2a3048",
    borderRadius: 8,
    color: "#c8d0e7",
    fontSize: 13,
  },
};
