'use strict';

class UserRepository {
  constructor(userModel) {
    this.userModel = userModel;
  }

  async create(userData) {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findById(id) {
    return this.userModel.findById(id);
  }

  async findByEmail(email) {
    return this.userModel.findOne({ email }).select('+password');
  }

  async findByUsername(username) {
    return this.userModel.findOne({ username });
  }

  
  async findAll() {
    return this.userModel.find();
  }

  
  async update(id, updateData) {
    return this.userModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return this.userModel.findByIdAndDelete(id);
  }
}

module.exports = UserRepository;
