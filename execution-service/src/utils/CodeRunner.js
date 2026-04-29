'use strict';

const DirectRunner = require('./DirectRunner');
const DockerRunner = require('./DockerRunner');
const Logger = require('../../shared/logger/Logger');

/**
 * Facade that delegates to DirectRunner or DockerRunner
 * based on EXECUTION_MODE env var.
 *
 * - EXECUTION_MODE=direct (default): run on host via execSync
 * - EXECUTION_MODE=docker: run inside Docker container from ECR
 */
class CodeRunner {
  constructor() {
    this.logger = new Logger('CodeRunner');
    const mode = process.env.EXECUTION_MODE || 'direct';

    if (mode === 'docker') {
      this.logger.info('Using DockerRunner (EXECUTION_MODE=docker)');
      this.runner = new DockerRunner();
    } else {
      this.logger.info('Using DirectRunner (EXECUTION_MODE=direct)');
      this.runner = new DirectRunner();
    }
  }

  writeSourceFile(sourceCode, extension) {
    return this.runner.writeSourceFile(sourceCode, extension);
  }

  compile(compileCommand, timeoutMs) {
    return this.runner.compile(compileCommand, timeoutMs);
  }

  execute(executeCommand, input, timeoutMs) {
    return this.runner.execute(executeCommand, input, timeoutMs);
  }

  cleanup(...filePaths) {
    return this.runner.cleanup(...filePaths);
  }
}

module.exports = CodeRunner;
