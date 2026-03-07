/**
 * Header.jsx — Application Navigation Bar
 * ─────────────────────────────────────────────────────────────────────────────
 * A sticky top bar that contains:
 *   - The app logo / brand name
 *   - MUI Tabs for switching between the four main pages
 *   - Global action buttons (Export CSV, Clear All)
 *
 * STICKY POSITIONING:
 *   position="sticky" means the bar stays at the top of the viewport as the
 *   user scrolls down through long transaction lists or charts.
 *
 * PROPS:
 *   activeTab   {number}   — index of the currently visible tab (0–3)
 *   onTabChange {Function} — called with the new tab index when user clicks a tab
 *   onClearAll  {Function} — called when the "Clear All" button is clicked
 *   onExport    {Function} — called when "Export CSV" is clicked
 */

import React from "react";
import {
  AppBar, Toolbar, Tabs, Tab, Button, Box, Typography, Stack,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CategoryIcon from "@mui/icons-material/Category";

/**
 * Tab definitions — label, icon, and implicit index (0, 1, 2, 3).
 * Adding a tab here automatically adds it to the navigation.
 * Remember to also add its page component to the `pages` array in App.jsx.
 */
const TABS = [
  { label: "Dashboard",    icon: <DashboardIcon  fontSize="small" /> },
  { label: "Transactions", icon: <ListAltIcon     fontSize="small" /> },
  { label: "Upload",       icon: <UploadFileIcon  fontSize="small" /> },
  { label: "Categories",   icon: <CategoryIcon    fontSize="small" /> },
];

export default function Header({ activeTab, onTabChange, onClearAll, onExport }) {
  return (
    // elevation={0} removes the default drop shadow — we use a border instead
    // bgcolor="background.paper" uses the theme's card background (slightly lighter than page)
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
      <Toolbar sx={{ gap: 2, px: { xs: 2, md: 4 } }}>

        {/* ── Logo ── */}
        {/* Gradient text via background-clip trick — not directly supported in CSS,
            but widely supported in modern browsers */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            background: "linear-gradient(135deg, #7c6af7, #4ecdc4)", // purple → teal
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
            mr: 2,
            whiteSpace: "nowrap", // prevent the logo from wrapping on small screens
          }}
        >
          💹 FinanceFlow
        </Typography>

        {/* ── Navigation Tabs ── */}
        {/* flexGrow: 1 pushes the action buttons to the far right */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => onTabChange(v)} // MUI Tab passes (event, value) — we only need value
          textColor="primary"
          indicatorColor="primary"
          sx={{ flexGrow: 1 }}
        >
          {TABS.map((t) => (
            // iconPosition="start" puts the icon to the left of the label
            <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>

        {/* ── Global Action Buttons ── */}
        <Stack direction="row" spacing={1}>
          {/* Export: opens the CSV download URL in a new browser tab */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={onExport}
            sx={{ borderColor: "divider", color: "text.secondary" }}
          >
            Export CSV
          </Button>

          {/* Clear All: destructive action styled in red to signal danger */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteSweepIcon />}
            onClick={onClearAll}
            color="error"
          >
            Clear All
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
