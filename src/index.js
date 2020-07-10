const fetch = require('node-fetch')
const jwt = require('jsonwebtoken')

const Config = require('./config')
const errors = require('./errors')

const { RuntimeError, ServiceError } = errors

class Lateral {
  constructor(config) {
    this.config = new Config(config)
  }

  buildURL(path) {
    return `${this.config.get('url')}${path}`
  }

  signJWT({ account = undefined, expiresIn }) {
    return jwt.sign(
      {
        iss: this.config.get('appID'),
        sub: account,
      },
      this.config.get('appSecret'),
      { expiresIn }
    )
  }

  async throwServiceError(response) {
    let json
    let error

    try {
      json = await response.json()
      error = json.errors[0]
    } catch (e) {
      error = {
        status: response.status,
        title: 'Unhandled Error',
      }
    }

    throw new ServiceError(error)
  }

  buildRunOptions(opts) {
    const options = {
      async: true,
      tokenExpiresIn: this.config.get('tokenExpiresIn'),
      ...opts,
    }

    if (options.returnOperation === undefined) {
      options.returnOperation = options.async
    }

    return options
  }

  async parseRunResponse(response, options) {
    if (!response.ok) {
      if (response.status === 404 || response.status === 409) {
        return undefined
      }

      await this.throwServiceError(response)
    }

    const json = await response.json()

    if (options.returnOperation) {
      return json.operation
    }

    if (!json.operation.result) {
      return json.operation.result
    }

    if (json.operation.result.error) {
      throw new RuntimeError(json.operation.result.error)
    }

    return json.operation.result.response
  }

  async run({ account, event, data, ...opts }) {
    const options = this.buildRunOptions(opts)
    const token = this.signJWT({ account, expiresIn: options.tokenExpiresIn })

    const response = await fetch(
      this.buildURL(`/api/cloud_functions/by_event/${event}/run`),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          async: options.async,
          data,
        }),
      }
    )

    return this.parseRunResponse(response, options)
  }

  runAsync(args) {
    return this.run({ ...args, async: true })
  }

  runSync(args) {
    return this.run({ ...args, async: false })
  }

  generateEditorURL({ account, tokenExpiresIn = '24h' }) {
    const token = this.signJWT({ account, expiresIn: tokenExpiresIn })

    return this.buildURL(`/editor?token=${token}`)
  }

  async deleteAccount({
    account,
    tokenExpiresIn = this.config.get('tokenExpiresIn'),
  }) {
    const token = this.signJWT({ expiresIn: tokenExpiresIn })

    const response = await fetch(
      this.buildURL(`/api/accounts/${encodeURIComponent(account)}`),
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      await this.throwServiceError(response)
    }

    return response.json()
  }
}

module.exports = Lateral
module.exports.Config = Config
module.exports.errors = errors
