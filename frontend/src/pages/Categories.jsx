/**
 * Categories.jsx — MUI category management.
 */

import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Grid, IconButton, Alert, Stack, Tooltip, Divider,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { api } from "../api/api";

export default function Categories({ categories, onRefresh }) {
  const [newName,  setNewName]  = useState("");
  const [newIcon,  setNewIcon]  = useState("📁");
  const [newColor, setNewColor] = useState("#7c6af7");
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setError(null);
    setSuccess(false);
    try {
      await api.createCategory({ name: newName.trim(), icon: newIcon, color: newColor });
      setNewName("");
      setNewIcon("📁");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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
    <Box>
      {/* Add form */}
      <Card elevation={0} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Add Category</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <TextField
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              label="Emoji"
              size="small"
              sx={{ width: 90, "& input": { fontSize: 22, textAlign: "center" } }}
              InputProps={{ sx: { bgcolor: "background.default" } }}
            />
            <TextField
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              label="Category name"
              size="small"
              sx={{ flexGrow: 1 }}
              InputProps={{ sx: { bgcolor: "background.default" } }}
            />
            <Tooltip title="Pick a color">
              <Box
                component="input"
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                sx={{
                  width: 48, height: 40, border: "1px solid", borderColor: "divider",
                  borderRadius: 1, cursor: "pointer", p: "2px", bgcolor: "background.default",
                }}
              />
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              disabled={!newName.trim()}
            >
              Add
            </Button>
          </Stack>
          {error   && <Alert severity="error"   sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>Category added!</Alert>}
        </CardContent>
      </Card>

      {/* Category grid */}
      <Typography variant="subtitle2" color="text.disabled" mb={1.5}>
        {categories.length} categories
      </Typography>
      <Grid container spacing={2}>
        {categories.map((cat) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: cat.color + "44",
                transition: "border-color 0.2s",
                "&:hover": { borderColor: cat.color },
              }}
            >
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: "12px !important" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography fontSize={28}>{cat.icon}</Typography>
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {cat.name}
                    </Typography>
                    <Box
                      sx={{ width: 36, height: 3, borderRadius: 2, bgcolor: cat.color, mt: 0.5 }}
                    />
                  </Box>
                </Box>
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
