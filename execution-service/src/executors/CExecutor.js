'use strict';

const BaseExecutor = require('./BaseExecutor');

class CExecutor extends BaseExecutor {
  constructor() {
    super('c');
  }

  getFileExtension() {
    return '.c';
  }

  getCompileCommand(filePath, outputPath) {
    return `gcc -o ${outputPath} ${filePath} -lm`;
  }

  getExecuteCommand(filePath) {
    return filePath;
  }

  requiresCompilation() {
    return true;
  }
}

module.exports = CExecutor;
