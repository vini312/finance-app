/**
 * widgetRegistry.jsx — Dashboard Widget Definitions
 * ─────────────────────────────────────────────────────────────────────────────
 * The single source of truth for every widget that can appear on the dashboard.
 *
 * HOW TO ADD A NEW WIDGET:
 *   1. Write a React component below that accepts { analytics, categories }
 *   2. Add an entry to WIDGET_REGISTRY at the bottom of this file
 *   3. Optionally add its ID to DEFAULT_LAYOUT to show it by default
 *   That's it — the Dashboard, AddWidgetPanel, and useDashboardLayout all
 *   read from this registry automatically.
 *
 * WIDGET OBJECT SHAPE:
 *   id        {string}   — unique key used in layout state and localStorage
 *   label     {string}   — human-readable name shown in the Add Widget panel
 *   icon      {string}   — emoji shown in the panel and on the widget header
 *   defaultW  {number}   — default column span on the 12-column grid (1–12)
 *   minW      {number}   — minimum allowed column span (set by resize handle)
 *   isStatCard{boolean}  — true = the component renders its own Card shell
 *                          false = DraggableWidget adds a Card shell with a header
 *   component {React.FC} — the component to render, receiving { analytics, categories }
 */

import React from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { formatCurrency, formatDate } from "../utils/formatters";
import { StatCard, CategoryChip, CHART_TOOLTIP_STYLE } from "../components/UI";

// ── Shared Chart Constants ───────────────────────────────────────────────────

// Reused tick style object so all chart axes look the same
const tick = { fill: "#5a6480", fontSize: 11 };

// Y-axis tick formatter: abbreviate large numbers (1500 → $1.5k)
const yFmt = (v) => "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v);

// CartesianGrid is shared across all bar/area charts
const grid = <CartesianGrid strokeDasharray="3 3" stroke="#1e2440" />;

// ── Stat Card Widgets ────────────────────────────────────────────────────────
// These are thin wrappers around StatCard — they don't need their own Card
// shell because StatCard already renders a Card.

/** Displays the sum of all positive transaction amounts */
function IncomeCard({ analytics }) {
  return (
    <StatCard
      label="Total Income"
      value={formatCurrency(analytics.totalIncome)}
      color="#6ee7a0"  // green
      icon="💰"
      sub={`${analytics.transactionCount} transactions`} // subtitle shows row count
    />
  );
}

/** Displays the sum of absolute values of all negative transaction amounts */
function ExpensesCard({ analytics }) {
  return (
    <StatCard
      label="Total Expenses"
      value={formatCurrency(analytics.totalExpenses)}
      color="#ff8080"  // red
      icon="📉"
    />
  );
}

/** Displays income minus expenses (positive = surplus, negative = deficit) */
function BalanceCard({ analytics }) {
  return (
    <StatCard
      label="Net Balance"
      value={formatCurrency(analytics.netBalance)}
      // Colour adapts based on whether the balance is positive or negative
      color={analytics.netBalance >= 0 ? "#6ee7a0" : "#ff8080"}
      icon="⚖️"
    />
  );
}

/** Displays the total number of imported transactions */
function TransactionCountCard({ analytics }) {
  return <StatCard label="Transactions" value={analytics.transactionCount} icon="📋" />;
}

// ── Chart Widgets ────────────────────────────────────────────────────────────

/**
 * Area chart showing income and expenses side-by-side for each month.
 * Uses gradient fills to make the area beneath each line more visible.
 */
function IncomeVsExpensesChart({ analytics }) {
  return (
    <Box>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={analytics.byMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {/* SVG gradient definitions — referenced by fill="url(#incG)" below */}
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
          {/* Each Area renders one line + filled region */}
          <Area type="monotone" dataKey="income"   stroke="#6ee7a0" fill="url(#incG)" strokeWidth={2} name="Income" />
          <Area type="monotone" dataKey="expenses" stroke="#ff8080" fill="url(#expG)" strokeWidth={2} name="Expenses" />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

/**
 * Donut (innerRadius > 0) pie chart showing spending broken down by category.
 * Slices are sized by total absolute amount spent in each category.
 */
function CategoryPieChart({ analytics }) {
  // Only show categories that actually have transactions, and limit to 8
  // to prevent the chart from becoming too crowded
  const pieData = analytics.byCategory
    .filter((c) => c.total > 0)
    .slice(0, 8)
    .map((c) => ({ name: `${c.icon} ${c.name}`, value: c.total, color: c.color }));

  if (!pieData.length) {
    return <Box sx={{ color: "text.disabled", p: 3, textAlign: "center" }}>No category data</Box>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        {/* innerRadius creates the donut hole — makes the chart feel less heavy */}
        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
          {/* Each Cell gets the category's own colour */}
          {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
        <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
        <Legend iconType="circle" formatter={(v) => <span style={{ color: "#8892aa", fontSize: 11 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Bar chart showing net cash flow (income - expenses) per month.
 * Bars are green for surplus months, red for deficit months.
 */
function CashFlowChart({ analytics }) {
  // Pre-compute net for each month so the chart can use it directly
  const data = analytics.byMonth.map((m) => ({ ...m, net: m.income - m.expenses }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {grid}
        <XAxis dataKey="month" tick={tick} />
        <YAxis tick={tick} tickFormatter={yFmt} />
        <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
        <Bar dataKey="net" radius={[4, 4, 0, 0]}>
          {/* Colour each bar individually based on whether net is positive */}
          {data.map((m, i) => <Cell key={i} fill={m.net >= 0 ? "#6ee7a0" : "#ff8080"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * List of the top 5 largest individual expenses.
 * Shows description, date, and amount for each one.
 */
function TopExpenses({ analytics, categories }) {
  if (!analytics.topExpenses.length) {
    return <Typography color="text.disabled" sx={{ p: 2 }}>No expense data</Typography>;
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {analytics.topExpenses.map((t) => {
        // Look up the full category object; fall back to "Other" if the category was deleted
        const cat = categories.find((c) => c.id === t.categoryId)
          || { name: "Other", color: "#888", icon: "📦" };
        return (
          <Box
            key={t.id}
            sx={{
              display:        "flex",
              justifyContent: "space-between",
              alignItems:     "center",
              p:              1.5,
              bgcolor:        "background.default",
              borderRadius:   2,
              border:         "1px solid",
              borderColor:    "divider",
            }}
          >
            {/* Left side: category icon, description, date */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography fontSize={20}>{cat.icon}</Typography>
              <Box>
                {/* Truncate long descriptions with ellipsis */}
                <Typography variant="body2" color="text.primary" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.description}
                </Typography>
                <Typography variant="caption" color="text.disabled">{formatDate(t.date)}</Typography>
              </Box>
            </Box>

            {/* Right side: reuse CategoryChip but replace the name with the amount */}
            <CategoryChip category={{ ...cat, name: formatCurrency(t.amount) }} />
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * Table showing income, expenses, and savings rate for the last 6 months.
 * Savings rate = (income - expenses) / income × 100
 */
function MonthlyBreakdown({ analytics }) {
  // Take the most recent 6 months — reverse to get newest-first, slice, then re-reverse for display
  const data = [...analytics.byMonth].reverse().slice(0, 6).reverse();

  if (!data.length) {
    return <Typography color="text.disabled" sx={{ p: 2 }}>No monthly data</Typography>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {data.map((m) => {
        // Calculate savings rate; guard against division by zero
        const savingsRate = m.income > 0
          ? Math.round(((m.income - m.expenses) / m.income) * 100)
          : 0;

        return (
          <Box
            key={m.month}
            sx={{
              display:        "flex",
              justifyContent: "space-between",
              alignItems:     "center",
              p:              1.5,
              bgcolor:        "background.default",
              borderRadius:   2,
              border:         "1px solid",
              borderColor:    "divider",
            }}
          >
            {/* Month label */}
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70 }}>
              {m.month}
            </Typography>

            {/* Numeric columns — monospace font so digits align vertically */}
            <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="text.disabled">In</Typography>
                <Typography variant="body2" color="success.main" sx={{ fontFamily: "monospace" }}>
                  {formatCurrency(m.income)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="text.disabled">Out</Typography>
                <Typography variant="body2" color="error.main" sx={{ fontFamily: "monospace" }}>
                  {formatCurrency(m.expenses)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right", minWidth: 40 }}>
                <Typography variant="caption" color="text.disabled">Saved</Typography>
                {/* Colour adapts: green if saving money, red if spending more than earning */}
                <Typography variant="body2" color={savingsRate >= 0 ? "success.main" : "error.main"} sx={{ fontFamily: "monospace" }}>
                  {savingsRate}%
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ── Registry ─────────────────────────────────────────────────────────────────

/**
 * All widgets available to the dashboard.
 * The order here determines the order they appear in the "Add Widget" panel.
 */
export const WIDGET_REGISTRY = [
  { id: "income-card",        label: "Income Card",          icon: "💰", defaultW: 3,  minW: 2, isStatCard: true,  component: IncomeCard },
  { id: "expenses-card",      label: "Expenses Card",        icon: "📉", defaultW: 3,  minW: 2, isStatCard: true,  component: ExpensesCard },
  { id: "balance-card",       label: "Balance Card",         icon: "⚖️", defaultW: 3,  minW: 2, isStatCard: true,  component: BalanceCard },
  { id: "count-card",         label: "Transaction Count",    icon: "📋", defaultW: 3,  minW: 2, isStatCard: true,  component: TransactionCountCard },
  { id: "income-vs-expenses", label: "Income vs Expenses",   icon: "📈", defaultW: 8,  minW: 4, isStatCard: false, component: IncomeVsExpensesChart },
  { id: "category-pie",       label: "Spending by Category", icon: "🥧", defaultW: 4,  minW: 3, isStatCard: false, component: CategoryPieChart },
  { id: "cash-flow",          label: "Net Cash Flow",        icon: "💹", defaultW: 12, minW: 6, isStatCard: false, component: CashFlowChart },
  { id: "top-expenses",       label: "Top Expenses",         icon: "🏆", defaultW: 6,  minW: 4, isStatCard: false, component: TopExpenses },
  { id: "monthly-breakdown",  label: "Monthly Breakdown",    icon: "📅", defaultW: 6,  minW: 4, isStatCard: false, component: MonthlyBreakdown },
];

/**
 * The widget IDs shown on the dashboard when no saved layout exists.
 * Users can add/remove/reorder from this default through the UI.
 */
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
