const BaseError = require('./base')

class ServiceError extends BaseError {
  constructor({ status, title, message = '' }) {
    super(message ? `${title}: ${message}` : title)

    this.status = status
    this.title = title
  }
}

module.exports = ServiceError
