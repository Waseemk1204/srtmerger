import app from '../server/app.js';
import { connectDB } from '../server/config/db.js';

export default async (req, res) => {
    try {
        // Ensure database is connected before handling request
        await connectDB();

        console.log('App type:', typeof app);
        // Handle potential ESM default export wrapping
        const handler = typeof app === 'function' ? app : app.default;

        if (typeof handler !== 'function') {
            throw new Error(`Exported app is not a function. Received: ${typeof handler}`);
        }

        return handler(req, res);
    } catch (error) {
        console.error('Vercel Function Error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
