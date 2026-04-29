'use strict';

const express = require('express');

class SubmissionRoutes {
  constructor(submissionController) {
    this.router = express.Router();
    this.submissionController = submissionController;
    this._initializeRoutes();
  }

  _initializeRoutes() {
    // Submit code
    this.router.post('/', this.submissionController.submitCode());

    // Get submission status by ID
    this.router.get('/:id', this.submissionController.getSubmissionStatus());

    // Get all submissions by user
    this.router.get('/user/:userId', this.submissionController.getUserSubmissions());

    // Get all submissions for a problem
    this.router.get('/problem/:problemId', this.submissionController.getProblemSubmissions());

    // AI endpoints (fake implementations for now)
    this.router.post('/explain', this.submissionController.explainCode());
    this.router.post('/debug', this.submissionController.debugCode());
  }

  getRouter() {
    return this.router;
  }
}

module.exports = SubmissionRoutes;
