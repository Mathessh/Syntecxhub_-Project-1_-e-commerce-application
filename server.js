require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder with clean html extension resolution
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath, { extensions: ['html'] }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'Chandra Bazzar E-Commerce API',
    database: 'connected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Clean admin root fallback
app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin', 'dashboard.html'));
});

// Fallback for non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    // Check if file exists without extension or with .html
    const cleanPath = req.path.replace(/^\//, '');
    const htmlFile = path.join(publicPath, `${cleanPath}.html`);
    const directFile = path.join(publicPath, cleanPath);

    if (require('fs').existsSync(htmlFile)) {
      return res.sendFile(htmlFile);
    }
    if (require('fs').existsSync(directFile) && require('fs').statSync(directFile).isFile()) {
      return res.sendFile(directFile);
    }

    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   🛒 Chandra Bazzar Server Running!      ║
  ║   📍 http://localhost:${PORT}               ║
  ║   🌿 Fresh & Daily Needs                 ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => console.log('HTTP server closed'));
});
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => console.log('HTTP server closed'));
});

