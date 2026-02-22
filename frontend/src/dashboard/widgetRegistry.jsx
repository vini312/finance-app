/**
 * widgetRegistry.jsx
 *
 * Central registry of every widget available on the dashboard.
 * To add a new widget: add an entry here. Nothing else needs to change.
 *
 * Each widget has:
 *   id        — unique string key
 *   label     — display name in the "Add Widget" panel
 *   icon      — emoji shown in the panel and widget header
 *   defaultW  — default column span (out of 12)
 *   minW      — minimum allowed column span
 *   component — lazy-loaded React component that receives { analytics, categories }
 */

import React from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Box, Typography, Card, CardContent,
} from "@mui/material";
import { formatCurrency, formatDate } from "../utils/formatters";
import { StatCard, CategoryChip, CHART_TOOLTIP_STYLE } from "../components/UI";

// ── Shared chart tick styles ─────────────────────────────────────────────────
const tick  = { fill: "#5a6480", fontSize: 11 };
const yFmt  = (v) => "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v);
const grid  = <CartesianGrid strokeDasharray="3 3" stroke="#1e2440" />;

// ── Individual widget components ─────────────────────────────────────────────

function IncomeCard({ analytics }) {
  return <StatCard label="Total Income" value={formatCurrency(analytics.totalIncome)} color="#6ee7a0" icon="💰" sub={`${analytics.transactionCount} transactions`} />;
}

function ExpensesCard({ analytics }) {
  return <StatCard label="Total Expenses" value={formatCurrency(analytics.totalExpenses)} color="#ff8080" icon="📉" />;
}

function BalanceCard({ analytics }) {
  return <StatCard label="Net Balance" value={formatCurrency(analytics.netBalance)} color={analytics.netBalance >= 0 ? "#6ee7a0" : "#ff8080"} icon="⚖️" />;
}

function TransactionCountCard({ analytics }) {
  return <StatCard label="Transactions" value={analytics.transactionCount} icon="📋" />;
}

function IncomeVsExpensesChart({ analytics }) {
  return (
    <Box>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={analytics.byMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6ee7a0" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6ee7a0" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ff8080" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ff8080" stopOpacity={0} />
            </linearGradient>
          </defs>
          {grid}
          <XAxis dataKey="month" tick={tick} />
          <YAxis tick={tick} tickFormatter={yFmt} />
          <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
          <Area type="monotone" dataKey="income"   stroke="#6ee7a0" fill="url(#incG)" strokeWidth={2} name="Income" />
          <Area type="monotone" dataKey="expenses" stroke="#ff8080" fill="url(#expG)" strokeWidth={2} name="Expenses" />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

function CategoryPieChart({ analytics }) {
  const pieData = analytics.byCategory
    .filter((c) => c.total > 0)
    .slice(0, 8)
    .map((c) => ({ name: `${c.icon} ${c.name}`, value: c.total, color: c.color }));

  if (!pieData.length) return <Box sx={{ color: "text.disabled", p: 3, textAlign: "center" }}>No category data</Box>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
          {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
        <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
        <Legend iconType="circle" formatter={(v) => <span style={{ color: "#8892aa", fontSize: 11 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function CashFlowChart({ analytics }) {
  const data = analytics.byMonth.map((m) => ({ ...m, net: m.income - m.expenses }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {grid}
        <XAxis dataKey="month" tick={tick} />
        <YAxis tick={tick} tickFormatter={yFmt} />
        <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
        <Bar dataKey="net" radius={[4, 4, 0, 0]}>
          {data.map((m, i) => <Cell key={i} fill={m.net >= 0 ? "#6ee7a0" : "#ff8080"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TopExpenses({ analytics, categories }) {
  if (!analytics.topExpenses.length) {
    return <Typography color="text.disabled" sx={{ p: 2 }}>No expense data</Typography>;
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {analytics.topExpenses.map((t) => {
        const cat = categories.find((c) => c.id === t.categoryId) || { name: "Other", color: "#888", icon: "📦" };
        return (
          <Box key={t.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, bgcolor: "background.default", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography fontSize={20}>{cat.icon}</Typography>
              <Box>
                <Typography variant="body2" color="text.primary" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</Typography>
                <Typography variant="caption" color="text.disabled">{formatDate(t.date)}</Typography>
              </Box>
            </Box>
            <CategoryChip category={{ ...cat, name: formatCurrency(t.amount) }} />
          </Box>
        );
      })}
    </Box>
  );
}

function MonthlyBreakdown({ analytics }) {
  const data = [...analytics.byMonth].reverse().slice(0, 6).reverse();
  if (!data.length) return <Typography color="text.disabled" sx={{ p: 2 }}>No monthly data</Typography>;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {data.map((m) => {
        const savingsRate = m.income > 0 ? Math.round(((m.income - m.expenses) / m.income) * 100) : 0;
        return (
          <Box key={m.month} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, bgcolor: "background.default", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70 }}>{m.month}</Typography>
            <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="text.disabled">In</Typography>
                <Typography variant="body2" color="success.main" sx={{ fontFamily: "monospace" }}>{formatCurrency(m.income)}</Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="text.disabled">Out</Typography>
                <Typography variant="body2" color="error.main" sx={{ fontFamily: "monospace" }}>{formatCurrency(m.expenses)}</Typography>
              </Box>
              <Box sx={{ textAlign: "right", minWidth: 40 }}>
                <Typography variant="caption" color="text.disabled">Saved</Typography>
                <Typography variant="body2" color={savingsRate >= 0 ? "success.main" : "error.main"} sx={{ fontFamily: "monospace" }}>{savingsRate}%</Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ── Registry ─────────────────────────────────────────────────────────────────

export const WIDGET_REGISTRY = [
  {
    id: "income-card",
    label: "Income Card",
    icon: "💰",
    defaultW: 3,
    minW: 2,
    isStatCard: true,
    component: IncomeCard,
  },
  {
    id: "expenses-card",
    label: "Expenses Card",
    icon: "📉",
    defaultW: 3,
    minW: 2,
    isStatCard: true,
    component: ExpensesCard,
  },
  {
    id: "balance-card",
    label: "Balance Card",
    icon: "⚖️",
    defaultW: 3,
    minW: 2,
    isStatCard: true,
    component: BalanceCard,
  },
  {
    id: "count-card",
    label: "Transaction Count",
    icon: "📋",
    defaultW: 3,
    minW: 2,
    isStatCard: true,
    component: TransactionCountCard,
  },
  {
    id: "income-vs-expenses",
    label: "Income vs Expenses",
    icon: "📈",
    defaultW: 8,
    minW: 4,
    component: IncomeVsExpensesChart,
  },
  {
    id: "category-pie",
    label: "Spending by Category",
    icon: "🥧",
    defaultW: 4,
    minW: 3,
    component: CategoryPieChart,
  },
  {
    id: "cash-flow",
    label: "Net Cash Flow",
    icon: "💹",
    defaultW: 12,
    minW: 6,
    component: CashFlowChart,
  },
  {
    id: "top-expenses",
    label: "Top Expenses",
    icon: "🏆",
    defaultW: 6,
    minW: 4,
    component: TopExpenses,
  },
  {
    id: "monthly-breakdown",
    label: "Monthly Breakdown",
    icon: "📅",
    defaultW: 6,
    minW: 4,
    component: MonthlyBreakdown,
  },
];

export const DEFAULT_LAYOUT = [
  "income-card",
  "expenses-card",
  "balance-card",
  "count-card",
  "income-vs-expenses",
  "category-pie",
  "cash-flow",
  "top-expenses",
];
