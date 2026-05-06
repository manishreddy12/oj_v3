'use strict';

const AppError = require('../../shared/errors/AppError');
const Logger = require('../../shared/logger/Logger');

class SubmissionService {
  constructor(submissionRepository, judgeService) {
    this.submissionRepository = submissionRepository;
    this.judgeService = judgeService;
    this.logger = new Logger('SubmissionService');
  }

  async createSubmission(submitCodeDTO) {
    // Create submission in Pending state
    const submission = await this.submissionRepository.create({
      user: submitCodeDTO.userId,
      username: submitCodeDTO.username,
      problem: submitCodeDTO.problemId,
      problemTitle: submitCodeDTO.problemTitle,
      language: submitCodeDTO.language,
      sourceCode: submitCodeDTO.sourceCode,
      status: 'Pending',
    });

    this.logger.info(`Submission created: ${submission._id}`);

    // Judge the code
    try {
      const verdict = this.judgeService.generateVerdict(
        submitCodeDTO.language,
        submitCodeDTO.sourceCode,
        submitCodeDTO.testCases
      );

      // Update submission with full verdict details
      const updatedSubmission = await this.submissionRepository.update(submission._id, {
        status: verdict.status,
        executionTime: verdict.executionTime,
        memoryUsed: verdict.memoryUsed,
        output: verdict.output || '',
        error: verdict.error || '',
        failedTestCase: verdict.failedTestCase,
        totalTestCases: verdict.totalTestCases,
        expectedOutput: verdict.expectedOutput || '',
      });

      this.logger.info(`Submission ${submission._id} judged: ${verdict.status}`);
      return updatedSubmission;
    } catch (error) {
      // Mark as Runtime Error if judging fails unexpectedly
      // FIX: Return the error-updated submission instead of re-throwing
      const errorSubmission = await this.submissionRepository.update(submission._id, {
        status: 'Runtime Error',
        error: error.message || 'Unexpected judging error',
      });
      this.logger.error(`Judging failed for submission ${submission._id}`, {
        error: error.message,
      });
      return errorSubmission;
    }
  }

  async getSubmissionStatus(submissionId) {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) {
      throw AppError.notFound('Submission not found');
    }
    return submission;
  }

  async getUserSubmissions(userId, limit = 30) {
    return this.submissionRepository.findByUserIdRecent(userId, limit);
  }

  async getProblemSubmissions(problemId) {
    return this.submissionRepository.findByProblemId(problemId);
  }

  async getGlobalLeaderboard() {
    return this.submissionRepository.getGlobalLeaderboard(50);
  }
}

module.exports = SubmissionService;
