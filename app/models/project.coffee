Github   = require("../../lib/github")
Async    = require("async")
File     = require("fs")
Markdown = require("../../lib/markdown")
redis    = require("../../config/redis")
config   = require("../../config")
ns       = config.redis.namespace

github = new Github()

class Project
  @defaults =
    source:           "github"
    twitter:          []
    issues:           true
    travis:           false
    ribbon:           true
    google_analytics: null
    theme:            null

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
  _retrieve: (callback)->
    redis.hgetall @redisKey, (error, result)=>
      return callback(error) if error
      return callback(null, this) unless result
      try
        @[key] = value for key, value of @_parse(result)
      catch error
        callback(error)
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

      try
        @toc = Markdown.tableOfContents(@source)
      catch error

    return this


  # Gets the readme and config from Github
  update: (callback)->
    Async.parallel
      config: (done)=>
        Async.waterfall [
          (done)=>
            github.getFile "#{@name}/master/.documentup.json", (error, status, content)->
              return done(error) if error
              return done(null, status, content)
          (status, content, done)=>
            return done(null, status, content) if status == 200
            github.getFile "#{@name}/master/documentup.json", (error, status, content)->
              return done(error) if error
              return done(null, status, content)
        ], (error, status, content)->
          return done(error) if error
          done(null, status: status, content: content)

      readme: (done)=>
        github.get path: "repos/#{@name}/readme", (error, status, content)->
          return done(error) if error
          return done(new Error("Can't fetch README for #{@name}")) if status != 200
          done(null, status: status, content: content)
    , (error, results)=>
      return callback(error) if error
      try
        config = JSON.parse(results.config.content)
      catch error
        config = {}

      @config = config
      @source = results.readme.content

      @_compile()

      @save callback


  @load: (username, project_name, callback)->
    project = new Project(username, project_name)
    
    if project._isComplete
      return callback(null, project)
    else
      project._retrieve (error, project)=>
        return callback(error) if error
        if !project._isComplete
          project.update (error)=>
            return callback(error) if error
            project.save callback

        else
          callback(null, project)



module.exports = Project