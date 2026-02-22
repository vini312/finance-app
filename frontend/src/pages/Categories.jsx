/**
 * Categories.jsx
 * Manage transaction categories: add, view, delete.
 */

import React, { useState } from "react";
import { api } from "../api/api";
import { Card, CardTitle, inputStyle, primaryBtnStyle } from "../components/UI";

export default function Categories({ categories, onRefresh }) {
  const [newName,  setNewName]  = useState("");
  const [newIcon,  setNewIcon]  = useState("📁");
  const [newColor, setNewColor] = useState("#7c6af7");
  const [error,    setError]    = useState(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setError(null);
    try {
      await api.createCategory({ name: newName.trim(), icon: newIcon, color: newColor });
      setNewName("");
      setNewIcon("📁");
      onRefresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? Its transactions will move to 'Other'.")) return;
    await api.deleteCategory(id);
    onRefresh();
  };

  return (
    <div>
      {/* Create form */}
      <Card style={{ marginBottom: 24 }}>
        <CardTitle>Add Category</CardTitle>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input value={newIcon}  onChange={(e) => setNewIcon(e.target.value)}  placeholder="Emoji" title="Paste any emoji" style={{ ...inputStyle, width: 64, textAlign: "center", fontSize: 20 }} />
          <input value={newName}  onChange={(e) => setNewName(e.target.value)}  placeholder="Category name" style={{ ...inputStyle, flex: 1, minWidth: 160 }} onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} title="Pick a color" style={{ ...inputStyle, width: 48, padding: 4, cursor: "pointer" }} />
          <button onClick={handleCreate} style={primaryBtnStyle}>Add</button>
        </div>
        {error && <div style={{ color: "#ff8080", marginTop: 10, fontSize: 13 }}>❌ {error}</div>}
      </Card>

      {/* Category grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              background: "#1a1f2e",
              border: `1px solid ${cat.color}44`,
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 26 }}>{cat.icon}</span>
              <div>
                <div style={{ color: "#c8d0e7", fontWeight: 600, fontSize: 14 }}>{cat.name}</div>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: cat.color, marginTop: 5 }} />
              </div>
            </div>
            <button
              onClick={() => handleDelete(cat.id)}
              title="Delete category"
              style={{ background: "none", border: "none", color: "#5a6480", cursor: "pointer", fontSize: 16, padding: 4 }}
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
