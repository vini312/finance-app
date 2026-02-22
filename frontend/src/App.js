import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

// ── Palette ────────────────────────────────────────────────────────────────
const COLORS = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98FB98","#D3D3D3","#FFB347","#87CEEB"];
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

// ── API helpers ────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, opts);
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

// ── Components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: "#1a1f2e", border: "1px solid #2a3048", borderRadius: 16, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#8892aa", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || "#fff", fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: "#5a6480" }}>{sub}</div>}
    </div>
  );
}

function Badge({ children, color }) {
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}

function UploadZone({ onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const data = await fetch(API + "/api/transactions/upload", { method: "POST", body: fd }).then((r) => r.json());
      if (data.error) throw new Error(data.error);
      setResult(data);
      onUploaded();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${dragging ? "#7c6af7" : "#2a3048"}`,
          borderRadius: 16,
          padding: "48px 32px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "#7c6af710" : "#111520",
          transition: "all 0.2s",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#c8d0e7", marginBottom: 6 }}>
          {uploading ? "Uploading…" : "Drop your CSV file here"}
        </div>
        <div style={{ fontSize: 13, color: "#5a6480" }}>
          or click to browse · Supports standard bank exports
        </div>
        <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
      </div>
      {result && (
        <div style={{ marginTop: 12, padding: "14px 20px", borderRadius: 10, background: "#0d2e1e", border: "1px solid #1a5c35", color: "#6ee7a0", fontSize: 14 }}>
          ✅ Imported <strong>{result.imported}</strong> transactions
          {result.errors > 0 && <span style={{ color: "#ffaa60", marginLeft: 12 }}>⚠ {result.errors} rows skipped</span>}
        </div>
      )}
      {error && (
        <div style={{ marginTop: 12, padding: "14px 20px", borderRadius: 10, background: "#2e0d0d", border: "1px solid #5c1a1a", color: "#ff8080", fontSize: 14 }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
}

function TransactionsTable({ categories, refresh }) {
  const [txns, setTxns] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [type, setType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const load = useCallback(async () => {
    const params = new URLSearchParams({ search, categoryId, type, sortBy, sortDir });
    const data = await apiFetch("/api/transactions?" + params).catch(() => []);
    setTxns(data);
    setPage(1);
  }, [search, categoryId, type, sortBy, sortDir]);

  useEffect(() => { load(); }, [load, refresh]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await apiFetch("/api/transactions/" + id, { method: "DELETE" });
    load();
  };

  const handleCategoryChange = async (id, catId) => {
    await apiFetch("/api/transactions/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: catId }),
    });
    setEditId(null);
    load();
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const paginated = txns.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(txns.length / PER_PAGE);

  const SortIcon = ({ col }) => sortBy === col ? (sortDir === "desc" ? " ↓" : " ↑") : " ·";

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions…"
          style={inputStyle}
        />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
        <button onClick={() => { setSearch(""); setCategoryId("all"); setType("all"); }} style={ghostBtn}>
          Clear
        </button>
      </div>

      <div style={{ fontSize: 13, color: "#5a6480", marginBottom: 12 }}>{txns.length} transactions</div>

      <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #2a3048" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#111520" }}>
              {[["date","Date"],["description","Description"],["amount","Amount"]].map(([col,label]) => (
                <th key={col} onClick={() => toggleSort(col)} style={thStyle}>{label}<SortIcon col={col} /></th>
              ))}
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Balance</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#5a6480" }}>No transactions found</td></tr>
            )}
            {paginated.map((t, i) => {
              const cat = categories.find((c) => c.id === t.categoryId) || { name: "Other", color: "#888", icon: "📦" };
              const isIncome = t.amount > 0;
              return (
                <tr key={t.id} style={{ background: i % 2 === 0 ? "#131829" : "#111520", borderBottom: "1px solid #1e2440" }}>
                  <td style={tdStyle}>{fmtDate(t.date)}</td>
                  <td style={{ ...tdStyle, maxWidth: 300 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#c8d0e7" }}>{t.description}</div>
                    {t.source && <div style={{ fontSize: 11, color: "#3a4460" }}>{t.source}</div>}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono', monospace", color: isIncome ? "#6ee7a0" : "#ff8080", fontWeight: 600 }}>
                    {isIncome ? "+" : ""}{fmt(t.amount)}
                  </td>
                  <td style={tdStyle}>
                    {editId === t.id ? (
                      <select
                        autoFocus
                        defaultValue={t.categoryId}
                        onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                        onBlur={() => setEditId(null)}
                        style={{ ...inputStyle, padding: "4px 8px", fontSize: 12 }}
                      >
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                    ) : (
                      <span onClick={() => setEditId(t.id)} style={{ cursor: "pointer" }}>
                        <Badge color={cat.color}>{cat.icon} {cat.name}</Badge>
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono', monospace", color: "#5a6480", fontSize: 13 }}>
                    {t.balance != null ? fmt(t.balance) : "—"}
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => handleDelete(t.id)} style={{ background: "none", border: "none", color: "#ff6060", cursor: "pointer", fontSize: 16 }} title="Delete">🗑</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={ghostBtn}>← Prev</button>
          <span style={{ padding: "8px 12px", color: "#8892aa", fontSize: 13 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={ghostBtn}>Next →</button>
        </div>
      )}
    </div>
  );
}

function Dashboard({ categories, refresh }) {
  const [analytics, setAnalytics] = useState(null);

  const load = useCallback(async () => {
    const data = await apiFetch("/api/analytics").catch(() => null);
    setAnalytics(data);
  }, []);

  useEffect(() => { load(); }, [load, refresh]);

  if (!analytics) return <div style={{ color: "#5a6480", padding: 40, textAlign: "center" }}>Loading analytics…</div>;

  const pieData = analytics.byCategory.filter((c) => c.total > 0).slice(0, 8).map((c, i) => ({
    name: c.icon + " " + c.name,
    value: c.total,
    color: c.color || COLORS[i % COLORS.length],
  }));

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Income" value={fmt(analytics.totalIncome)} color="#6ee7a0" icon="💰" sub={`${analytics.transactionCount} transactions`} />
        <StatCard label="Total Expenses" value={fmt(analytics.totalExpenses)} color="#ff8080" icon="📉" />
        <StatCard label="Net Balance" value={fmt(analytics.netBalance)} color={analytics.netBalance >= 0 ? "#6ee7a0" : "#ff8080"} icon="⚖️" />
        <StatCard label="Transactions" value={analytics.transactionCount} icon="📋" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Area chart */}
        <div style={chartCard}>
          <h3 style={chartTitle}>Monthly Income vs Expenses</h3>
          {analytics.byMonth.length === 0 ? (
            <div style={{ color: "#5a6480", padding: 32, textAlign: "center" }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analytics.byMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ee7a0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6ee7a0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff8080" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff8080" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2440" />
                <XAxis dataKey="month" tick={{ fill: "#5a6480", fontSize: 11 }} />
                <YAxis tick={{ fill: "#5a6480", fontSize: 11 }} tickFormatter={(v) => "$" + (v >= 1000 ? (v/1000).toFixed(1) + "k" : v)} />
                <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #2a3048", borderRadius: 8, color: "#c8d0e7" }} formatter={(v) => fmt(v)} />
                <Area type="monotone" dataKey="income" stroke="#6ee7a0" fill="url(#incG)" strokeWidth={2} name="Income" />
                <Area type="monotone" dataKey="expenses" stroke="#ff8080" fill="url(#expG)" strokeWidth={2} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div style={chartCard}>
          <h3 style={chartTitle}>Spending by Category</h3>
          {pieData.length === 0 ? (
            <div style={{ color: "#5a6480", padding: 32, textAlign: "center" }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #2a3048", borderRadius: 8, color: "#c8d0e7" }} formatter={(v) => fmt(v)} />
                <Legend iconType="circle" formatter={(v) => <span style={{ color: "#8892aa", fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bar chart */}
      {analytics.byMonth.length > 0 && (
        <div style={chartCard}>
          <h3 style={chartTitle}>Monthly Net Cash Flow</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.byMonth.map((m) => ({ ...m, net: m.income - m.expenses }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2440" />
              <XAxis dataKey="month" tick={{ fill: "#5a6480", fontSize: 11 }} />
              <YAxis tick={{ fill: "#5a6480", fontSize: 11 }} tickFormatter={(v) => "$" + (v >= 1000 ? (v/1000).toFixed(1) + "k" : v)} />
              <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #2a3048", borderRadius: 8, color: "#c8d0e7" }} formatter={(v) => fmt(v)} />
              <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                {analytics.byMonth.map((m, i) => <Cell key={i} fill={(m.income - m.expenses) >= 0 ? "#6ee7a0" : "#ff8080"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top expenses */}
      {analytics.topExpenses.length > 0 && (
        <div style={{ ...chartCard, marginTop: 24 }}>
          <h3 style={chartTitle}>Top 5 Expenses</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {analytics.topExpenses.map((t, i) => {
              const cat = categories.find((c) => c.id === t.categoryId) || { name: "Other", color: "#888", icon: "📦" };
              return (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#111520", borderRadius: 8, border: "1px solid #1e2440" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{cat.icon}</span>
                    <div>
                      <div style={{ color: "#c8d0e7", fontSize: 14 }}>{t.description}</div>
                      <div style={{ color: "#5a6480", fontSize: 12 }}>{fmtDate(t.date)}</div>
                    </div>
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#ff8080", fontWeight: 700, fontSize: 15 }}>{fmt(t.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesManager({ categories, onRefresh }) {
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📁");
  const [newColor, setNewColor] = useState("#7c6af7");
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await apiFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), icon: newIcon, color: newColor }),
      });
      setNewName(""); setNewIcon("📁");
      onRefresh();
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? Transactions will move to 'Other'.")) return;
    await apiFetch("/api/categories/" + id, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div>
      <div style={{ ...chartCard, marginBottom: 24 }}>
        <h3 style={chartTitle}>Add Category</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="Emoji" style={{ ...inputStyle, width: 70 }} />
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name" style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ ...inputStyle, width: 50, padding: 4 }} />
          <button onClick={handleCreate} style={primaryBtn}>Add</button>
        </div>
        {error && <div style={{ color: "#ff8080", marginTop: 8, fontSize: 13 }}>{error}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {categories.map((cat) => (
          <div key={cat.id} style={{ background: "#1a1f2e", border: `1px solid ${cat.color}44`, borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
              <div>
                <div style={{ color: "#c8d0e7", fontWeight: 600, fontSize: 14 }}>{cat.name}</div>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: cat.color, marginTop: 4 }} />
              </div>
            </div>
            <button onClick={() => handleDelete(cat.id)} style={{ background: "none", border: "none", color: "#5a6480", cursor: "pointer", fontSize: 16 }}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const inputStyle = {
  background: "#1a1f2e", border: "1px solid #2a3048", borderRadius: 8,
  color: "#c8d0e7", padding: "10px 14px", fontSize: 14, outline: "none",
};
const ghostBtn = {
  background: "#1a1f2e", border: "1px solid #2a3048", borderRadius: 8,
  color: "#8892aa", padding: "10px 16px", fontSize: 13, cursor: "pointer",
};
const primaryBtn = {
  background: "#7c6af7", border: "none", borderRadius: 8,
  color: "#fff", padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 600,
};
const thStyle = {
  padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#5a6480",
  textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", userSelect: "none",
  borderBottom: "1px solid #1e2440",
};
const tdStyle = { padding: "12px 16px", fontSize: 14, color: "#8892aa", verticalAlign: "middle" };
const chartCard = { background: "#1a1f2e", border: "1px solid #2a3048", borderRadius: 16, padding: "24px 28px" };
const chartTitle = { margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#c8d0e7" };

// ── Main App ───────────────────────────────────────────────────────────────
const TABS = ["Dashboard", "Transactions", "Upload", "Categories"];

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [categories, setCategories] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [clearing, setClearing] = useState(false);

  const loadCategories = useCallback(async () => {
    const data = await apiFetch("/api/categories").catch(() => []);
    setCategories(data);
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories, refresh]);

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL transactions? This cannot be undone.")) return;
    setClearing(true);
    await apiFetch("/api/transactions", { method: "DELETE" }).catch(() => {});
    setClearing(false);
    setRefresh(r => r + 1);
  };

  const handleExport = () => { window.open(API + "/api/export"); };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", color: "#c8d0e7" }}>
      {/* Header */}
      <header style={{ background: "#111520", borderBottom: "1px solid #1e2440", padding: "0 32px", display: "flex", alignItems: "center", gap: 0, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 22, padding: "20px 0" }}>
            <span style={{ fontWeight: 800, background: "linear-gradient(135deg, #7c6af7, #4ecdc4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              💹 FinanceFlow
            </span>
          </div>
          <nav style={{ display: "flex", gap: 4, marginLeft: 24 }}>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? "#7c6af722" : "none",
                  border: "none",
                  color: tab === t ? "#7c6af7" : "#5a6480",
                  padding: "8px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: tab === t ? 600 : 400,
                }}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleExport} style={ghostBtn}>⬇ Export CSV</button>
          <button onClick={handleClearAll} disabled={clearing} style={{ ...ghostBtn, color: "#ff8080", borderColor: "#5c1a1a" }}>
            {clearing ? "Clearing…" : "🗑 Clear All"}
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {tab === "Dashboard" && <Dashboard categories={categories} refresh={refresh} />}
        {tab === "Transactions" && <TransactionsTable categories={categories} refresh={refresh} />}
        {tab === "Upload" && (
          <div>
            <h2 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700 }}>Upload CSV File</h2>
            <UploadZone onUploaded={() => setRefresh(r => r + 1)} />
            <div style={{ ...chartCard, marginTop: 24 }}>
              <h3 style={chartTitle}>Supported CSV Formats</h3>
              <p style={{ color: "#8892aa", fontSize: 14, lineHeight: 1.7 }}>
                FinanceFlow automatically detects column mappings from your bank's CSV export. It supports:
              </p>
              <ul style={{ color: "#8892aa", fontSize: 14, lineHeight: 2, paddingLeft: 20 }}>
                <li><strong style={{ color: "#c8d0e7" }}>Standard:</strong> Date, Description, Amount</li>
                <li><strong style={{ color: "#c8d0e7" }}>Split columns:</strong> Date, Description, Debit, Credit, Balance</li>
                <li><strong style={{ color: "#c8d0e7" }}>Various date formats:</strong> MM/DD/YYYY, YYYY-MM-DD, etc.</li>
              </ul>
              <p style={{ color: "#5a6480", fontSize: 13 }}>
                Transactions are automatically categorized based on description keywords and can be re-categorized manually in the Transactions tab.
              </p>
            </div>
          </div>
        )}
        {tab === "Categories" && <CategoriesManager categories={categories} onRefresh={() => { loadCategories(); setRefresh(r => r + 1); }} />}
      </main>
    </div>
  );
}
