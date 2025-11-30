import app from './app.js';
import { connectDB } from './config/db.js';
import { validateEnvironment } from './utils/envValidation.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        // Validate environment variables first
        validateEnvironment();

        await connectDB();

        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on http://localhost:${PORT}`);
            console.log(`📡 API available at http://localhost:${PORT}/api`);
            console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

startServer();
