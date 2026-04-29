'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Logger = require('../../shared/logger/Logger');

/**
 * Runs code directly on the host OS using execSync.
 * Used for local development (EXECUTION_MODE=direct).
 */
class DirectRunner {
  constructor() {
    this.logger = new Logger('DirectRunner');
    this.tempDir = path.join(os.tmpdir(), 'oj_code_runner');
    this._ensureTempDir();
  }

  _ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  _getFilePath(extension) {
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return path.join(this.tempDir, `solution_${uniqueId}${extension}`);
  }

  writeSourceFile(sourceCode, extension) {
    const filePath = this._getFilePath(extension);
    fs.writeFileSync(filePath, sourceCode, 'utf-8');
    return filePath;
  }

  compile(compileCommand, timeoutMs = 30000) {
    try {
      execSync(compileCommand, {
        timeout: timeoutMs,
        stdio: 'pipe',
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.stderr ? error.stderr.toString() : error.message,
      };
    }
  }

  execute(executeCommand, input = '', timeoutMs = 10000) {
    const startTime = process.hrtime.bigint();
    try {
      const output = execSync(executeCommand, {
        input,
        timeout: timeoutMs,
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1e6; // ms

      return {
        output: output.toString().trim(),
        executionTime: Math.round(executionTime),
      };
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1e6;

      if (error.killed) {
        return {
          output: '',
          executionTime: Math.round(executionTime),
          error: 'Time Limit Exceeded',
        };
      }

      return {
        output: '',
        executionTime: Math.round(executionTime),
        error: error.stderr ? error.stderr.toString() : error.message,
      };
    }
  }

  cleanup(...filePaths) {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        this.logger.warn(`Failed to clean up file: ${filePath}`, { error: error.message });
      }
    }
  }
}

module.exports = DirectRunner;
