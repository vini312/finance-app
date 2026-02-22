/**
 * UI.jsx
 * Small reusable primitive components (Badge, StatCard, etc.)
 */

import React from "react";

export function Badge({ children, color }) {
  return (
    <span
      style={{
        background: color + "22",
        color,
        border: `1px solid ${color}44`,
        borderRadius: 20,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function StatCard({ label, value, sub, color, icon }) {
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

export function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#1a1f2e", border: "1px solid #2a3048", borderRadius: 16, padding: "24px 28px", ...style }}>
      {children}
    </div>
  );
}

export function CardTitle({ children }) {
  return <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#c8d0e7" }}>{children}</h3>;
}

export const inputStyle = {
  background: "#1a1f2e", border: "1px solid #2a3048", borderRadius: 8,
  color: "#c8d0e7", padding: "10px 14px", fontSize: 14, outline: "none",
};

export const ghostBtnStyle = {
  background: "#1a1f2e", border: "1px solid #2a3048", borderRadius: 8,
  color: "#8892aa", padding: "10px 16px", fontSize: 13, cursor: "pointer",
};

export const primaryBtnStyle = {
  background: "#7c6af7", border: "none", borderRadius: 8,
  color: "#fff", padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 600,
};

export const dangerBtnStyle = {
  ...ghostBtnStyle, color: "#ff8080", borderColor: "#5c1a1a",
};
