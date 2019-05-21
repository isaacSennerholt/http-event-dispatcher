const crypto = require('crypto')
const httpRequest = require('simple-nodejs-request')

function assertConfigShape(config, requiredConfigurations = []) {
  if (!config) throw new Error('Event module configuration is missing.')
  return requiredConfigurations.forEach(requiredConfiguration => {
    const isConfigured = Object.keys(config).includes(requiredConfiguration)
    if (!isConfigured)
      throw new Error(`"${requiredConfiguration}" is missing in configuration.`)
    return
  })
}

module.exports = config => {
  assertConfigShape(config, ['namespace', 'url', 'secret'])
  const { namespace, url, secret } = config

  function createEvent(type, data) {
    return {
      type,
      created_at: Date.now(),
      data
    }
  }

  function createDigest(eventObject) {
    return crypto
      .createHmac('sha256', secret)
      .update(Buffer.from(JSON.stringify(eventObject)))
      .digest('base64')
  }

  function dispatch(eventType, { headers = {}, data = {} }) {
    const eventObject = createEvent(eventType, data)
    const digest = createDigest(eventObject)
    return httpRequest(url, {
      method: 'POST',
      headers: {
        ...headers,
        [`${namespace}-hmac-sha256`]: digest
      },
      body: eventObject
    })
  }

  return {
    dispatch
  }
}
