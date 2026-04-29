'use strict';

const express = require('express');
const cors = require('cors');

// Models
const Submission = require('./models/Submission');

// Repositories
const SubmissionRepository = require('./repositories/SubmissionRepository');

// Services
const SubmissionService = require('./services/SubmissionService');
const JudgeService = require('./services/JudgeService');
const AIService = require('./services/AIService');

// Controller & Routes
const SubmissionController = require('./controllers/SubmissionController');
const SubmissionRoutes = require('./routes/SubmissionRoutes');

// Shared
const AppError = require('../shared/errors/AppError');
const Logger = require('../shared/logger/Logger');
// const AppError = require('../../shared/errors/AppError');
// const Logger = require('../../shared/logger/Logger');

class App {
  constructor() {
    this.app = express();
    this.logger = new Logger('ExecutionApp');

    this._initializeMiddleware();
    this._initializeDependencies();
    this._initializeRoutes();
    this._initializeErrorHandling();
  }

  
  _initializeMiddleware() {
    const corsOptions = {
      origin: "*",
      credentials: false,
    };

    this.app.use(cors(corsOptions));
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));
  }
  // _initializeMiddleware() {
  //   const allowedOrigins = [
  //     process.env.FRONTEND_URL || 'http://localhost:5173',
  //     process.env.API_SERVICE_URL || 'http://localhost:5000',
  //   ];
  //   const corsOptions = {
  //     origin: process.env.NODE_ENV === 'production'
  //       ? allowedOrigins
  //       : '*',
  //     credentials: true,
  //   };
  //   this.app.use(cors(corsOptions));
  //   this.app.use(express.json({ limit: '10mb' }));
  //   this.app.use(express.urlencoded({ extended: true }));
  // }

  _initializeDependencies() {
    const submissionRepository = new SubmissionRepository(Submission);
    const judgeService = new JudgeService();
    const aiService = new AIService();

    this.submissionService = new SubmissionService(submissionRepository, judgeService);
    this.submissionController = new SubmissionController(this.submissionService, aiService);
  }

  _initializeRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Execution Service is running',
        timestamp: new Date().toISOString(),
      });
    });

    // Mount submission routes
    const submissionRoutes = new SubmissionRoutes(this.submissionController);
    this.app.use('/api/submissions', submissionRoutes.getRouter());

    // 404 handler
    this.app.all('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
      });
    });
  }

  _initializeErrorHandling() {
    this.app.use((err, req, res, _next) => {
      if (err instanceof AppError) {
        this.logger.warn(`Operational error: ${err.message}`);
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }

      // Mongoose errors
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
      }

      if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: `Invalid ID: ${err.value}` });
      }

      this.logger.error('Unexpected error', { message: err.message, stack: err.stack });
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    });
  }

  getApp() {
    return this.app;
  }
}

module.exports = App;
