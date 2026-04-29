'use strict';

const BaseExecutor = require('./BaseExecutor');

class PythonExecutor extends BaseExecutor {
  constructor() {
    super('python');
  }

  getFileExtension() {
    return '.py';
  }

  getCompileCommand(filePath, outputPath) {
    // Mo need to compile Python code
    return null;
  }

  getExecuteCommand(filePath) {
    return `python3 ${filePath}`;
  }

  requiresCompilation() {
    return false;
  }
}

module.exports = PythonExecutor;
