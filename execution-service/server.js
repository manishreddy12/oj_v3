'use strict';

require('dotenv').config();

const App = require('./src/app');
const Database = require('./src/config/Database');
const Logger = require('./shared/logger/Logger');

const logger = new Logger('Server');

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/online_judge';

async function startServer() {
  try {
    // Connect to MongoDB
    const database = new Database();
    await database.connect(MONGO_URI);

    // Create and start Express app
    const app = new App();
    const server = app.getApp();

    server.listen(PORT, () => {
      logger.info(`Execution Service running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      await database.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      await database.disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();
