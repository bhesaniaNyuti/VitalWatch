const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

let mongod = null;

const startEmbeddedMongo = async () => {
    try {
        const dbPath = path.join(__dirname, '../../data/db');

        // Ensure data directory exists
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath, { recursive: true });
        }

        mongod = await MongoMemoryServer.create({
            instance: {
                dbPath: dbPath,
                storageEngine: 'wiredTiger', // Persistence requires a storage engine
            },
        });

        const uri = mongod.getUri();
        console.log(`Embedded MongoDB started at: ${uri}`);
        console.log(`Data directory: ${dbPath}`);

        return uri;
    } catch (error) {
        console.error('Failed to start embedded MongoDB:', error);
        throw error;
    }
};

const stopEmbeddedMongo = async () => {
    if (mongod) {
        await mongod.stop();
    }
};

module.exports = { startEmbeddedMongo, stopEmbeddedMongo };
