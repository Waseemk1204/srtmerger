import app from '../server/app.js';
import { connectDB } from '../server/config/db.js';

export default async (req, res) => {
    try {
        // Ensure database is connected before handling request
        await connectDB();
        return app(req, res);
    } catch (error) {
        console.error('Vercel Function Error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
