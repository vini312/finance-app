/**
 * Transactions.jsx — MUI DataGrid-style transaction table.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, TablePagination, Chip,
  Typography, Stack, IconButton, Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import { api } from "../api/api";
import { formatCurrency, formatDate } from "../utils/formatters";
import { CategoryChip } from "../components/UI";

export default function Transactions({ categories, refresh: externalRefresh }) {
  const [txns,      setTxns]      = useState([]);
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [type,      setType]      = useState("all");
  const [orderBy,   setOrderBy]   = useState("date");
  const [order,     setOrder]     = useState("desc");
  const [editId,    setEditId]    = useState(null);
  const [page,      setPage]      = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const load = useCallback(async () => {
    const data = await api.getTransactions({ search, categoryId: catFilter, type, sortBy: orderBy, sortDir: order }).catch(() => []);
    setTxns(data);
    setPage(0);
  }, [search, catFilter, type, orderBy, order]);

  useEffect(() => { load(); }, [load, externalRefresh]);

  const handleSort = (col) => {
    if (orderBy === col) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setOrderBy(col); setOrder("desc"); }
  };

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

  const clearFilters = () => { setSearch(""); setCatFilter("all"); setType("all"); };

  const paginated = txns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const COLUMNS = [
    { id: "date",        label: "Date",        sortable: true },
    { id: "description", label: "Description", sortable: true },
    { id: "amount",      label: "Amount",      sortable: true },
    { id: "category",    label: "Category",    sortable: false },
    { id: "balance",     label: "Balance",     sortable: false },
    { id: "actions",     label: "",            sortable: false },
  ];

  return (
    <Box>
      {/* Filters */}
      <Card elevation={0} sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
              size="small"
              sx={{ flexGrow: 1 }}
              InputProps={{ sx: { bgcolor: "background.default" } }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Category</InputLabel>
              <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} label="Category" sx={{ bgcolor: "background.default" }}>
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.icon} {c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Type</InputLabel>
              <Select value={type} onChange={(e) => setType(e.target.value)} label="Type" sx={{ bgcolor: "background.default" }}>
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expenses</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListOffIcon />}
              onClick={clearFilters}
              sx={{ whiteSpace: "nowrap", borderColor: "divider", color: "text.secondary" }}
            >
              Clear
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5, mb: 1, display: "block" }}>
        {txns.length} transactions
      </Typography>

      <Card elevation={0}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {COLUMNS.map((col) => (
                  <TableCell key={col.id} sx={{ whiteSpace: "nowrap" }}>
                    {col.sortable ? (
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : "asc"}
                        onClick={() => handleSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.disabled" }}>
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((t) => {
                const cat = categories.find((c) => c.id === t.categoryId) || { name: "Other", color: "#888", icon: "📦" };
                const isIncome = t.amount > 0;
                return (
                  <TableRow key={t.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", fontSize: 13 }}>
                      {formatDate(t.date)}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {t.description}
                      </Typography>
                      {t.source && (
                        <Typography variant="caption" color="text.disabled">{t.source}</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: isIncome ? "success.main" : "error.main", whiteSpace: "nowrap" }}>
                      {isIncome ? "+" : ""}{formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell>
                      {editId === t.id ? (
                        <Select
                          autoFocus
                          size="small"
                          defaultValue={t.categoryId}
                          onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                          onBlur={() => setEditId(null)}
                          sx={{ fontSize: 12, minWidth: 160 }}
                        >
                          {categories.map((c) => (
                            <MenuItem key={c.id} value={c.id}>{c.icon} {c.name}</MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Tooltip title="Click to change category">
                          <span onClick={() => setEditId(t.id)}>
                            <CategoryChip category={cat} />
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "'IBM Plex Mono', monospace", color: "text.disabled", fontSize: 13, whiteSpace: "nowrap" }}>
                      {t.balance != null ? formatCurrency(t.balance) : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => handleDelete(t.id)} title="Delete">
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={txns.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          sx={{ borderTop: "1px solid", borderColor: "divider", color: "text.secondary" }}
        />
      </Card>
    </Box>
  );
}
