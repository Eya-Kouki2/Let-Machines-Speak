const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const machineHealthRoutes = require('./routes/machineHealthRoutes');
const machineManagementRoutes = require('./routes/machines');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const { connectDatabase } = require('./config/database');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const databaseStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);

// Basic Routes
app.get('/', (req, res) => {
    res.json({ success: true, message: 'API is running...' });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: databaseStates[mongoose.connection.readyState] || 'unknown',
    });
});

app.use('/api/machines', machineManagementRoutes);
app.use('/api/machines', machineHealthRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

app.use((err, req, res, next) => {
    let statusCode = 500;
    if (err.name === 'ValidationError' || err.name === 'CastError' || err.message?.includes('must') || err.message?.includes('threshold')) {
        statusCode = 400;
    }
    if (err.code === 11000) {
        statusCode = 409;
    }

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
