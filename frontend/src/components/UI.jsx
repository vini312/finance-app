/**
 * UI.jsx — Shared Primitive Components
 * ─────────────────────────────────────────────────────────────────────────────
 * Small, reusable building blocks used across multiple pages.
 * Keeping them here avoids duplication and makes visual consistency easy to maintain.
 *
 * Exports:
 *   StatCard         — a metric card with label, big number, optional subtitle
 *   CategoryChip     — a coloured pill badge displaying a category's icon + name
 *   CHART_TOOLTIP_STYLE — shared Recharts tooltip styling object
 */

import React from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";

// ── StatCard ─────────────────────────────────────────────────────────────────

/**
 * A dashboard metric card showing a key number (income, expenses, etc.).
 *
 * Layout:
 *   ┌─────────────────────────────┐
 *   │ LABEL               icon    │
 *   │ $1,234.56                   │
 *   │ subtitle text (optional)    │
 *   └─────────────────────────────┘
 *
 * @param {string}  label - Small uppercase label above the value (e.g. "TOTAL INCOME")
 * @param {string}  value - The main display value (e.g. "$1,234.56" or "47")
 * @param {string}  [sub] - Optional subtitle below the value (e.g. "47 transactions")
 * @param {string}  [color] - CSS colour for the value text (green for income, red for expenses)
 * @param {string}  icon  - Emoji displayed top-right of the card
 */
export function StatCard({ label, value, sub, color, icon }) {
  return (
    <Card elevation={0}>
      <CardContent>
        {/* Top row: label on the left, icon on the right */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color:         "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.08em",  // wide tracking makes small caps more readable
              fontWeight:    600,
            }}
          >
            {label}
          </Typography>
          <Typography fontSize={22}>{icon}</Typography>
        </Box>

        {/* Main value — monospace font so currency digits align vertically */}
        <Typography
          variant="h5"
          sx={{
            fontFamily: "'IBM Plex Mono', monospace",
            color:      color || "text.primary", // custom colour or fall back to default
            fontWeight: 700,
            mb:         0.5,
          }}
        >
          {value}
        </Typography>

        {/* Optional subtitle line — conditionally rendered */}
        {sub && (
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ── CategoryChip ─────────────────────────────────────────────────────────────

/**
 * A small pill badge that displays a category's emoji icon and name.
 * The background and border colours are derived from the category's colour
 * with added transparency (hex alpha "22" = 13%, "44" = 27%).
 *
 * @param {Object} category - A category object { icon, name, color }
 */
export function CategoryChip({ category }) {
  return (
    <Chip
      label={`${category.icon} ${category.name}`}
      size="small"
      sx={{
        bgcolor: category.color + "22",                    // category colour at ~13% opacity
        color:   category.color,                           // full-opacity text
        border:  `1px solid ${category.color}44`,          // category colour at ~27% opacity
        fontWeight: 600,
        fontSize:   12,
        cursor:     "pointer", // signals the chip is clickable (for re-categorisation)
      }}
    />
  );
}

// ── Chart Tooltip Style ──────────────────────────────────────────────────────

/**
 * Shared Recharts tooltip configuration.
 * Spread this onto any <Tooltip> component to apply a consistent dark style.
 *
 * Usage:
 *   <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
 */
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background:   "#1a1f2e",     // matches theme background.paper
    border:       "1px solid #2a3048", // matches theme divider colour
    borderRadius: 8,
    color:        "#c8d0e7",     // matches theme text.primary
    fontSize:     13,
  },
};
