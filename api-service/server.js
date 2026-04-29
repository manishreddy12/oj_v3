'use strict';

require('dotenv').config();

const App = require('./src/app');
const Database = require('./src/config/Database');
const appConfig = require('./src/config/AppConfig');
const Logger = require('./shared/logger/Logger');

const logger = new Logger('Server');

async function startServer() {
  try {
    // Connect to MongoDB
    const database = new Database();
    await database.connect(appConfig.mongoUri);

    // Create and start Express app
    const app = new App();
    await app.initializeAsync(); // Connect Redis (graceful fallback if unavailable)
    const server = app.getApp();

    server.listen(appConfig.port, () => {
      logger.info(`API Service running on port ${appConfig.port}`);
      logger.info(`Environment: ${appConfig.nodeEnv}`);
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
