'use strict';

// Models
const User = require('../models/User');
const Problem = require('../models/Problem');
const Contest = require('../models/Contest');

// Repositories
const UserRepository = require('../repositories/UserRepository');
const ProblemRepository = require('../repositories/ProblemRepository');
const ContestRepository = require('../repositories/ContestRepository');

// Services
const AuthService = require('../services/AuthService');
const ProblemService = require('../services/ProblemService');
const UserService = require('../services/UserService');
const ContestService = require('../services/ContestService');

// Config
const RedisClient = require('../config/RedisClient');
const NoCacheClient = require('../config/NoCacheClient');
const appConfig = require('../config/AppConfig');

// Utils
const PasswordHasher = require('../utils/PasswordHasher');
const TokenManager = require('../utils/TokenManager');

// Controllers
const AuthController = require('../controllers/AuthController');
const ProblemController = require('../controllers/ProblemController');
const UserController = require('../controllers/UserController');
const ContestController = require('../controllers/ContestController');

// Routes
const AuthRoutes = require('../routes/AuthRoutes');
const ProblemRoutes = require('../routes/ProblemRoutes');
const UserRoutes = require('../routes/UserRoutes');
const ContestRoutes = require('../routes/ContestRoutes');

class ServiceFactory {
  constructor() {
    this._instances = {};
  }

  _getOrCreate(key, factory) {
    if (!this._instances[key]) {
      this._instances[key] = factory();
    }
    return this._instances[key];
  }

  // ── Config ──
  getRedisClient() {
    return this._getOrCreate('redisClient', () => {
      if (appConfig.cacheEnabled) {
        return new RedisClient();
      }
      return new NoCacheClient();
    });
  }

  /**
   * Initialize Redis connection (call from app startup)
   */
  async initRedis() {
    const client = this.getRedisClient();
    if (appConfig.cacheEnabled) {
      await client.connect(appConfig.redisUrl);
    } else {
      await client.connect(); // NoCacheClient.connect() is a no-op
    }
    return client;
  }

  // ── Utilities ──
  getPasswordHasher() {
    return this._getOrCreate('passwordHasher', () => new PasswordHasher());
  }

  getTokenManager() {
    return this._getOrCreate('tokenManager', () => new TokenManager());
  }

  // ── Repositories ──
  getUserRepository() {
    return this._getOrCreate('userRepository', () => new UserRepository(User));
  }

  getProblemRepository() {
    return this._getOrCreate('problemRepository', () => new ProblemRepository(Problem));
  }

  getContestRepository() {
    return this._getOrCreate('contestRepository', () => new ContestRepository(Contest));
  }

  // ── Services ──
  getAuthService() {
    return this._getOrCreate('authService', () =>
      new AuthService(
        this.getUserRepository(),
        this.getPasswordHasher(),
        this.getTokenManager()
      )
    );
  }

  getProblemService() {
    return this._getOrCreate('problemService', () =>
      new ProblemService(this.getProblemRepository(), this.getRedisClient())
    );
  }

  getUserService() {
    return this._getOrCreate('userService', () =>
      new UserService(this.getUserRepository())
    );
  }

  getContestService() {
    return this._getOrCreate('contestService', () =>
      new ContestService(
        this.getContestRepository(),
        this.getProblemRepository(),
        this.getRedisClient()
      )
    );
  }

  // ── Controllers ──
  getAuthController() {
    return this._getOrCreate('authController', () =>
      new AuthController(this.getAuthService())
    );
  }

  getProblemController() {
    return this._getOrCreate('problemController', () =>
      new ProblemController(this.getProblemService())
    );
  }

  getUserController() {
    return this._getOrCreate('userController', () =>
      new UserController(this.getUserService())
    );
  }

  getContestController() {
    return this._getOrCreate('contestController', () =>
      new ContestController(this.getContestService())
    );
  }

  // ── Routes ──
  getAuthRoutes() {
    return this._getOrCreate('authRoutes', () =>
      new AuthRoutes(this.getAuthController())
    );
  }

  getProblemRoutes() {
    return this._getOrCreate('problemRoutes', () =>
      new ProblemRoutes(this.getProblemController())
    );
  }

  getUserRoutes() {
    return this._getOrCreate('userRoutes', () =>
      new UserRoutes(this.getUserController())
    );
  }

  getContestRoutes() {
    return this._getOrCreate('contestRoutes', () =>
      new ContestRoutes(this.getContestController())
    );
  }
}

module.exports = ServiceFactory;
