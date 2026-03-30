/**
 * Sales Dashboard - Express Server Entry Point
 */
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const salesRoutes    = require('./routes/sales');
const errorHandler   = require('./middleware/errorHandler');
const requestLogger  = require('./middleware/requestLogger');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/sales', salesRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler (must be last)
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Sales Dashboard API running on http://localhost:${PORT}`);
});

module.exports = app;
