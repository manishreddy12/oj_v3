'use strict';

const BaseExecutor = require('./BaseExecutor');

class CppExecutor extends BaseExecutor {
  constructor() {
    super('cpp');
  }

  getFileExtension() {
    return '.cpp';
  }

  getCompileCommand(filePath, outputPath) {
    return `g++ -o ${outputPath} ${filePath} -std=c++17`;
  }

  getExecuteCommand(filePath) {
    return filePath;
  }

  requiresCompilation() {
    return true;
  }
}

module.exports = CppExecutor;
