'use strict';

const ExecutorFactory = require('../executors/ExecutorFactory');
const CodeRunner = require('../utils/CodeRunner');
const Logger = require('../../shared/logger/Logger');

class JudgeService {
  constructor() {
    this.executorFactory = new ExecutorFactory();
    this.codeRunner = new CodeRunner();
    this.logger = new Logger('JudgeService');
  }

  compileCode(language, sourceCode) {
    const executor = this.executorFactory.getExecutor(language);
    const filePath = this.codeRunner.writeSourceFile(sourceCode, executor.getFileExtension());

    if (!executor.requiresCompilation()) {
      return { success: true, filePath };
    }

    const outputPath = filePath.replace(executor.getFileExtension(), '');
    const compileCommand = executor.getCompileCommand(filePath, outputPath);
    const result = this.codeRunner.compile(compileCommand);

    if (!result.success) {
      this.codeRunner.cleanup(filePath);
      return { success: false, filePath, error: result.error };
    }

    return { success: true, filePath, outputPath };
  }

  runCode(language, executablePath, input) {
    const executor = this.executorFactory.getExecutor(language);
    const executeCommand = executor.getExecuteCommand(executablePath);
    return this.codeRunner.execute(executeCommand, input);
  }

  /**
   * Normalize output for comparison:
   * - Convert \r\n to \n
   * - Trim trailing whitespace from each line
   * - Trim leading/trailing blank lines
   */
  normalizeOutput(text) {
    if (!text) return '';
    return text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim();
  }

  /**
   * Tokenize a string for flexible comparison.
   * Splits by whitespace only (Codeforces-style plain I/O).
   * e.g., "0 1" → ["0", "1"],  "hello world" → ["hello", "world"]
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .trim()
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  /**
   * Compare outputs using two strategies (Codeforces-style plain I/O):
   * 1. Exact match after whitespace normalization (strict)
   * 2. Flat token comparison — splits all output into whitespace-separated tokens,
   *    ignoring differences in line breaks vs spaces (e.g., "0 1" matches "0\n1")
   */
  compareOutput(actual, expected) {
    const normActual = this.normalizeOutput(actual);
    const normExpected = this.normalizeOutput(expected);

    // Strategy 1: exact match after normalization
    if (normActual === normExpected) return true;

    // Strategy 2: flat token comparison (ignore line structure)
    // Handles minor formatting differences like "1 2 3" vs "1\n2\n3"
    const flatActual = this.tokenize(normActual.replace(/\n/g, ' '));
    const flatExpected = this.tokenize(normExpected.replace(/\n/g, ' '));

    if (flatActual.length !== flatExpected.length) return false;
    for (let i = 0; i < flatActual.length; i++) {
      if (flatActual[i] !== flatExpected[i]) return false;
    }
    return true;
  }

  generateVerdict(language, sourceCode, testCases) {
    // Step 1: Compile
    const compileResult = this.compileCode(language, sourceCode);
    if (!compileResult.success) {
      return {
        status: 'Compilation Error',
        executionTime: 0,
        memoryUsed: 0,
        error: compileResult.error,
        output: '',
        failedTestCase: 0,
        totalTestCases: testCases.length,
        expectedOutput: '',
      };
    }

    const executor = this.executorFactory.getExecutor(language);
    const executablePath = executor.requiresCompilation()
      ? compileResult.outputPath
      : compileResult.filePath;

    let totalExecutionTime = 0;
    let maxMemory = 0;

    // Step 2: Run against each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const runResult = this.runCode(language, executablePath, testCase.input);

      totalExecutionTime += runResult.executionTime || 0;

      // Check for runtime error or TLE
      if (runResult.error) {
        this._cleanup(compileResult);
        if (runResult.error === 'Time Limit Exceeded') {
          return {
            status: 'Time Limit Exceeded',
            executionTime: totalExecutionTime,
            memoryUsed: maxMemory,
            failedTestCase: i + 1,
            totalTestCases: testCases.length,
            output: runResult.output || '',
            expectedOutput: testCase.expectedOutput || '',
            error: 'Time Limit Exceeded',
          };
        }
        return {
          status: 'Runtime Error',
          executionTime: totalExecutionTime,
          memoryUsed: maxMemory,
          failedTestCase: i + 1,
          totalTestCases: testCases.length,
          output: runResult.output || '',
          expectedOutput: testCase.expectedOutput || '',
          error: runResult.error,
        };
      }

      // Step 3: Compare output
      if (!this.compareOutput(runResult.output, testCase.expectedOutput)) {
        this._cleanup(compileResult);
        return {
          status: 'Wrong Answer',
          executionTime: totalExecutionTime,
          memoryUsed: maxMemory,
          failedTestCase: i + 1,
          totalTestCases: testCases.length,
          output: (runResult.output || '').substring(0, 2000), // Limit stored output
          expectedOutput: (testCase.expectedOutput || '').substring(0, 2000),
          error: '',
        };
      }
    }

    this._cleanup(compileResult);

    return {
      status: 'Accepted',
      executionTime: totalExecutionTime,
      memoryUsed: maxMemory,
      failedTestCase: null,
      totalTestCases: testCases.length,
      output: 'All test cases passed',
      expectedOutput: '',
      error: '',
    };
  }

  _cleanup(compileResult) {
    const files = [compileResult.filePath];
    if (compileResult.outputPath) {
      files.push(compileResult.outputPath);
    }
    this.codeRunner.cleanup(...files);
  }
}

module.exports = JudgeService;
