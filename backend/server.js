const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const machineHealthRoutes = require('./routes/machineHealthRoutes');
const machineManagementRoutes = require('./routes/machines');
const usersRoutes = require('./routes/users');
const { connectDatabase } = require('./config/database');

// Load environment variables (supports .env in backend folder or parent folder)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Basic Routes
app.get('/', (req, res) => {
    res.json({ success: true, message: 'API is running...' });
});

app.use('/api/machines', machineManagementRoutes);
app.use('/api/machines', machineHealthRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

app.use((err, req, res, next) => {
    const statusCode = err.name === 'ValidationError' || err.message?.includes('must') || err.message?.includes('threshold') ? 400 : 500;
    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? 'Internal server error' : err.message,
        error: { message: statusCode === 500 ? 'Internal server error' : err.message },
    });
});

async function startServer() {
    await connectDatabase();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

if (require.main === module) {
    startServer().catch((error) => {
        console.error('Unable to start server:', error.message);
        process.exit(1);
    });
}

module.exports = app;
