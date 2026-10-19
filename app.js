const path = require('path');
const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/task.routes');
const aiRoutes = require('./routes/ai.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Serve frontend from public/
app.use(express.static(path.join(__dirname, 'public')));

// Health check (also serves the frontend at /)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Manager API is running',
  });
});

// API routes
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
