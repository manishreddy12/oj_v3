'use strict';

class SubmissionRepository {
  constructor(submissionModel) {
    this.submissionModel = submissionModel;
  }

  async create(submissionData) {
    const submission = new this.submissionModel(submissionData);
    return submission.save();
  }

  async findById(id) {
    return this.submissionModel.findById(id);
  }

  async findAll(filter = {}) {
    return this.submissionModel.find(filter).sort({ createdAt: -1 });
  }

  async findByUserId(userId) {
    return this.submissionModel.find({ user: userId }).sort({ createdAt: -1 });
  }

  /**
   * Get recent submissions for a user, limited to `limit` entries
   */
  async findByUserIdRecent(userId, limit = 30) {
    return this.submissionModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findByProblemId(problemId) {
    return this.submissionModel.find({ problem: problemId }).sort({ createdAt: -1 });
  }

  /**
   * Find submissions by both user and problem (for contest scoring)
   */
  async findByUserAndProblem(userId, problemId) {
    return this.submissionModel
      .find({ user: userId, problem: problemId })
      .sort({ createdAt: -1 });
  }

  async update(id, updateData) {
    return this.submissionModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return this.submissionModel.findByIdAndDelete(id);
  }
}

module.exports = SubmissionRepository;
