'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Logger = require('../../shared/logger/Logger');

/**
 * Runs user code inside a Docker container pulled from ECR.
 * Used for EC2/production deployments (EXECUTION_MODE=docker).
 *
 * Container is ephemeral: --rm removes it after execution.
 * Security: --network=none, --memory, --cpus limits.
 */
class DockerRunner {
  constructor() {
    this.logger = new Logger('DockerRunner');
    this.dockerImage = process.env.DOCKER_IMAGE || 'oj-runner:latest';
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
    // compileCommand is a host-side command like "g++ -o /tmp/.../sol /tmp/.../sol.cpp"
    // We need to run it inside Docker, mapping the temp dir
    const fileName = compileCommand.split(' ').pop(); // source file path
    const dir = path.dirname(fileName);

    const dockerCmd = `docker run --rm --network=none --memory=256m --cpus=1 -v "${dir}:/code" ${this.dockerImage} sh -c "cd /code && ${this._toContainerCommand(compileCommand, dir)}"`;

    try {
      execSync(dockerCmd, {
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
    const dir = path.dirname(executeCommand.split(' ').pop());
    const containerCmd = this._toContainerCommand(executeCommand, dir);

    const dockerCmd = `docker run --rm -i --network=none --memory=256m --cpus=1 -v "${dir}:/code" ${this.dockerImage} sh -c "cd /code && ${containerCmd}"`;

    const startTime = process.hrtime.bigint();
    try {
      const output = execSync(dockerCmd, {
        input,
        timeout: timeoutMs,
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024,
      });
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1e6;

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

  /**
   * Convert host-side paths to container-side paths.
   * Host: /tmp/oj_code_runner/solution_xxx.cpp → Container: /code/solution_xxx.cpp
   */
  _toContainerCommand(command, hostDir) {
    // Replace host temp dir with /code in the command
    const normalized = hostDir.replace(/\\/g, '/');
    return command.replace(new RegExp(normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '/code');
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

module.exports = DockerRunner;
