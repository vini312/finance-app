/**
 * Upload.jsx — MUI drag-and-drop CSV uploader.
 */

import React, { useState, useRef } from "react";
import {
  Box, Card, CardContent, Typography, Button, Alert, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, Paper,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { api } from "../api/api";

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
    <Box>
      <Typography variant="h5" mb={3}>Upload CSV File</Typography>

      {/* Drop zone */}
      <Paper
        elevation={0}
        onClick={() => !uploading && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        sx={{
          border: "2px dashed",
          borderColor: dragging ? "primary.main" : "divider",
          borderRadius: 3,
          p: 8,
          textAlign: "center",
          cursor: uploading ? "wait" : "pointer",
          bgcolor: dragging ? "primary.main" + "10" : "background.default",
          transition: "all 0.2s",
          mb: 2,
          "&:hover": { borderColor: "primary.main", bgcolor: "primary.main" + "08" },
        }}
      >
        <UploadFileIcon sx={{ fontSize: 56, color: dragging ? "primary.main" : "text.disabled", mb: 1 }} />
        <Typography variant="h6" color={dragging ? "primary.main" : "text.secondary"} mb={0.5}>
          {uploading ? "Uploading and parsing…" : "Drop your CSV file here"}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          or click to browse · Max 10 MB
        </Typography>
        {uploading && <LinearProgress sx={{ mt: 3, mx: "auto", maxWidth: 300 }} />}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </Paper>

      {/* Upload button alternative */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={() => inputRef.current.click()}
          disabled={uploading}
        >
          Choose File
        </Button>
      </Box>

      {/* Result messages */}
      {result && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Imported <strong>{result.imported}</strong> transaction{result.imported !== 1 ? "s" : ""}
          {result.errors > 0 && ` · ${result.errors} row${result.errors !== 1 ? "s" : ""} skipped due to parsing errors`}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* Format reference */}
      <Card elevation={0}>
        <CardContent>
          <Typography variant="h6" mb={2}>Supported CSV Formats</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            FinanceFlow auto-detects column mappings from your bank's export by scanning the header row for keywords:
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Column</TableCell>
                <TableCell>Detected header keywords</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                ["Date",        "date, time, data"],
                ["Description", "description, desc, memo, narrative, details, merchant"],
                ["Amount",      "amount, value"],
                ["Debit",       "debit, withdrawal, expense"],
                ["Credit",      "credit, deposit, income"],
                ["Balance",     "balance, running"],
              ].map(([col, keys]) => (
                <TableRow key={col}>
                  <TableCell><Typography variant="body2" color="text.primary" fontWeight={600}>{col}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: "'IBM Plex Mono', monospace", color: "primary.light" }}>
                      {keys}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 2 }}>
            Transactions are automatically categorized by description keywords. You can re-categorize them in the Transactions tab.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
