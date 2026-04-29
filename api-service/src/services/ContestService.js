'use strict';

const AppError = require('../../shared/errors/AppError');
const Logger = require('../../shared/logger/Logger');
const Submission = require('../models/Submission');

class ContestService {
  constructor(contestRepository, problemRepository, redisClient) {
    this.contestRepository = contestRepository;
    this.problemRepository = problemRepository;
    this.redisClient = redisClient;
    this.logger = new Logger('ContestService');
  }

  async createContest(createContestDTO, createdBy) {
    // Validate that all problem IDs exist
    if (createContestDTO.problems.length > 0) {
      await this._validateProblemIds(createContestDTO.problems);
    }

    const contest = await this.contestRepository.create({
      title: createContestDTO.title,
      description: createContestDTO.description,
      problems: createContestDTO.problems,
      startTime: new Date(createContestDTO.startTime),
      endTime: new Date(createContestDTO.endTime),
      registrationDeadline: createContestDTO.registrationDeadline
        ? new Date(createContestDTO.registrationDeadline)
        : null,
      isPublic: createContestDTO.isPublic,
      createdBy,
    });

    this.logger.info(`Contest created: ${contest.title}`);

    // Invalidate contest list cache
    await this.redisClient.delete('contest:list');

    return contest;
  }

  async getAllContests() {
    const cached = await this.redisClient.get('contest:list');
    if (cached) {
      this.logger.info('Contests served from cache');
      return cached;
    }

    const contests = await this.contestRepository.findAll();
    await this.redisClient.set('contest:list', contests);
    return contests;
  }

  async getContestById(id, userId = null) {
    const cacheKey = `contest:${id}`;
    const cached = await this.redisClient.get(cacheKey);
    let contest = cached;

    if (!contest) {
      contest = await this.contestRepository.findById(id);
      if (!contest) {
        throw AppError.notFound('Contest not found');
      }
      await this.redisClient.set(cacheKey, contest);
    }

    return contest;
  }

  /**
   * Get contest with problems visibility check.
   * Non-participants can't see problems during an active contest.
   */
  async getContestWithAccess(id, userId, userRole) {
    const contest = await this.getContestById(id);
    const contestObj = contest.toJSON ? contest.toJSON() : contest;
    const now = new Date();

    const isParticipant = contestObj.participants?.some(
      (p) => (p._id || p).toString() === userId
    );
    const isAdmin = userRole === 'admin';

    // During active contest, non-participants can't see problems
    if (now >= new Date(contestObj.startTime) && now <= new Date(contestObj.endTime)) {
      if (!isParticipant && !isAdmin) {
        contestObj.problems = [];
        contestObj._accessDenied = true;
      }
    }

    // After contest ends, problems are visible to everyone
    // Before contest starts, problems are hidden from non-admins
    if (now < new Date(contestObj.startTime) && !isAdmin) {
      contestObj.problems = [];
    }

    return contestObj;
  }

  async registerForContest(contestId, userId) {
    const contest = await this.contestRepository.findById(contestId);
    if (!contest) {
      throw AppError.notFound('Contest not found');
    }

    // Check registration deadline
    if (contest.registrationDeadline && new Date() > contest.registrationDeadline) {
      throw AppError.badRequest('Registration deadline has passed');
    }

    // Check if contest already ended
    if (new Date() > contest.endTime) {
      throw AppError.badRequest('Contest has already ended');
    }

    const alreadyRegistered = contest.participants.some(
      (p) => p.toString() === userId
    );
    if (alreadyRegistered) {
      throw AppError.conflict('Already registered for this contest');
    }

    const updated = await this.contestRepository.addParticipant(contestId, userId);
    this.logger.info(`User ${userId} registered for contest ${contestId}`);

    // Invalidate contest cache
    await this.redisClient.delete(`contest:${contestId}`);
    await this.redisClient.delete('contest:list');

    return updated;
  }

  /**
   * Generate leaderboard for a contest.
   * Scoring: Accepted = 100pts, best submission selected per problem per user.
   * Tie-breaking: total execution time (lower is better).
   */
  async getLeaderboard(contestId) {
    const contest = await this.contestRepository.findById(contestId);
    if (!contest) {
      throw AppError.notFound('Contest not found');
    }

    const now = new Date();
    const isEnded = now > contest.endTime;

    // Rankings visible only after contest ends or if published
    if (!isEnded && !contest.rankingsPublished) {
      // During contest, return a limited live leaderboard
    }

    const leaderboard = [];

    for (const participant of contest.participants) {
      const userId = participant._id || participant;
      const username = participant.username || 'Unknown';

      let totalScore = 0;
      let totalTime = 0;
      let totalMemory = 0;
      let solvedCount = 0;
      const problemResults = [];

      for (const problem of contest.problems) {
        const problemId = problem._id || problem;
        const submissions = await Submission.find({
          user: userId,
          problem: problemId,
          createdAt: { $gte: contest.startTime, $lte: contest.endTime },
        }).sort({ createdAt: -1 });

        // Find best submission (Accepted > others, then by execution time)
        let bestSubmission = null;
        for (const sub of submissions) {
          if (!bestSubmission) {
            bestSubmission = sub;
          } else if (sub.status === 'Accepted' && bestSubmission.status !== 'Accepted') {
            bestSubmission = sub;
          } else if (
            sub.status === 'Accepted' &&
            bestSubmission.status === 'Accepted' &&
            sub.executionTime < bestSubmission.executionTime
          ) {
            bestSubmission = sub;
          }
        }

        if (bestSubmission) {
          const score = bestSubmission.status === 'Accepted' ? 100 : 0;
          totalScore += score;
          totalTime += bestSubmission.executionTime || 0;
          totalMemory += bestSubmission.memoryUsed || 0;
          if (bestSubmission.status === 'Accepted') solvedCount++;

          problemResults.push({
            problemId: problemId.toString(),
            problemTitle: problem.title || '',
            status: bestSubmission.status,
            executionTime: bestSubmission.executionTime || 0,
            memoryUsed: bestSubmission.memoryUsed || 0,
            attempts: submissions.length,
            score,
          });
        } else {
          problemResults.push({
            problemId: problemId.toString(),
            problemTitle: problem.title || '',
            status: 'Not Attempted',
            executionTime: 0,
            memoryUsed: 0,
            attempts: 0,
            score: 0,
          });
        }
      }

      leaderboard.push({
        userId: userId.toString(),
        username,
        totalScore,
        solvedCount,
        totalTime,
        totalMemory,
        problemResults,
      });
    }

    // Sort: by totalScore (desc), then totalTime (asc), then totalMemory (asc)
    leaderboard.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (a.totalTime !== b.totalTime) return a.totalTime - b.totalTime;
      return a.totalMemory - b.totalMemory;
    });

    // Add rank
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return {
      contestId: contest._id,
      contestTitle: contest.title,
      isEnded,
      rankingsPublished: contest.rankingsPublished,
      leaderboard,
    };
  }

  async publishRankings(contestId) {
    const contest = await this.contestRepository.findById(contestId);
    if (!contest) {
      throw AppError.notFound('Contest not found');
    }

    const updated = await this.contestRepository.update(contestId, {
      rankingsPublished: true,
    });

    this.logger.info(`Rankings published for contest ${contestId}`);
    await this.redisClient.delete(`contest:${contestId}`);
    await this.redisClient.delete('contest:list');

    return updated;
  }

  async deleteContest(contestId) {
    const contest = await this.contestRepository.delete(contestId);
    if (!contest) {
      throw AppError.notFound('Contest not found');
    }
    this.logger.info(`Contest deleted: ${contest.title}`);
    await this.redisClient.delete(`contest:${contestId}`);
    await this.redisClient.delete('contest:list');
    return contest;
  }

  async addProblemToContest(contestId, problemId) {
    const contest = await this.contestRepository.findById(contestId);
    if (!contest) {
      throw AppError.notFound('Contest not found');
    }

    await this._validateProblemIds([problemId]);

    const alreadyAdded = contest.problems.some(
      (p) => (p._id || p).toString() === problemId
    );
    if (alreadyAdded) {
      throw AppError.conflict('Problem already added to this contest');
    }

    const updated = await this.contestRepository.update(contestId, {
      $addToSet: { problems: problemId },
    });

    this.logger.info(`Problem ${problemId} added to contest ${contestId}`);
    await this.redisClient.delete(`contest:${contestId}`);
    await this.redisClient.delete('contest:list');
    return updated;
  }

  async _validateProblemIds(problemIds) {
    for (const id of problemIds) {
      const problem = await this.problemRepository.findById(id);
      if (!problem) {
        throw AppError.badRequest(`Problem not found: ${id}`);
      }
    }
  }
}

module.exports = ContestService;
