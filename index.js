const httpRequest = require('simple-nodejs-request')

module.exports = (namespace, eventHttpConfig) => {
  
  /**
  * slice(2) to remove initial application/context/service mount path
  * e.g /x2x/api/products/1 (x2x), /api/products/1, (api)
  */
  function createOrigin(originalUrl, method) {
    const resourcePath = originalUrl.split('/').slice(2).join('/')
    const modifiedResourcePath = resourcePath.replace(/\d+/g, 'x')
    const modifiedOriginalUrl = originalUrl.replace(resourcePath, modifiedResourcePath)
    return [namespace, method, modifiedOriginalUrl].join('.').toLowerCase()
  }
  
  function createEvent(req) {
    const {originalUrl, method, params, query, body} = req
    return {
      origin: createOrigin(originalUrl, method),
      resource_identifiers: {...query, ...params},
      created_at: Date.now(),
      data: body
    }
  }
  
  function createListener() {
    return (req, res, next) => {
      if (!eventHttpConfig) return next()
  
      const {headers} = req
      const {url} = eventHttpConfig
      const options = {
        method: 'POST',
        headers,
        body: createEvent(req)
      }

      res.on('finish', () => {
        const {statusCode} = res
        if (statusCode == '200' || statusCode == '201') httpRequest(url, options)
      })
  
      next()
    }
  }
  
  return {
    createOrigin,
    createEvent,
    createListener
  }
  
}
