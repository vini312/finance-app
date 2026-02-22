/**
 * Transactions.jsx
 * Filterable, sortable, paginated transaction table with inline category editing.
 */

import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api/api";
import { formatCurrency, formatDate } from "../utils/formatters";
import { Badge, inputStyle, ghostBtnStyle } from "../components/UI";

const PER_PAGE = 20;

const TH = ({ label, col, sortBy, sortDir, onSort }) => (
  <th
    onClick={() => onSort(col)}
    style={{
      padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#5a6480",
      textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer",
      userSelect: "none", borderBottom: "1px solid #1e2440", whiteSpace: "nowrap",
    }}
  >
    {label}{sortBy === col ? (sortDir === "desc" ? " ↓" : " ↑") : " ·"}
  </th>
);

export default function Transactions({ categories, refresh: externalRefresh }) {
  const [txns,      setTxns]      = useState([]);
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [type,      setType]      = useState("all");
  const [sortBy,    setSortBy]    = useState("date");
  const [sortDir,   setSortDir]   = useState("desc");
  const [editId,    setEditId]    = useState(null);
  const [page,      setPage]      = useState(1);

  const load = useCallback(async () => {
    const data = await api.getTransactions({ search, categoryId: catFilter, type, sortBy, sortDir }).catch(() => []);
    setTxns(data);
    setPage(1);
  }, [search, catFilter, type, sortBy, sortDir]);

  useEffect(() => { load(); }, [load, externalRefresh]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await api.deleteTransaction(id);
    load();
  };

  const handleCategoryChange = async (id, categoryId) => {
    await api.updateTransaction(id, { categoryId });
    setEditId(null);
    load();
  };

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
  };

  const paginated  = txns.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(txns.length / PER_PAGE);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions…" style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={inputStyle}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
          <option value="all">All Types</option>
          <option value="income">Income only</option>
          <option value="expense">Expenses only</option>
        </select>
        <button onClick={() => { setSearch(""); setCatFilter("all"); setType("all"); }} style={ghostBtnStyle}>
          Clear
        </button>
      </div>

      <div style={{ fontSize: 13, color: "#5a6480", marginBottom: 12 }}>{txns.length} transactions</div>

      <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #2a3048" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#111520" }}>
              <TH label="Date"        col="date"        sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <TH label="Description" col="description" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <TH label="Amount"      col="amount"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#5a6480", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #1e2440" }}>Category</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#5a6480", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #1e2440" }}>Balance</th>
              <th style={{ padding: "12px 16px", borderBottom: "1px solid #1e2440" }} />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#5a6480" }}>No transactions found</td></tr>
            )}
            {paginated.map((t, i) => {
              const cat      = categories.find((c) => c.id === t.categoryId) || { name: "Other", color: "#888", icon: "📦" };
              const isIncome = t.amount > 0;
              return (
                <tr key={t.id} style={{ background: i % 2 === 0 ? "#131829" : "#111520", borderBottom: "1px solid #1e2440" }}>
                  <td style={TD}>{formatDate(t.date)}</td>
                  <td style={{ ...TD, maxWidth: 300 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#c8d0e7" }}>{t.description}</div>
                    {t.source && <div style={{ fontSize: 11, color: "#3a4460" }}>{t.source}</div>}
                  </td>
                  <td style={{ ...TD, fontFamily: "'IBM Plex Mono', monospace", color: isIncome ? "#6ee7a0" : "#ff8080", fontWeight: 600 }}>
                    {isIncome ? "+" : ""}{formatCurrency(t.amount)}
                  </td>
                  <td style={TD}>
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
                      <span onClick={() => setEditId(t.id)} style={{ cursor: "pointer" }} title="Click to change category">
                        <Badge color={cat.color}>{cat.icon} {cat.name}</Badge>
                      </span>
                    )}
                  </td>
                  <td style={{ ...TD, fontFamily: "'IBM Plex Mono', monospace", color: "#5a6480", fontSize: 13 }}>
                    {t.balance != null ? formatCurrency(t.balance) : "—"}
                  </td>
                  <td style={TD}>
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
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={ghostBtnStyle}>← Prev</button>
          <span style={{ padding: "8px 12px", color: "#8892aa", fontSize: 13 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={ghostBtnStyle}>Next →</button>
        </div>
      )}
    </div>
  );
}

const TD = { padding: "12px 16px", fontSize: 14, color: "#8892aa", verticalAlign: "middle" };
