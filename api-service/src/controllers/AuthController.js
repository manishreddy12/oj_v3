'use strict';

const RegisterUserDTO = require('../dtos/RegisterUserDTO');
const LoginDTO = require('../dtos/LoginDTO');
const ResponseFormatter = require('../utils/ResponseFormatter');

class AuthController {

  constructor(authService) {
    this.authService = authService;
  }

   // POST /api/auth/register
  register() {
    return async (req, res, next) => {
      try {
        const dto = new RegisterUserDTO(req.body);
        dto.validate();

        const user = await this.authService.registerUser(dto);
        return ResponseFormatter.success(res, 201, 'User registered successfully', { user });
      } catch (error) {
        next(error);
      }
    };
  }


   //POST /api/auth/login
  login() {
    return async (req, res, next) => {
      try {
        const dto = new LoginDTO(req.body);
        dto.validate();

        const result = await this.authService.loginUser(dto);
        return ResponseFormatter.success(res, 200, 'Login successful', result);
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = AuthController;
