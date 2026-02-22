/**
 * theme.js — MUI v7 dark theme
 *
 * MUI v7 changes applied:
 *  - createTheme API is backwards compatible
 *  - ThemeProvider now supports cssVariables flag (opt-in)
 *  - react-is peer dep pinned to match React 19 (handled by npm automatically)
 *  - Accordion summary now wrapped in <h3> by default (no code change needed here)
 */

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary:    { main: "#7c6af7", light: "#a99bf9", dark: "#5a4bd4" },
    secondary:  { main: "#4ecdc4" },
    success:    { main: "#6ee7a0" },
    error:      { main: "#ff8080" },
    warning:    { main: "#ffaa60" },
    background: { default: "#0d1117", paper: "#1a1f2e" },
    divider:    "#2a3048",
    text:       { primary: "#c8d0e7", secondary: "#8892aa", disabled: "#5a6480" },
  },
  typography: {
    fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid #2a3048" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid #2a3048" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: 12 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#111520",
            color: "#5a6480",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 600,
            borderBottom: "1px solid #2a3048",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: "1px solid #1e2440", color: "#8892aa" },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(odd)":  { backgroundColor: "#131829" },
          "&:nth-of-type(even)": { backgroundColor: "#111520" },
          "&:hover":             { backgroundColor: "#1e2440 !important" },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& fieldset":       { borderColor: "#2a3048" },
          "&:hover fieldset": { borderColor: "#7c6af7" },
        },
      },
    },
    MuiSelect: {
      styleOverrides: { icon: { color: "#5a6480" } },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500, fontSize: 14, minHeight: 56 },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#1a1f2e",
          border: "1px solid #2a3048",
          color: "#c8d0e7",
          fontSize: 12,
        },
      },
    },
  },
});

export default theme;
