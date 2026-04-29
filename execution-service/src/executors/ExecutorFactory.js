'use strict';

const CppExecutor = require('./CppExecutor');
const PythonExecutor = require('./PythonExecutor');
const CExecutor = require('./CExecutor');
const AppError = require('../../shared/errors/AppError');

class ExecutorFactory {
  constructor() {
    this.executors = {
      cpp: new CppExecutor(),
      python: new PythonExecutor(),
      c: new CExecutor(),
    };
  }

  /**
   * Get the correct executor based on language
   * @param {string} language
   * @returns {BaseExecutor}
   */
  getExecutor(language) {
    const executor = this.executors[language];
    if (!executor) {
      throw AppError.badRequest(`Unsupported language: ${language}. Supported: ${Object.keys(this.executors).join(', ')}`);
    }
    return executor;
  }

  // Get all supported languages
  getSupportedLanguages() {
    return Object.keys(this.executors);
  }
}

module.exports = ExecutorFactory;
