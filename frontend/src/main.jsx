/**
 * main.jsx — Vite entry point (replaces CRA's src/index.js)
 * React 19: createRoot API is unchanged, StrictMode still supported
 */
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
