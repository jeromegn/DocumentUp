Request = require("request")
Async   = require("async")
logger  = require("../config/logger")
config  = require("../config")
QS      = require("qs")

file_matchers = require("./matchers")

GITHUB_API = "https://api.github.com"
GITHUB_RAW = "https://raw.github.com"

# Static class to handle Github API requests
class Github

  constructor: (@accessToken, params)->
    @setDefaultBranch params

  post: (params, callback)->
    params = Object.clone(params)
    params.method = "POST"
    @_request(params, callback)


  get: (params, callback)->
    params = Object.clone(params)
    @_request(params, callback)


  getFile: (path, callback)->
    @_getRaw path: path, callback


  defaultBranchCallBack: (error, status, content) =>
    @defaultBranch = "master" if error or status isnt 200
    @defaultBranch = content.master_branch ? content.default_branch ? "master"

  setDefaultBranch: (params)->
    params = Object.clone(params)
    @_request(params, @defaultBranchCallBack)

  _headers: ->
    headers =
      "Accept": "application/vnd.github.beta.raw+json"

    # Got an access token kiddo?
    headers["Authorization"] = "bearer #{@accessToken}" if @accessToken

    return headers


  # Get a file's raw contents
  _getRaw: (params, callback)->
    #params.headers = @_headers()
    params.method = "GET"

    # Build URL
    params.url    = "#{GITHUB_RAW}/#{params.path}"
    params.url   += "?access_token=#{@accessToken}" if @accessToken
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

  @oauthUrl: (redirect_path)->
    "https://github.com/login/oauth/authorize?client_id=#{config.github.client_id}&scope=user,repo&redirect_uri=#{encodeURIComponent(config.base_uri+redirect_path)}"

  @getAccessToken: (code, callback)->
    opts =
      uri: "https://github.com/login/oauth/access_token?client_id=#{config.github.client_id}&client_secret=#{config.github.client_secret}&code=#{code}"
      method: "POST"
    Request opts, (error, resp, body)->
      return callback(error) if error
      try
        if access_token = QS.parse(body).access_token
          callback(null, access_token)
        else
          callback()
      catch error
        callback(error)

  @authorize: (access_token, username, repository, callback)->
    github = new Github(access_token)
    github.get path: "repos/#{username}/#{repository}", (error, status, content)->
      return callback(error) if error
      return callback(null, false) unless status == 200
      callback(null, true)

module.exports = Github