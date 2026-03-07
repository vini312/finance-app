/**
 * main.jsx — Application Entry Point (Vite)
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the first JavaScript file the browser executes. It's referenced
 * directly by a <script type="module"> tag in index.html.
 *
 * Responsibilities:
 *   1. Find the #root DOM element that index.html provides
 *   2. Create a React root attached to it
 *   3. Render the top-level <App /> component into that root
 *
 * StrictMode:
 *   Wrapping the app in <React.StrictMode> enables extra runtime warnings
 *   in development (double-invocation of render, deprecated API warnings, etc.)
 *   It has zero effect in production builds.
 *
 * NOTE: This file was named index.js in Create React App projects.
 *       Vite's convention is main.jsx — the filename is referenced in index.html.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// createRoot is the React 18+ API for concurrent rendering.
// document.getElementById("root") finds the <div id="root"> in index.html.
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
