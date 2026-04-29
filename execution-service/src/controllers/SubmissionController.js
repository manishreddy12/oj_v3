'use strict';

const SubmitCodeDTO = require('../dtos/SubmitCodeDTO');
const AppError = require('../../shared/errors/AppError');

class SubmissionController {
  constructor(submissionService, aiService) {
    this.submissionService = submissionService;
    this.aiService = aiService;
  }

  /**
   * POST /api/submissions
   */
  submitCode() {
    return async (req, res, next) => {
      try {
        const dto = new SubmitCodeDTO(req.body);
        dto.validate();

        const submission = await this.submissionService.createSubmission(dto);

        return res.status(201).json({
          success: true,
          message: 'Code submitted and judged successfully',
          data: { submission },
        });
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * GET /api/submissions/:id
   */
  getSubmissionStatus() {
    return async (req, res, next) => {
      try {
        const submission = await this.submissionService.getSubmissionStatus(req.params.id);
        return res.status(200).json({
          success: true,
          message: 'Submission retrieved successfully',
          data: { submission },
        });
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * GET /api/submissions/user/:userId
   */
  getUserSubmissions() {
    return async (req, res, next) => {
      try {
        const submissions = await this.submissionService.getUserSubmissions(req.params.userId);
        return res.status(200).json({
          success: true,
          message: 'User submissions retrieved successfully',
          data: { submissions },
        });
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * GET /api/submissions/problem/:problemId
   */
  getProblemSubmissions() {
    return async (req, res, next) => {
      try {
        const submissions = await this.submissionService.getProblemSubmissions(req.params.problemId);
        return res.status(200).json({
          success: true,
          message: 'Problem submissions retrieved successfully',
          data: { submissions },
        });
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * POST /api/submissions/explain (AI stub)
   */
  explainCode() {
    return async (req, res, next) => {
      try {
        const { sourceCode, language } = req.body;
        if (!sourceCode || !language) {
          throw AppError.badRequest('sourceCode and language are required');
        }
        const result = await this.aiService.explainCode(sourceCode, language);
        return res.status(200).json({
          success: true,
          message: 'Code explanation generated',
          data: result,
        });
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * POST /api/submissions/debug (AI stub)
   */
  debugCode() {
    return async (req, res, next) => {
      try {
        const { sourceCode, language, error: codeError } = req.body;
        if (!sourceCode || !language) {
          throw AppError.badRequest('sourceCode and language are required');
        }
        const result = await this.aiService.debugCode(sourceCode, language, codeError);
        return res.status(200).json({
          success: true,
          message: 'Debug suggestion generated',
          data: result,
        });
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = SubmissionController;
