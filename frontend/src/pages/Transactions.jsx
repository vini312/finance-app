/**
 * Transactions.jsx — Transaction Table Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a filterable, sortable, paginated table of all transactions.
 *
 * FEATURES:
 *   Filtering    — text search, category dropdown, income/expense type filter
 *   Sorting      — click any column header to sort ascending/descending
 *   Pagination   — 20 rows per page by default, configurable via footer control
 *   Re-categorise — click a category chip to open an inline dropdown and reassign
 *   Delete       — trash icon deletes a single transaction (with confirmation)
 *
 * DATA FLOW:
 *   All filtering and sorting is done SERVER-SIDE (backend list controller).
 *   The component re-fetches whenever any filter/sort state changes.
 *   Pagination is CLIENT-SIDE (slice the already-filtered result array).
 *
 * PROPS:
 *   categories      {Category[]} — used to populate the category filter dropdown
 *                                  and render category chips in each row
 *   refresh         {number}     — incrementing this triggers a re-fetch
 *                                  (parent bumps it after CSV upload or clear-all)
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
import { api }           from "../api/api";
import { formatCurrency, formatDate } from "../utils/formatters";
import { CategoryChip }  from "../components/UI";

export default function Transactions({ categories, refresh: externalRefresh }) {
  // ── Filter + Sort State ──────────────────────────────────────────────────
  const [txns,        setTxns]        = useState([]);
  const [search,      setSearch]      = useState("");       // text search on description
  const [catFilter,   setCatFilter]   = useState("all");   // category ID or "all"
  const [type,        setType]        = useState("all");   // "all" | "income" | "expense"
  const [orderBy,     setOrderBy]     = useState("date");  // column to sort by
  const [order,       setOrder]       = useState("desc");  // "asc" | "desc"

  // ── Inline Edit State ────────────────────────────────────────────────────
  // editId holds the ID of the transaction whose category chip was clicked.
  // That row shows a dropdown select instead of the chip while editId matches.
  const [editId, setEditId] = useState(null);

  // ── Pagination State ─────────────────────────────────────────────────────
  const [page,        setPage]        = useState(0);   // zero-indexed current page
  const [rowsPerPage, setRowsPerPage] = useState(20);  // rows per page

  /**
   * Fetches filtered and sorted transactions from the API.
   * All filter/sort params are sent to the server — the server does the work
   * so even with thousands of rows, the client only receives the filtered set.
   * useCallback ensures a stable reference for the useEffect dependency array.
   */
  const load = useCallback(async () => {
    const data = await api.getTransactions({
      search,
      categoryId: catFilter,
      type,
      sortBy:  orderBy,
      sortDir: order,
    }).catch(() => []);
    setTxns(data);
    setPage(0); // reset to first page whenever the filter changes
  }, [search, catFilter, type, orderBy, order]);

  // Re-fetch when any filter/sort changes OR when the parent bumps `externalRefresh`
  useEffect(() => { load(); }, [load, externalRefresh]);

  // ── Event Handlers ───────────────────────────────────────────────────────

  /**
   * Handles clicking a sortable column header.
   * If the column is already the active sort, toggle asc/desc.
   * If it's a new column, switch to it with "desc" as the default direction.
   */
  const handleSort = (col) => {
    if (orderBy === col) {
      setOrder((o) => (o === "asc" ? "desc" : "asc")); // toggle direction
    } else {
      setOrderBy(col);
      setOrder("desc"); // new column always starts with most-recent/largest first
    }
  };

  /**
   * Deletes a single transaction after a confirmation dialog.
   * Calls load() to refresh the list rather than splicing the array locally,
   * so the displayed data always matches the server state.
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await api.deleteTransaction(id);
    load();
  };

  /**
   * Saves a re-categorisation and closes the inline dropdown.
   * @param {string} id         - Transaction ID
   * @param {string} categoryId - New category ID
   */
  const handleCategoryChange = async (id, categoryId) => {
    await api.updateTransaction(id, { categoryId });
    setEditId(null); // close the dropdown
    load();          // refresh to show the updated chip
  };

  /** Resets all three filter controls to their "show everything" defaults */
  const clearFilters = () => {
    setSearch("");
    setCatFilter("all");
    setType("all");
  };

  // ── Pagination ──────────────────────────────────────────────────────────
  // Pagination is done client-side by slicing the already-filtered array.
  // The server has already filtered and sorted; we just window into the result.
  const paginated = txns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ── Column Definitions ───────────────────────────────────────────────────
  // Used to render both the header row and control sorting behaviour.
  const COLUMNS = [
    { id: "date",        label: "Date",        sortable: true  },
    { id: "description", label: "Description", sortable: true  },
    { id: "amount",      label: "Amount",      sortable: true  },
    { id: "category",    label: "Category",    sortable: false }, // category is not sortable
    { id: "balance",     label: "Balance",     sortable: false }, // balance is not sortable
    { id: "actions",     label: "",            sortable: false }, // delete button column
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── Filter Bar ── */}
      <Card elevation={0} sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            {/* Free-text search — debouncing not implemented; sends a request on every keystroke */}
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
              size="small"
              sx={{ flexGrow: 1 }}
              InputProps={{ sx: { bgcolor: "background.default" } }}
            />

            {/* Category filter dropdown */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Category</InputLabel>
              <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} label="Category" sx={{ bgcolor: "background.default" }}>
                <MenuItem value="all">All Categories</MenuItem>
                {/* Render one MenuItem per category using the live categories list */}
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.icon} {c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Transaction type filter: show all, only income, or only expenses */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Type</InputLabel>
              <Select value={type} onChange={(e) => setType(e.target.value)} label="Type" sx={{ bgcolor: "background.default" }}>
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expenses</MenuItem>
              </Select>
            </FormControl>

            {/* Clear all filters back to defaults */}
            <Button
              variant="outlined" size="small"
              startIcon={<FilterListOffIcon />}
              onClick={clearFilters}
              sx={{ whiteSpace: "nowrap", borderColor: "divider", color: "text.secondary" }}
            >
              Clear
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Row count indicator */}
      <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5, mb: 1, display: "block" }}>
        {txns.length} transactions
      </Typography>

      {/* ── Data Table ── */}
      <Card elevation={0}>
        <TableContainer>
          <Table size="small">
            {/* ── Table Header ── */}
            <TableHead>
              <TableRow>
                {COLUMNS.map((col) => (
                  <TableCell key={col.id} sx={{ whiteSpace: "nowrap" }}>
                    {col.sortable ? (
                      // TableSortLabel adds the sort arrow icon and aria attributes
                      <TableSortLabel
                        active={orderBy === col.id}   // bold + coloured when this column is active
                        direction={orderBy === col.id ? order : "asc"} // arrow direction
                        onClick={() => handleSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label // non-sortable columns render as plain text
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            {/* ── Table Body ── */}
            <TableBody>
              {/* Empty state row */}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.disabled" }}>
                    No transactions found
                  </TableCell>
                </TableRow>
              )}

              {/* Data rows */}
              {paginated.map((t) => {
                // Find the category object for this transaction's categoryId.
                // Fall back gracefully if the category was deleted.
                const cat = categories.find((c) => c.id === t.categoryId)
                  || { name: "Other", color: "#888", icon: "📦" };

                const isIncome = t.amount > 0; // used to choose green vs red colour

                return (
                  <TableRow key={t.id} hover>
                    {/* Date — formatted as "Jan 15, 2024" */}
                    <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", fontSize: 13 }}>
                      {formatDate(t.date)}
                    </TableCell>

                    {/* Description — truncated with ellipsis if too long */}
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" color="text.primary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.description}
                      </Typography>
                      {/* Source filename shown as a subtitle (which CSV file this came from) */}
                      {t.source && (
                        <Typography variant="caption" color="text.disabled">{t.source}</Typography>
                      )}
                    </TableCell>

                    {/* Amount — green for income, red for expenses. Monospace for alignment. */}
                    <TableCell sx={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: isIncome ? "success.main" : "error.main", whiteSpace: "nowrap" }}>
                      {isIncome ? "+" : ""}{formatCurrency(t.amount)}
                    </TableCell>

                    {/* Category — click the chip to open an inline dropdown */}
                    <TableCell>
                      {editId === t.id ? (
                        // Inline dropdown: replaces the chip while editing
                        <Select
                          autoFocus   // open the dropdown immediately on render
                          size="small"
                          defaultValue={t.categoryId}
                          onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                          onBlur={() => setEditId(null)} // close without saving if user clicks away
                          sx={{ fontSize: 12, minWidth: 160 }}
                        >
                          {categories.map((c) => (
                            <MenuItem key={c.id} value={c.id}>{c.icon} {c.name}</MenuItem>
                          ))}
                        </Select>
                      ) : (
                        // Normal chip — click to enter edit mode for this row
                        <Tooltip title="Click to change category">
                          <span onClick={() => setEditId(t.id)}>
                            <CategoryChip category={cat} />
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>

                    {/* Balance — running account balance (may be null if not in CSV) */}
                    <TableCell sx={{ fontFamily: "'IBM Plex Mono', monospace", color: "text.disabled", fontSize: 13, whiteSpace: "nowrap" }}>
                      {/* Use != null (not !==) to catch both null and undefined */}
                      {t.balance != null ? formatCurrency(t.balance) : "—"}
                    </TableCell>

                    {/* Delete button */}
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

        {/* ── Pagination Controls ── */}
        {/* count={txns.length} tells MUI how many total rows there are for page calculation */}
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
