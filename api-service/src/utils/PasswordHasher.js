'use strict';

const bcrypt = require('bcrypt');

class PasswordHasher {
  constructor(saltRounds = 12) {
    this.saltRounds = saltRounds;
  }

  async hash(password) {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = PasswordHasher;
