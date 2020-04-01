const fetch = require('node-fetch')
const jwt = require('jsonwebtoken')

const Config = require('./config')
const errors = require('./errors')

const { RuntimeError, ServiceError } = errors

class Lateral {
  constructor(config) {
    this.config = new Config(config)
  }

  buildOptions(opts) {
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

  buildURL(event, options) {
    const baseURL = this.config.get('url')
    const async = options.async

    return `${baseURL}/api/cloud_functions/by_event/${event}/run?async=${async}`
  }

  signJWT(account, expiresIn) {
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

  async parseResponse(response, options) {
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
    const options = this.buildOptions(opts)
    const token = this.signJWT(account, options.tokenExpiresIn)

    const response = await fetch(this.buildURL(event, options), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: data && JSON.stringify(data),
    })

    return this.parseResponse(response, options)
  }

  runAsync(args) {
    return this.run({ ...args, async: true })
  }

  runSync(args) {
    return this.run({ ...args, async: false })
  }

  generateEditorURL({ account, tokenExpiresIn = '24h' }) {
    const baseURL = this.config.get('url')
    const token = this.signJWT(account, tokenExpiresIn)

    return `${baseURL}/editor?token=${token}`
  }
}

module.exports = Lateral
module.exports.Config = Config
module.exports.errors = errors
