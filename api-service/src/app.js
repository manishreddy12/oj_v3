'use strict';

const express = require('express');
const cors = require('cors');
const ServiceFactory = require('./factories/ServiceFactory');
const ErrorMiddleware = require('./middlewares/ErrorMiddleware');
const appConfig = require('./config/AppConfig');

class App {
  constructor() {
    this.app = express();
    this.factory = new ServiceFactory();
    this.errorMiddleware = new ErrorMiddleware();

    this._initializeMiddleware();
    this._initializeRoutes();
    this._initializeErrorHandling();
  }

  /**
   * Setup global middleware
   */
  _initializeMiddleware() {
    const corsOptions = {
      origin: appConfig.nodeEnv === 'production'
        ? appConfig.frontendUrl
        : '*',
      credentials: true,
    };
    this.app.use(cors(corsOptions));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  /**
   * Setup API routes
   */
  _initializeRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'API Service is running',
        timestamp: new Date().toISOString(),
      });
    });

    // Mount routes
    this.app.use('/api/auth', this.factory.getAuthRoutes().getRouter());
    this.app.use('/api/problems', this.factory.getProblemRoutes().getRouter());
    this.app.use('/api/users', this.factory.getUserRoutes().getRouter());
    this.app.use('/api/contests', this.factory.getContestRoutes().getRouter());

    // 404 handler
    this.app.all('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
      });
    });
  }

  /**
   * Setup centralized error handling
   */
  _initializeErrorHandling() {
    this.app.use(this.errorMiddleware.handleError());
  }

  /**
   * Initialize async services (Redis, etc.)
   */
  async initializeAsync() {
    await this.factory.initRedis();
  }

  /**
   * Get the Express app instance
   */
  getApp() {
    return this.app;
  }
}

module.exports = App;
