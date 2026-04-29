'use strict';

const CreateProblemDTO = require('../dtos/CreateProblemDTO');
const ResponseFormatter = require('../utils/ResponseFormatter');

class ProblemController {

  constructor(problemService) {
    this.problemService = problemService;
  }

  // POST /api/problems
  createProblem() {
    return async (req, res, next) => {
      try {
        const dto = new CreateProblemDTO(req.body);
        dto.validate();
        const problem = await this.problemService.createProblem(dto, req.user.userId);
        return ResponseFormatter.success(res, 201, 'Problem created successfully', { problem });
      } catch (error) {
        next(error);
      }
    };
  }

  // GET /api/problems?difficulty=&tags=&page=&limit=
  getProblems() {
    return async (req, res, next) => {
      try {
        const filter = {
          difficulty: req.query.difficulty,
          tags: req.query.tags,
        };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await this.problemService.getProblems(filter, page, limit);
        return ResponseFormatter.success(res, 200, 'Problems retrieved successfully', result);
      } catch (error) {
        next(error);
      }
    };
  }

  // GET /api/problems/:id
  getProblemById() {
    return async (req, res, next) => {
      try {
        const problem = await this.problemService.getProblemById(req.params.id);
        return ResponseFormatter.success(res, 200, 'Problem retrieved successfully', { problem });
      } catch (error) {
        next(error);
      }
    };
  }

  // PUT /api/problems/:id
  updateProblem() {
    return async (req, res, next) => {
      try {
        const problem = await this.problemService.updateProblem(req.params.id, req.body);
        return ResponseFormatter.success(res, 200, 'Problem updated successfully', { problem });
      } catch (error) {
        next(error);
      }
    };
  }

  // DELETE /api/problems/:id
  deleteProblem() {
    return async (req, res, next) => {
      try {
        await this.problemService.deleteProblem(req.params.id);
        return ResponseFormatter.success(res, 200, 'Problem deleted successfully');
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = ProblemController;
