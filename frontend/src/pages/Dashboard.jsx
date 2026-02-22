/**
 * Dashboard.jsx
 * Analytics overview: stat cards, area chart, pie chart, bar chart, top expenses.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { api } from "../api/api";
import { formatCurrency, formatDate } from "../utils/formatters";
import { StatCard, Card, CardTitle, Badge } from "../components/UI";

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1a1f2e", border: "1px solid #2a3048", borderRadius: 8, color: "#c8d0e7" },
  formatter: (v) => formatCurrency(v),
};

export default function Dashboard({ categories, refresh }) {
  const [analytics, setAnalytics] = useState(null);

  const load = useCallback(async () => {
    const data = await api.getAnalytics().catch(() => null);
    setAnalytics(data);
  }, []);

  useEffect(() => { load(); }, [load, refresh]);

  if (!analytics) {
    return <div style={{ color: "#5a6480", padding: 40, textAlign: "center" }}>Loading analytics…</div>;
  }

  const pieData = analytics.byCategory
    .filter((c) => c.total > 0)
    .slice(0, 8)
    .map((c) => ({ name: `${c.icon} ${c.name}`, value: c.total, color: c.color }));

  const monthData = analytics.byMonth.map((m) => ({ ...m, net: m.income - m.expenses }));

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Income"   value={formatCurrency(analytics.totalIncome)}   color="#6ee7a0" icon="💰" sub={`${analytics.transactionCount} transactions`} />
        <StatCard label="Total Expenses" value={formatCurrency(analytics.totalExpenses)} color="#ff8080" icon="📉" />
        <StatCard label="Net Balance"    value={formatCurrency(analytics.netBalance)}    color={analytics.netBalance >= 0 ? "#6ee7a0" : "#ff8080"} icon="⚖️" />
        <StatCard label="Transactions"   value={analytics.transactionCount}              icon="📋" />
      </div>

      {/* Area chart + Pie chart */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card>
          <CardTitle>Monthly Income vs Expenses</CardTitle>
          {analytics.byMonth.length === 0
            ? <EmptyChart />
            : (
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
                  <YAxis tick={{ fill: "#5a6480", fontSize: 11 }} tickFormatter={(v) => "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v)} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="income"   stroke="#6ee7a0" fill="url(#incG)" strokeWidth={2} name="Income" />
                  <Area type="monotone" dataKey="expenses" stroke="#ff8080" fill="url(#expG)" strokeWidth={2} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            )}
        </Card>

        <Card>
          <CardTitle>Spending by Category</CardTitle>
          {pieData.length === 0
            ? <EmptyChart />
            : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend iconType="circle" formatter={(v) => <span style={{ color: "#8892aa", fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </Card>
      </div>

      {/* Bar chart */}
      {monthData.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <CardTitle>Monthly Net Cash Flow</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2440" />
              <XAxis dataKey="month" tick={{ fill: "#5a6480", fontSize: 11 }} />
              <YAxis tick={{ fill: "#5a6480", fontSize: 11 }} tickFormatter={(v) => "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v)} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                {monthData.map((m, i) => <Cell key={i} fill={m.net >= 0 ? "#6ee7a0" : "#ff8080"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top expenses */}
      {analytics.topExpenses.length > 0 && (
        <Card>
          <CardTitle>Top 5 Expenses</CardTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {analytics.topExpenses.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId) || { name: "Other", color: "#888", icon: "📦" };
              return (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#111520", borderRadius: 8, border: "1px solid #1e2440" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{cat.icon}</span>
                    <div>
                      <div style={{ color: "#c8d0e7", fontSize: 14 }}>{t.description}</div>
                      <div style={{ color: "#5a6480", fontSize: 12 }}>{formatDate(t.date)}</div>
                    </div>
                  </div>
                  <Badge color={cat.color}>{formatCurrency(t.amount)}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function EmptyChart() {
  return <div style={{ color: "#5a6480", padding: 32, textAlign: "center" }}>No data yet — upload a CSV to get started</div>;
}
