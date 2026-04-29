'use strict';

/**
 * Abstract base class for language executors (Strategy Pattern)
 */
class BaseExecutor {
  constructor(language) {
    if (new.target === BaseExecutor) {
      throw new Error('BaseExecutor is abstract and cannot be instantiated directly');
    }
    this.language = language;
  }

  getFileExtension() {
    throw new Error('getFileExtension() must be implemented by subclass');
  }

  getCompileCommand(filePath, outputPath) {
    throw new Error('getCompileCommand() must be implemented by subclass');
  }

  getExecuteCommand(filePath) {
    throw new Error('getExecuteCommand() must be implemented by subclass');
  }

  requiresCompilation() {
    return false;
  }
}

module.exports = BaseExecutor;
