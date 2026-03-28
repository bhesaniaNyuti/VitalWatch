const app = require('./app');
const { PORT } = require('./config/env');

const startServer = async () => {
    try {
        console.log('Starting server with in-memory data store.');

        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
