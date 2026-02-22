/**
 * Upload.jsx
 * Drag-and-drop CSV uploader with format documentation.
 */

import React, { useState, useRef } from "react";
import { api } from "../api/api";
import { Card, CardTitle } from "../components/UI";

export default function Upload({ onUploaded }) {
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.uploadCSV(file);
      setResult(data);
      onUploaded();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700, color: "#c8d0e7" }}>Upload CSV File</h2>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${dragging ? "#7c6af7" : "#2a3048"}`,
          borderRadius: 16,
          padding: "56px 32px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "#7c6af710" : "#111520",
          transition: "all 0.2s",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 12 }}>{uploading ? "⏳" : "📂"}</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#c8d0e7", marginBottom: 6 }}>
          {uploading ? "Uploading and parsing…" : "Drop your CSV file here"}
        </div>
        <div style={{ fontSize: 13, color: "#5a6480" }}>or click to browse &nbsp;·&nbsp; Max 10 MB</div>
        <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {result && (
        <div style={{ padding: "14px 20px", borderRadius: 10, background: "#0d2e1e", border: "1px solid #1a5c35", color: "#6ee7a0", fontSize: 14, marginBottom: 16 }}>
          ✅ Imported <strong>{result.imported}</strong> transaction{result.imported !== 1 ? "s" : ""}
          {result.errors > 0 && (
            <span style={{ color: "#ffaa60", marginLeft: 12 }}>⚠ {result.errors} row{result.errors !== 1 ? "s" : ""} skipped</span>
          )}
        </div>
      )}

      {error && (
        <div style={{ padding: "14px 20px", borderRadius: 10, background: "#2e0d0d", border: "1px solid #5c1a1a", color: "#ff8080", fontSize: 14, marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      {/* Format reference */}
      <Card style={{ marginTop: 8 }}>
        <CardTitle>Supported CSV Formats</CardTitle>
        <p style={{ color: "#8892aa", fontSize: 14, lineHeight: 1.7, margin: "0 0 16px" }}>
          FinanceFlow auto-detects column mappings from your bank's export by scanning the header row for keywords:
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={TH}>Column</th>
              <th style={TH}>Detected keywords</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Date",        "date, time, data"],
              ["Description", "description, desc, memo, narrative, details, merchant"],
              ["Amount",      "amount, value"],
              ["Debit",       "debit, withdrawal, expense"],
              ["Credit",      "credit, deposit, income"],
              ["Balance",     "balance, running"],
            ].map(([col, keys]) => (
              <tr key={col}>
                <td style={TD2}><strong style={{ color: "#c8d0e7" }}>{col}</strong></td>
                <td style={TD2}><code style={{ color: "#7c6af7", fontSize: 12 }}>{keys}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ color: "#5a6480", fontSize: 13, marginTop: 16 }}>
          Transactions are automatically categorized by description keywords. You can re-categorize them at any time in the Transactions tab.
        </p>
      </Card>
    </div>
  );
}

const TH = { padding: "8px 12px", textAlign: "left", color: "#5a6480", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #1e2440" };
const TD2 = { padding: "8px 12px", borderBottom: "1px solid #1a2030", color: "#8892aa" };
