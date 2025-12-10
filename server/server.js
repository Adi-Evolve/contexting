import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import memoryRoutes from './routes/memories.js';
import knowledgeGraphRoutes from './routes/knowledge-graph.js';
import compressionRoutes from './routes/compression.js';
import analyticsRoutes from './routes/analytics.js';
import searchRoutes from './routes/search.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// MIDDLEWARE
// =======================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow chrome extensions
  crossOriginEmbedderPolicy: false
}));

// CORS - Allow Chrome extensions
app.use(cors({
  origin: (origin, callback) => {
    // Allow chrome extensions and localhost
    if (!origin || 
        origin.startsWith('chrome-extension://') || 
        origin.startsWith('http://localhost') ||
        origin.startsWith('https://memoryforge.ai')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Compression
app.use(compression({
  threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 10000
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// =======================
// ROUTES
// =======================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
app.use('/api/compression', compressionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MemoryForge API',
    version: '1.0.0',
    description: 'Advanced AI Memory System with Knowledge Graph & Compression',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      memories: '/api/memories',
      knowledgeGraph: '/api/knowledge-graph',
      compression: '/api/compression',
      analytics: '/api/analytics',
      search: '/api/search'
    },
    documentation: 'https://docs.memoryforge.ai'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: ['/health', '/api/auth', '/api/memories', '/api/knowledge-graph', '/api/compression', '/api/analytics', '/api/search']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// =======================
// START SERVER
// =======================

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║           🧠 MemoryForge Server Started! 🚀            ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  🌐 Server running on: http://localhost:${PORT}`);
  console.log(`  📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔒 CORS enabled for Chrome extensions`);
  console.log(`  ⚡ Compression: ${process.env.COMPRESSION_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`  🧮 Knowledge Graph: ${process.env.ENABLE_KNOWLEDGE_GRAPH === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log('');
  console.log('  Available endpoints:');
  console.log('  ├─ GET  /health');
  console.log('  ├─ POST /api/auth/register');
  console.log('  ├─ POST /api/auth/login');
  console.log('  ├─ GET  /api/memories');
  console.log('  ├─ POST /api/memories');
  console.log('  ├─ GET  /api/knowledge-graph');
  console.log('  ├─ GET  /api/compression/stats');
  console.log('  ├─ GET  /api/analytics');
  console.log('  └─ POST /api/search');
  console.log('');
  console.log('  📖 Press Ctrl+C to stop');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
