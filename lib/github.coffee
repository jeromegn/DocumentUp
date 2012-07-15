Request = require("request")
Async   = require("async")
logger  = require("../config/logger")

file_matchers = require("./matchers")

GITHUB_API = "https://api.github.com"
GITHUB_RAW = "https://raw.github.com"

# Static class to handle Github API requests
class Github

  constructor: (@accessToken)->


  post: (params, callback)->
    params = Object.clone(params)
    params.method = "POST"
    @_request(params, callback)


  get: (params, callback)->
    params = Object.clone(params)
    @_request(params, callback)


  getFile: (path, callback)->
    @_getRaw path: path, callback


  _headers: ->
    headers =
      "Accept": "application/vnd.github.beta.raw+json"

    # Got an access token kiddo?
    headers["Authorization"] = "token #{@accessToken}" if @accessToken

    return headers


  # Get a file's raw contents
  _getRaw: (params, callback)->
    params.headers = @_headers()
    params.method = "GET"

    # Build URL
    params.url    = "#{GITHUB_RAW}/#{params.path}"
    delete params.path

    logger.info "#{params.method} #{params.url}"

    try
    
      Request params, (error, response, body)->
        if error
          logger.error "#{params.method} #{params.url} => #{error.message}"
          return callback(error)

        logger.info "#{params.method} #{params.url} => #{response.statusCode}"

        callback(null, response.statusCode, body)
    
    catch error
      logger.error "#{params.method} #{params.url} => #{error.message}"
      process.nextTick ->
        callback error


  _request: (params, callback)->
    params.headers = @_headers()

    # Default to GET
    params.method = "GET"

    # Build URL
    params.url    = "#{GITHUB_API}/#{params.path}"
    delete params.path

    logger.info "#{params.method} #{params.url}"

    try
    
      Request params, (error, response, body)->
        if error
          logger.error "#{params.method} #{params.url} => #{error.message}"
          return callback(error)

        logger.info "#{params.method} #{params.url} => #{response.statusCode}"

        if body && body.length > 0
          try
            body = JSON.parse(body)
          catch error
        callback(null, response.statusCode, body)
    
    catch error
      logger.error "#{params.method} #{params.url} => #{error.message}"
      process.nextTick ->
        callback error


module.exports = Github