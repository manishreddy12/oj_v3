'use strict';

const express = require('express');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const RBACMiddleware = require('../middlewares/RBACMiddleware');

class ContestRoutes {
  constructor(contestController) {
    this.router = express.Router();
    this.contestController = contestController;
    this.authMiddleware = new AuthMiddleware();
    this._initializeRoutes();
  }

  _initializeRoutes() {
    // Public: list all contests
    this.router.get('/', this.contestController.getAllContests());

    // Auth required for contest detail (for access control check)
    this.router.get(
      '/:id',
      this.authMiddleware.authenticate(),
      this.contestController.getContestById()
    );

    // Auth required: leaderboard (access gated in controller)
    this.router.get(
      '/:id/leaderboard',
      this.authMiddleware.authenticate(),
      this.contestController.getLeaderboard()
    );

    // Auth required: register for a contest
    this.router.post(
      '/:id/register',
      this.authMiddleware.authenticate(),
      this.contestController.registerForContest()
    );

    // Admin only: create contest
    this.router.post(
      '/',
      this.authMiddleware.authenticate(),
      RBACMiddleware.authorize('admin'),
      this.contestController.createContest()
    );

    // Admin only: publish rankings
    this.router.put(
      '/:id/publish-rankings',
      this.authMiddleware.authenticate(),
      RBACMiddleware.authorize('admin'),
      this.contestController.publishRankings()
    );

    // Admin only: delete contest
    this.router.delete(
      '/:id',
      this.authMiddleware.authenticate(),
      RBACMiddleware.authorize('admin'),
      this.contestController.deleteContest()
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ContestRoutes;
