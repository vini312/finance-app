/**
 * theme.js — MUI v7 Custom Dark Theme
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines the global visual language for the entire application.
 * Every MUI component reads from this theme rather than using inline styles,
 * so changing a colour or font here updates the entire app at once.
 *
 * STRUCTURE:
 *   palette     — colours (backgrounds, text, accents, semantic colours)
 *   typography  — font family and heading weights
 *   shape       — global border-radius
 *   components  — per-component style overrides (the "slot" system)
 *
 * ADDING A NEW COLOUR:
 *   Add it to palette and reference it as "myColor.main" in sx props.
 *
 * OVERRIDING A COMPONENT GLOBALLY:
 *   Add an entry to `components` with the component's display name
 *   (e.g. MuiButton) and use `styleOverrides` to target its internal slots.
 */

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark", // tells MUI to use dark-mode defaults as the base

    // Primary accent — purple, used for buttons, active tabs, focus rings
    primary: { main: "#7c6af7", light: "#a99bf9", dark: "#5a4bd4" },

    // Secondary accent — teal, available for complementary highlights
    secondary: { main: "#4ecdc4" },

    // Semantic colours — MUI uses these for Alert severity and chip colours
    success: { main: "#6ee7a0" }, // green — income, positive balances
    error:   { main: "#ff8080" }, // red   — expenses, delete actions
    warning: { main: "#ffaa60" }, // amber — reset button, caution states

    background: {
      default: "#0d1117", // page background — very dark navy
      paper:   "#1a1f2e", // card / panel background — slightly lighter
    },

    divider: "#2a3048", // colour used for borders and separators

    text: {
      primary:  "#c8d0e7", // main readable text
      secondary: "#8892aa", // secondary labels, subtitles
      disabled:  "#5a6480", // placeholder text, inactive elements
    },
  },

  typography: {
    // IBM Plex Sans: clean, technical feel. Segoe UI as Windows fallback.
    fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    // Increase weight on headings so they stand out against dense data
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },

  shape: {
    // Global border radius applied to Cards, Buttons, Chips, etc.
    borderRadius: 12,
  },

  // ── Per-Component Style Overrides ──────────────────────────────────────────
  // These replace the MUI defaults for every instance of each component
  // across the entire app — no need to repeat sx props on every usage.
  components: {
    // Remove the default gradient on Paper so cards look flat and dark
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid #2a3048" },
      },
    },

    // Same treatment for Card (which is built on Paper)
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid #2a3048" },
      },
    },

    // Buttons: no uppercase transform (looks dated), slightly bolder text
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
      },
    },

    // Category chips: make label text a bit bolder and smaller
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: 12 },
      },
    },

    // Table header row: dark background, uppercase small-caps label style
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#111520",
            color:           "#5a6480",
            fontSize:        11,
            textTransform:   "uppercase",
            letterSpacing:   "0.06em",
            fontWeight:      600,
            borderBottom:    "1px solid #2a3048",
          },
        },
      },
    },

    // Table body cells: subtle borders and muted text colour
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: "1px solid #1e2440", color: "#8892aa" },
      },
    },

    // Table rows: alternating row colours (zebra striping) and hover highlight
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(odd)":  { backgroundColor: "#131829" }, // odd rows slightly lighter
          "&:nth-of-type(even)": { backgroundColor: "#111520" }, // even rows very dark
          "&:hover":             { backgroundColor: "#1e2440 !important" }, // !important overrides zebra
        },
      },
    },

    // Text input borders: subtle by default, primary colour on focus/hover
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& fieldset":       { borderColor: "#2a3048" }, // default border
          "&:hover fieldset": { borderColor: "#7c6af7" }, // hover border
        },
      },
    },

    // Dropdown arrow icon: muted colour to reduce visual clutter
    MuiSelect: {
      styleOverrides: { icon: { color: "#5a6480" } },
    },

    // Navigation tabs: no uppercase, slightly larger text, taller hit area
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500, fontSize: 14, minHeight: 56 },
      },
    },

    // Alert boxes (success/error/info): rounded corners to match the card style
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 10 } },
    },

    // Tooltip popups: dark card style instead of the default near-black blob
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
