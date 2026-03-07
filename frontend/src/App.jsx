/**
 * App.jsx — Root Application Component
 * ─────────────────────────────────────────────────────────────────────────────
 * The top of the React component tree. Its responsibilities are:
 *   1. Wrap the whole app in the MUI ThemeProvider (dark theme)
 *   2. Maintain the active tab index (which page is visible)
 *   3. Maintain a refresh counter that child pages subscribe to
 *   4. Fetch and own the categories list (shared across all pages)
 *   5. Handle the global "Clear All" and "Export CSV" actions from the header
 *
 * WHY LIFT CATEGORIES HERE?
 *   Categories are needed on both the Dashboard (pie chart colours) and the
 *   Transactions page (filter dropdown, chip display). Fetching once at the top
 *   and passing down via props avoids redundant network requests.
 *
 * WHY A REFRESH COUNTER?
 *   After uploading a CSV, clearing all data, or modifying categories we want
 *   child pages to re-fetch. Rather than a complex event bus, we simply
 *   increment a number. Each child page has `refresh` in its useEffect
 *   dependency array, so it re-runs its data fetch whenever the number changes.
 */

import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import theme from "./theme";
import { api } from "./api/api";
import { useCategories } from "./hooks/useCategories";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Upload from "./pages/Upload";
import Categories from "./pages/Categories";

export default function App() {
  // Which tab (page) is currently visible. 0 = Dashboard, 1 = Transactions, etc.
  const [tab, setTab]       = useState(0);

  // Incrementing this number tells child pages to re-fetch their data.
  // Child pages include `refresh` in their useEffect dependency array.
  const [refresh, setRefresh] = useState(0);

  // Fetch the shared categories list. `refresh` inside useCategories is its
  // own internal refresher; we expose it as refreshCategories.
  const { categories, refresh: refreshCategories } = useCategories();

  /** Increment the global refresh counter to trigger re-fetches in child pages */
  const bump = () => setRefresh((r) => r + 1);

  /**
   * Called when the user clicks "Clear All" in the Header.
   * Asks for confirmation, deletes all transactions, then bumps the counter
   * so the Dashboard and Transactions pages re-fetch and show empty states.
   */
  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL transactions? This cannot be undone.")) return;
    await api.deleteAllTransactions().catch(() => {}); // swallow errors gracefully
    bump();
  };

  /**
   * Called when a category is created or deleted.
   * We need to refresh both the category list AND all pages that display
   * category-related data (Dashboard pie chart, Transactions chips).
   */
  const handleCategoryRefresh = () => {
    refreshCategories(); // re-fetch the categories array
    bump();              // tell all pages to re-render with the new category data
  };

  // Pre-build all page components so the array index matches the tab index.
  // Using a key prop ensures React remounts the component if the tab changes,
  // preventing stale state from carrying over between pages.
  const pages = [
    <Dashboard    key="dashboard"    categories={categories} refresh={refresh} />,
    <Transactions key="transactions" categories={categories} refresh={refresh} />,
    <Upload       key="upload"       onUploaded={bump} />,
    <Categories   key="categories"   categories={categories} onRefresh={handleCategoryRefresh} />,
  ];

  return (
    // ThemeProvider injects our custom MUI dark theme into every child component
    <ThemeProvider theme={theme}>
      {/* CssBaseline normalises browser default styles (margin, box-sizing, etc.)
          and applies our theme's background colour to the <body> element */}
      <CssBaseline />

      {/* Full-height page wrapper with theme background colour */}
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        {/* Sticky top navigation bar */}
        <Header
          activeTab={tab}
          onTabChange={setTab}
          onClearAll={handleClearAll}
          onExport={() => window.open(api.exportURL())} // opens CSV download in new tab
        />

        {/* Page content area with max-width and responsive horizontal padding */}
        <Box component="main" sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
          {/* Render only the currently selected page */}
          {pages[tab]}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
