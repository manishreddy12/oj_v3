'use strict';

const Logger = require('../../shared/logger/Logger');

/**
 * To be fully implemented when an AI provider is integrated.
 */
class AIService {
  constructor() {
    this.logger = new Logger('AIService');
  }

  async explainCode(sourceCode, language) {
    this.logger.info('AI explainCode called (stub)');
    return {
      explanation: 'AI code explanation is not yet implemented. This is a stub response.',
      language,
      codeLength: sourceCode.length,
    };
  }

  async debugCode(sourceCode, language, error) {
    this.logger.info('AI debugCode called (stub)');
    return {
      suggestion: 'AI debugging is not yet implemented. This is a stub response.',
      language,
      error,
    };
  }

  async generateHint(problemDescription) {
    this.logger.info('AI generateHint called (stub)');
    return {
      hint: 'AI hint generation is not yet implemented. This is a stub response.',
    };
  }
}

module.exports = AIService;
