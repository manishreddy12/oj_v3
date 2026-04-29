'use strict';

const express = require('express');

class AuthRoutes {
  
  constructor(authController) {
    this.router = express.Router();
    this.authController = authController;
    this._initializeRoutes();
  }

  _initializeRoutes() {
    this.router.post('/register', this.authController.register());
    this.router.post('/login', this.authController.login());
  }

  getRouter() {
    return this.router;
  }
}

module.exports = AuthRoutes;
