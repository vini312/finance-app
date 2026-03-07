/**
 * Categories.jsx — Category Management Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Lets users create and delete spending categories.
 *
 * Each category has:
 *   name  — the display label (e.g. "Food & Dining")
 *   icon  — an emoji shown next to the name everywhere categories appear
 *   color — a hex colour used for the chip background and category pie chart slice
 *
 * DELETION BEHAVIOUR:
 *   Deleting a category does NOT delete its transactions. The backend reassigns
 *   all transactions in that category to "Other" (id "8") before removing it.
 *
 * PROPS:
 *   categories {Category[]} — current list, passed down from App.jsx's useCategories hook
 *   onRefresh  {Function}   — called after create/delete to re-fetch categories + bump refresh
 */

import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Grid, IconButton, Alert, Stack, Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon           from "@mui/icons-material/Add";
import { api } from "../api/api";

export default function Categories({ categories, onRefresh }) {
  // ── Form State ───────────────────────────────────────────────────────────
  const [newName,  setNewName]  = useState("");        // text input for category name
  const [newIcon,  setNewIcon]  = useState("📁");      // emoji input — default folder
  const [newColor, setNewColor] = useState("#7c6af7"); // colour picker — default purple

  // ── Feedback State ───────────────────────────────────────────────────────
  const [error,   setError]   = useState(null);   // error message from the API
  const [success, setSuccess] = useState(false);  // true for 3 seconds after successful creation

  /**
   * Sends the new category to the API and updates the UI.
   * The name field is required; icon and color have defaults so they're optional.
   */
  const handleCreate = async () => {
    if (!newName.trim()) return; // guard against empty name (button is disabled but belt-and-suspenders)

    setError(null);
    setSuccess(false);

    try {
      await api.createCategory({
        name:  newName.trim(), // trim whitespace from user input
        icon:  newIcon,
        color: newColor,
      });

      // Reset form to defaults for the next category
      setNewName("");
      setNewIcon("📁");

      // Show a success message for 3 seconds, then hide it
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Tell parent to re-fetch categories and bump the refresh counter
      onRefresh();

    } catch (e) {
      setError(e.message);
    }
  };

  /**
   * Deletes a category after confirming with the user.
   * The warning explains that transactions will be re-assigned to "Other",
   * so users understand the action doesn't lose transaction data.
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? Its transactions will move to 'Other'.")) return;
    await api.deleteCategory(id);
    onRefresh(); // re-fetch categories to remove the deleted card from the grid
  };

  return (
    <Box>
      {/* ── Create Form ── */}
      <Card elevation={0} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Add Category</Typography>

          {/* Responsive row: stacks vertically on mobile, horizontal on wider screens */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            {/* Emoji input — large font so the emoji is easy to see and select */}
            <TextField
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              label="Emoji"
              size="small"
              sx={{ width: 90, "& input": { fontSize: 22, textAlign: "center" } }}
              InputProps={{ sx: { bgcolor: "background.default" } }}
            />

            {/* Category name — pressing Enter submits the form */}
            <TextField
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              label="Category name"
              size="small"
              sx={{ flexGrow: 1 }}
              InputProps={{ sx: { bgcolor: "background.default" } }}
            />

            {/* Native colour picker — <input type="color"> opens the OS colour picker */}
            <Tooltip title="Pick a colour">
              <Box
                component="input"
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                sx={{
                  width: 48, height: 40,
                  border: "1px solid", borderColor: "divider",
                  borderRadius: 1, cursor: "pointer",
                  p: "2px", bgcolor: "background.default",
                }}
              />
            </Tooltip>

            {/* Submit button — disabled until a name is typed */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              disabled={!newName.trim()} // prevent submitting with an empty name
            >
              Add
            </Button>
          </Stack>

          {/* Feedback messages below the form */}
          {error   && <Alert severity="error"   sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>Category added!</Alert>}
        </CardContent>
      </Card>

      {/* ── Category Grid ── */}
      <Typography variant="subtitle2" color="text.disabled" mb={1.5}>
        {categories.length} categories
      </Typography>

      {/* Responsive grid: 1 col on mobile, 2 on sm, 3 on md, 4 on lg */}
      <Grid container spacing={2}>
        {categories.map((cat) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
            <Card
              elevation={0}
              sx={{
                border:      "1px solid",
                // Use the category's own colour at low opacity for the border
                borderColor: cat.color + "44", // "44" = ~27% opacity in hex
                transition:  "border-color 0.2s",
                "&:hover":   { borderColor: cat.color }, // full-opacity border on hover
              }}
            >
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: "12px !important" }}>
                {/* Left side: emoji + name + coloured underline */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography fontSize={28}>{cat.icon}</Typography>
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {cat.name}
                    </Typography>
                    {/* Thin coloured bar under the name — a visual indicator of the category colour */}
                    <Box sx={{ width: 36, height: 3, borderRadius: 2, bgcolor: cat.color, mt: 0.5 }} />
                  </Box>
                </Box>

                {/* Right side: delete button */}
                <IconButton
                  size="small"
                  onClick={() => handleDelete(cat.id)}
                  sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
