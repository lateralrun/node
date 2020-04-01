const BaseError = require('./base')

class RuntimeError extends BaseError {
  constructor(source) {
    super(`${source.name}: ${source.message}`)

    this.source = source
  }
}

module.exports = RuntimeError
