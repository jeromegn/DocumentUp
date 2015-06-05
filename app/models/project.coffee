Github   = require("../../lib/github")
Async    = require("async")
File     = require("fs")
Markdown = require("../../lib/markdown")
redis    = require("../../config/redis")
config   = require("../../config")
ns       = config.redis.namespace


class Project
  @defaults =
    source:           "github"
    twitter:          []
    issues:           true
    travis:           false
    ribbon:           true
    google_analytics: null
    theme:            null
    private:          false

  @_normalizeName: (username, project_name)->
    return "#{username}/#{project_name}".toLowerCase()


  @makeConfig: (config)->
    merged = Object.clone(Project.defaults)
    merged[key] = value for key,value of config
    unless Array.isArray(merged.twitter)
      merged.twitter = [merged.twitter]
    return merged


  # Simple constructor
  constructor: (@username, @project_name)->
    name = Project._normalizeName(@username, @project_name)

    Object.defineProperty this, "config",
      get: -> return @_config || Project.defaults
      set: (config)->
        @_config = Project.makeConfig(config)
        return @_config

    return this


  # Check if the project has all the attributes to consider it complete.
  @prototype.__defineGetter__ "_isComplete", ->
    return @username && @project_name && @compiled && @toc && @config

  @prototype.__defineGetter__ "id", ->
    return Project._normalizeName(@username, @project_name)

  @prototype.__defineGetter__ "name", ->
    return "#{@username}/#{@project_name}"

  @prototype.__defineGetter__ "redisKey", ->
    return "#{ns}:project:#{@id}"

  @prototype.__defineGetter__ "url", ->
    return "https://github.com/#{@name}"

  @prototype.__defineGetter__ "issuesUrl", ->
    return "#{@url}/issues"

  @prototype.__defineGetter__ "travisUrl", ->
    return "http://travis-ci.org/#{@name}"

  @prototype.__defineGetter__ "travisImageUrl", ->
    return "https://secure.travis-ci.org/#{@name}.png?branch=master"


  _parse: (data)->
    parsed = Object.clone(data)
    if data.config
      parsed.config = JSON.parse(data.config)
    if data.toc
      parsed.toc = JSON.parse(data.toc)
    return parsed


  # Retrieve from the DB
  _retrieve: (access_token, callback)->
    redis.hgetall @redisKey, (error, result)=>
      return callback(error) if error
      return callback(null, this) unless result

      try
        @[key] = value for key, value of @_parse(result)
      catch error
        callback(error)

      if @config.private
        Github.authorize access_token, @username, @project_name, (error, authorized)=>
          return callback(error) if error
          return callback() unless authorized
          callback(null, this)
      else
        callback(null, this)

  _saveable: ->
    return {
      username:     @username
      project_name: @project_name
      config:       JSON.stringify(@config)
      toc:          JSON.stringify(@toc)
      source:       @source
      compiled:     @compiled
      updated_at:   Date.now()
    }


  # Save to the DB
  save: (callback)->
    redis.hmset @redisKey, @_saveable(), (error)=>
      callback(error, this)


  # Compile a project's readme
  _compile: ->

    if @source
      try
        @compiled = Markdown.parse(@source)
      catch error
        console.log "Error compiling markdown", error
        console.log @source
      try
        @toc = Markdown.tableOfContents(@source)
      catch error

    return this


  # Gets the readme and config from Github
  update: (access_token, callback)->
    github = new Github(access_token)

    Async.parallel
      config: (done)=>
        Async.waterfall [
          (done)=>
            github.get path: "repos/#{@name}/contents/.documentup.json", (error, status, content)=>
              return done(error) if error
              return done(null, status, content)
          (status, content, done)=>
            return done(null, status, content) if status == 200
            github.get path: "repos/#{@name}/contents/documentup.json", (error, status, content)=>
              return done(error) if error
              return done(null, status, content)
        ], (error, status, content)->
          return done(error) if error
          done(null, status: status, content: content)

      readme: (done)=>
        github.get path: "repos/#{@name}/readme", (error, status, content)=>
          return done(error) if error
          switch status
            when 404
              done()
            when 403
              console.log("403, content:", content)
              done()
            when 200
              done(null, status: status, content: content)
            else
              done(new Error("Can't fetch README for #{@name}")) if status != 200


    , (error, results)=>
      return callback(error) if error
      return callback() unless results.readme
      if results.config.status is 200
        if typeof results.config.content is "object"
          config = results.config.content
        else
          try
            config = JSON.parse(results.config.content)
          catch error
            config = {}
      else
        config = {}

      config.private = true if access_token

      @config = config
      @source = results.readme.content

      @_compile()

      @save callback


  @load: (username, project_name, access_token, callback)->
    project = new Project(username, project_name)

    project._retrieve access_token, (error, project)=>
      return callback(error) if error
      return callback() unless project
      if !project._isComplete
        project.update access_token, callback

      else
        callback(null, project)

module.exports = Project
