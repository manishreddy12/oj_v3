'use strict';

const CreateContestDTO = require('../dtos/CreateContestDTO');
const ResponseFormatter = require('../utils/ResponseFormatter');
const AppError = require('../../shared/errors/AppError');

class ContestController {
  constructor(contestService) {
    this.contestService = contestService;
  }

  /** POST /api/contests */
  createContest() {
    return async (req, res, next) => {
      try {
        const dto = new CreateContestDTO(req.body);
        dto.validate();
        const contest = await this.contestService.createContest(dto, req.user.userId);
        return ResponseFormatter.success(res, 201, 'Contest created successfully', { contest });
      } catch (error) {
        next(error);
      }
    };
  }

  /** GET /api/contests */
  getAllContests() {
    return async (req, res, next) => {
      try {
        const contests = await this.contestService.getAllContests();
        return ResponseFormatter.success(res, 200, 'Contests retrieved successfully', { contests });
      } catch (error) {
        next(error);
      }
    };
  }

  /** GET /api/contests/:id */
  getContestById() {
    return async (req, res, next) => {
      try {
        const userId = req.user ? req.user.userId : null;
        const userRole = req.user ? req.user.role : null;
        const contest = await this.contestService.getContestWithAccess(
          req.params.id, userId, userRole
        );
        return ResponseFormatter.success(res, 200, 'Contest retrieved successfully', { contest });
      } catch (error) {
        next(error);
      }
    };
  }

  /** POST /api/contests/:id/register */
  registerForContest() {
    return async (req, res, next) => {
      try {
        const contest = await this.contestService.registerForContest(
          req.params.id,
          req.user.userId
        );
        return ResponseFormatter.success(res, 200, 'Registered for contest successfully', { contest });
      } catch (error) {
        next(error);
      }
    };
  }

  /** GET /api/contests/:id/leaderboard */
  getLeaderboard() {
    return async (req, res, next) => {
      try {
        const result = await this.contestService.getLeaderboard(req.params.id);

        // If rankings not published and contest not ended, check if user is admin
        if (!result.isEnded && !result.rankingsPublished) {
          if (!req.user || req.user.role !== 'admin') {
            return ResponseFormatter.success(res, 200, 'Leaderboard not available yet', {
              message: 'Rankings will be available after the contest ends',
            });
          }
        }

        // If contest ended but rankings not published, only admin can see
        if (result.isEnded && !result.rankingsPublished) {
          if (!req.user || req.user.role !== 'admin') {
            return ResponseFormatter.success(res, 200, 'Rankings pending admin approval', {
              message: 'Rankings will be published by the admin',
            });
          }
        }

        return ResponseFormatter.success(res, 200, 'Leaderboard retrieved successfully', result);
      } catch (error) {
        next(error);
      }
    };
  }

  /** PUT /api/contests/:id/publish-rankings */
  publishRankings() {
    return async (req, res, next) => {
      try {
        const contest = await this.contestService.publishRankings(req.params.id);
        return ResponseFormatter.success(res, 200, 'Rankings published successfully', { contest });
      } catch (error) {
        next(error);
      }
    };
  }

  /** DELETE /api/contests/:id */
  deleteContest() {
    return async (req, res, next) => {
      try {
        await this.contestService.deleteContest(req.params.id);
        return ResponseFormatter.success(res, 200, 'Contest deleted successfully');
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = ContestController;
