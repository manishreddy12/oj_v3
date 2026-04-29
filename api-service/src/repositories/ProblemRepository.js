'use strict';

class ProblemRepository {
  constructor(problemModel) {
    this.problemModel = problemModel;
  }

  async create(problemData) {
    const problem = new this.problemModel(problemData);
    return problem.save();
  }

  async findById(id) {
    return this.problemModel.findById(id).populate('createdBy', 'username email');
  }

  async findAll(filter = {}) {
    return this.problemModel
      .find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
  }

  /**
   * Paginated findAll with total count
   */
  async findAllPaginated(filter = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [problems, total] = await Promise.all([
      this.problemModel
        .find(filter)
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.problemModel.countDocuments(filter),
    ]);

    return {
      problems,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id, updateData) {
    return this.problemModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return this.problemModel.findByIdAndDelete(id);
  }
}

module.exports = ProblemRepository;
