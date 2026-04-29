'use strict';

class ContestRepository {
  constructor(contestModel) {
    this.contestModel = contestModel;
  }


  async create(contestData) {
    const contest = new this.contestModel(contestData);
    return contest.save();
  }

  async findById(id) {
    return this.contestModel
      .findById(id)
      .populate('problems', 'title difficulty tags')
      .populate('createdBy', 'username email')
      .populate('participants', 'username email');
  }

  async findAll(filter = {}) {
    return this.contestModel
      .find(filter)
      .populate('createdBy', 'username email')
      .sort({ startTime: -1 });
  }

  async update(id, updateData) {
    return this.contestModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return this.contestModel.findByIdAndDelete(id);
  }

  async addParticipant(contestId, userId) {
    return this.contestModel.findByIdAndUpdate(
      contestId,
      { $addToSet: { participants: userId } },
      { new: true }
    );
  }
}

module.exports = ContestRepository;
