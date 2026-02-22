/**
 * App.jsx
 * Root component. Owns global state (active tab, refresh counter)
 * and delegates rendering to page components.
 */

import React, { useState } from "react";
import { api } from "./api/api";
import { useCategories } from "./hooks/useCategories";
import Header from "./components/Header";
import Dashboard   from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Upload      from "./pages/Upload";
import Categories  from "./pages/Categories";

export default function App() {
  const [tab,     setTab]     = useState("Dashboard");
  const [refresh, setRefresh] = useState(0);

  const { categories, refresh: refreshCategories } = useCategories();

  const bump = () => setRefresh((r) => r + 1);

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL transactions? This cannot be undone.")) return;
    await api.deleteAllTransactions().catch(() => {});
    bump();
  };

  const handleCategoryRefresh = () => {
    refreshCategories();
    bump();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", color: "#c8d0e7" }}>
      <Header activeTab={tab} onTabChange={setTab} onClearAll={handleClearAll} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {tab === "Dashboard"    && <Dashboard    categories={categories} refresh={refresh} />}
        {tab === "Transactions" && <Transactions categories={categories} refresh={refresh} />}
        {tab === "Upload"       && <Upload       onUploaded={bump} />}
        {tab === "Categories"   && <Categories   categories={categories} onRefresh={handleCategoryRefresh} />}
      </main>
    </div>
  );
}
