const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const notificationRoutes = require('./routes/notification.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// Serve frontend static files
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  /\.railway\.app$/,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// SPA fallback — serve frontend for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
