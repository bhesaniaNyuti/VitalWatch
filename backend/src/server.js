const app = require('./app');
const { PORT } = require('./config/env');

const startServer = async () => {
    try {
        console.log('Starting server with in-memory data store.');

        const basePort = Number(PORT) || 5000;
        const listen = (portToUse) => {
            const server = app.listen(portToUse, () => {
                console.log(`Server running in ${process.env.NODE_ENV} mode on port ${portToUse}`);
            });

            server.on('error', (error) => {
                if (error && error.code === 'EADDRINUSE') {
                    const nextPort = portToUse + 1;
                    console.warn(`Port ${portToUse} is busy. Retrying on port ${nextPort}...`);
                    listen(nextPort);
                    return;
                }

                console.error('Server failed to start:', error);
                process.exit(1);
            });
        };

        listen(basePort);
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
