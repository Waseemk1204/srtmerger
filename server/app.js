import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import paymentRoutes from './routes/payment.js';
import usageRoutes from './routes/usage.js';
import { apiLimiter } from './middleware/rateLimit.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy is required when running behind a proxy like Vercel
// This allows express-rate-limit to correctly identify users via X-Forwarded-For
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    crossOriginOpenerPolicy: false, // Disable COOP to allow Google OAuth popup
}));
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', process.env.FRONTEND_URL].filter(Boolean),
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '20mb' })); // Increased for encrypted files
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/usage', usageRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Export app for use in server/index.js (local) and api/index.js (Vercel)
export default app;
