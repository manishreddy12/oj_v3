'use strict';

const AppError = require('../../shared/errors/AppError');
const Logger = require('../../shared/logger/Logger');

class AuthService {
  
  constructor(userRepository, passwordHasher, tokenManager) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenManager = tokenManager;
    this.logger = new Logger('AuthService');
  }

  async registerUser(registerDTO) {
    const existingEmail = await this.userRepository.findByEmail(registerDTO.email);
    if (existingEmail) {
      throw AppError.conflict('Email already registered');
    }

    const existingUsername = await this.userRepository.findByUsername(registerDTO.username);
    if (existingUsername) {
      throw AppError.conflict('Username already taken');
    }

    const hashedPassword = await this.passwordHasher.hash(registerDTO.password);

    const user = await this.userRepository.create({
      username: registerDTO.username,
      email: registerDTO.email,
      password: hashedPassword,
      role: registerDTO.role,
      userimage: registerDTO.userimage,
    });

    this.logger.info(`User registered: ${user.email}`);

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  
  async loginUser(loginDTO) {
    const user = await this.userRepository.findByEmail(loginDTO.email);
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await this.passwordHasher.compare(loginDTO.password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const token = this.generateToken(user);

    this.logger.info(`User logged in: ${user.email}`);

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, token };
  }

  /**
   * Generate a JWT token for a user
   * @param {object} user
   * @returns {string}
   */
  generateToken(user) {
    return this.tokenManager.generateToken({
      userId: user._id,
      role: user.role,
    });
  }
}

module.exports = AuthService;
