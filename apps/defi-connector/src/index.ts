import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import apiRoutes from './routes/api.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
    // eslint-disable-next-line no-console
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    });
});

// API routes
app.use('/api/ton', apiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 DeFi Connector server running on port ${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`📖 API Documentation: http://localhost:${PORT}/api/ton/meta`);
    // eslint-disable-next-line no-console
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;
