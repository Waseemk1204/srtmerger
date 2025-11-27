const app = require('../server/index');
const { connectDB } = require('../server/config/db');

module.exports = async (req, res) => {
    // Ensure database is connected before handling request
    await connectDB();
    return app(req, res);
};
