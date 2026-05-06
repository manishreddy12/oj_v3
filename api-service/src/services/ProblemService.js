'use strict';

const AppError = require('../../shared/errors/AppError');
const Logger = require('../../shared/logger/Logger');

class ProblemService {
  constructor(problemRepository, redisClient) {
    this.problemRepository = problemRepository;
    this.redisClient = redisClient;
    this.logger = new Logger('ProblemService');
  }

  async createProblem(createProblemDTO, createdBy) {
    const problem = await this.problemRepository.create({
      ...createProblemDTO,
      createdBy,
    });
    this.logger.info(`Problem created: ${problem.title}`);

    // Invalidate problem list cache
    await this.redisClient.delete('problems:list');

    return problem;
  }

  async getProblems(filter = {}, page = 1, limit = 20) {
    const query = { is_deleted: { $ne: true } };
    if (filter.difficulty) {
      query.difficulty = filter.difficulty;
    }
    if (filter.tags) {
      query.tags = { $in: Array.isArray(filter.tags) ? filter.tags : [filter.tags] };
    }
    if (filter.search) {
      query.title = { $regex: filter.search, $options: 'i' };
    }

    const hasFilter = filter.difficulty || filter.tags || filter.search;

    // Only cache unfiltered, first-page results
    if (!hasFilter && page === 1) {
      const cached = await this.redisClient.get('problems:list');
      if (cached) {
        this.logger.info('Problems served from cache');
        return cached;
      }
    }

    const result = await this.problemRepository.findAllPaginated(query, page, limit);

    // Cache unfiltered first page
    if (!hasFilter && page === 1) {
      await this.redisClient.set('problems:list', result);
    }

    return result;
  }

  async getProblemById(id) {
    const cacheKey = `problem:${id}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) {
      this.logger.info(`Problem ${id} served from cache`);
      return cached;
    }

    const problem = await this.problemRepository.findById(id);
    if (!problem || problem.is_deleted) {
      throw AppError.notFound('Problem not found');
    }

    await this.redisClient.set(cacheKey, problem);
    return problem;
  }

  async updateProblem(id, updateData) {
    const problem = await this.problemRepository.update(id, updateData);
    if (!problem) {
      throw AppError.notFound('Problem not found');
    }
    this.logger.info(`Problem updated: ${problem.title}`);

    // Invalidate caches
    await this.redisClient.delete(`problem:${id}`);
    await this.redisClient.delete('problems:list');

    return problem;
  }

  async deleteProblem(id) {
    const problem = await this.problemRepository.softDelete(id);
    if (!problem) {
      throw AppError.notFound('Problem not found');
    }
    this.logger.info(`Problem soft-deleted: ${problem.title}`);

    // Invalidate caches
    await this.redisClient.delete(`problem:${id}`);
    await this.redisClient.delete('problems:list');

    return problem;
  }
}

module.exports = ProblemService;
