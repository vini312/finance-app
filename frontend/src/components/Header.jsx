/**
 * Header.jsx
 * Top navigation bar.
 */

import React from "react";
import { api } from "../api/api";
import { ghostBtnStyle, dangerBtnStyle } from "./UI";

const TABS = ["Dashboard", "Transactions", "Upload", "Categories"];

export default function Header({ activeTab, onTabChange, onClearAll }) {
  return (
    <header
      style={{
        background: "#111520",
        borderBottom: "1px solid #1e2440",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Logo + Nav */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            background: "linear-gradient(135deg, #7c6af7, #4ecdc4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            padding: "20px 0",
            marginRight: 28,
            letterSpacing: "-0.02em",
          }}
        >
          💹 FinanceFlow
        </span>

        <nav style={{ display: "flex", gap: 4 }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                background: activeTab === tab ? "#7c6af722" : "none",
                border: "none",
                color: activeTab === tab ? "#7c6af7" : "#5a6480",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: activeTab === tab ? 600 : 400,
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => window.open(api.exportURL())} style={ghostBtnStyle}>
          ⬇ Export CSV
        </button>
        <button onClick={onClearAll} style={dangerBtnStyle}>
          🗑 Clear All
        </button>
      </div>
    </header>
  );
}
