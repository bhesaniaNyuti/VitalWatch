const app = require('./app');
const connectDB = require('./config/db');
const { PORT, MONGO_URI } = require('./config/env');
const { startEmbeddedMongo } = require('./config/embeddedDb');

const startServer = async () => {
    try {
        // If a MongoDB URI is provided via environment/config, use that.
        if (MONGO_URI) {
            console.log('Using external MongoDB instance.');
            await connectDB();
        } else {
            // Otherwise, fall back to starting the embedded MongoDB instance.
            console.log('No MONGO_URI provided. Starting embedded MongoDB instance...');
            const embeddedUri = await startEmbeddedMongo();
            process.env.MONGO_URI = embeddedUri;
            await connectDB();
        }

        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
