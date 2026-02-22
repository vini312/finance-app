/**
 * App.jsx — React 19 + MUI v7
 * No breaking changes from React 18 usage here.
 * ThemeProvider and CssBaseline API unchanged in MUI v7.
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
  const [tab, setTab] = useState(0);
  const [refresh, setRefresh] = useState(0);

  const { categories, refresh: refreshCategories } = useCategories();

  const bump = () => setRefresh((r) => r + 1);

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL transactions? This cannot be undone.")) return;
    await api.deleteAllTransactions().catch(() => {});
    bump();
  };

  const handleCategoryRefresh = () => { refreshCategories(); bump(); };

  const pages = [
    <Dashboard    key="dashboard"    categories={categories} refresh={refresh} />,
    <Transactions key="transactions" categories={categories} refresh={refresh} />,
    <Upload       key="upload"       onUploaded={bump} />,
    <Categories   key="categories"   categories={categories} onRefresh={handleCategoryRefresh} />,
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Header
          activeTab={tab}
          onTabChange={setTab}
          onClearAll={handleClearAll}
          onExport={() => window.open(api.exportURL())}
        />
        <Box component="main" sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
          {pages[tab]}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
