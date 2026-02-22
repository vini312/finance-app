/**
 * Header.jsx — MUI AppBar with Tabs navigation.
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

const TABS = [
  { label: "Dashboard",    icon: <DashboardIcon  fontSize="small" /> },
  { label: "Transactions", icon: <ListAltIcon     fontSize="small" /> },
  { label: "Upload",       icon: <UploadFileIcon  fontSize="small" /> },
  { label: "Categories",   icon: <CategoryIcon    fontSize="small" /> },
];

export default function Header({ activeTab, onTabChange, onClearAll, onExport }) {
  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
      <Toolbar sx={{ gap: 2, px: { xs: 2, md: 4 } }}>
        {/* Logo */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            background: "linear-gradient(135deg, #7c6af7, #4ecdc4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
            mr: 2,
            whiteSpace: "nowrap",
          }}
        >
          💹 FinanceFlow
        </Typography>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => onTabChange(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ flexGrow: 1 }}
        >
          {TABS.map((t) => (
            <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>

        {/* Action buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={onExport}
            sx={{ borderColor: "divider", color: "text.secondary" }}
          >
            Export CSV
          </Button>
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
