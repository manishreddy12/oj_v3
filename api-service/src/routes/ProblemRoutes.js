'use strict';

const express = require('express');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const RBACMiddleware = require('../middlewares/RBACMiddleware');

class ProblemRoutes {
  constructor(problemController) {
    this.router = express.Router();
    this.problemController = problemController;
    this.authMiddleware = new AuthMiddleware();
    this._initializeRoutes();
  }

  _initializeRoutes() {
    // Public routes
    this.router.get('/', this.problemController.getProblems());
    this.router.get('/:id', this.problemController.getProblemById());

    // Protected routes — authentication required
    this.router.use(this.authMiddleware.authenticate());

    // Only problem_setter or admin can create/update problems
    this.router.post(
      '/',
      RBACMiddleware.authorize('problem_setter', 'admin'),
      this.problemController.createProblem()
    );

    this.router.put(
      '/:id',
      RBACMiddleware.authorize('problem_setter', 'admin'),
      this.problemController.updateProblem()
    );

    // Only admin can delete problems
    this.router.delete(
      '/:id',
      RBACMiddleware.authorize('admin'),
      this.problemController.deleteProblem()
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ProblemRoutes;
