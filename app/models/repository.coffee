Github  = require("../../lib/github")
Async   = require("async")
File    = require("fs")
marked_ = require("marked")
redis   = require("../../config/redis")
config  = require("../../config")
ns      = config.redis.namespace
hljs    = require("../../lib/highlighter.js")

# Modification of the markdown parser
#
# This is necessary to both highlight the code and
# add browsable IDs (via /#some-id) to each heading
Marked = (text) ->
  current_h2 = null
  tokens = marked_.lexer(text)
  l = tokens.length
  i = 0
  token = undefined
  while i < l
    token = tokens[i]
    if token.type is "heading"
      to_param = token.text.parameterize()
      if token.depth == 2
        current_h2 = to_param
        token.depth = "#{token.depth} id='#{to_param}'"
      else if token.depth == 3
        token.depth = "#{token.depth} id='#{current_h2}/#{to_param}'"
    else if token.type is "code"
      if token.lang in Object.keys(hljs.LANGUAGES)
        token.text = hljs.highlight(token.lang, token.text).value
      else
        token.text = hljs.highlightAuto(token.text).value
      token.escaped = true;
    i++
  text = marked_.parser(tokens)
  text


class Repository
  @list = {}

  @defaults =
    twitter:          null
    issues:           true
    travis:           false
    ribbon:           true
    google_analytics: null
    theme:            null


  constructor: (@name)->


  isComplete: ->
    return @name && @compiled && @toc && @config


  getFiles: (callback)->
    Github.getBlobsFor @name, (err, files)=>
      return callback(err) if err
      @source = files.readme
      @setConfig(files.config)
      callback(null, @)


  @createConfig = (config)->
    conf = Object.clone(Repository.defaults)
    conf[key] = value for key,value of config
    return conf

  setConfig: (config)->
    @config = Repository.createConfig(config)
    return @config


  # Retrieve from the DB
  retrieve: (callback)->
    Async.parallel
      config: (done)=>
        redis.get "#{ns}:repo:#{@name}:config", (err, config)->
          done(err, JSON.parse(config))
      source: (done)=>
        redis.get "#{ns}:repo:#{@name}:source", done
      compiled: (done)=>
        redis.get "#{ns}:repo:#{@name}:compiled", done
      toc: (done)=>
        redis.get "#{ns}:repo:#{@name}:toc", (err, toc)->
          done(err, JSON.parse(toc))
      updated_at: (done)=>
        redis.get "#{ns}:repo:#{@name}:updated_at", (err, updated_at)->
          done(err, parseInt(updated_at, 10))
    , (err, repo)=>
      return callback(err) if err
      @[key] = value for key, value of repo
      @config ||= Repository.defaults
      callback(err, this)


  # Save to the DB
  save: (callback)->
    Async.parallel
      config: (done)=>
        redis.set "#{ns}:repo:#{@name}:config", JSON.stringify(@config), done
      source: (done)=>
        redis.set "#{ns}:repo:#{@name}:source", @source, done
      compiled: (done)=>
        redis.set "#{ns}:repo:#{@name}:compiled", @compiled, done
      toc: (done)=>
        redis.set "#{ns}:repo:#{@name}:toc", JSON.stringify(@toc), done
      updated_at: (done)=>
        redis.set "#{ns}:repo:#{@name}:updated_at", Date.now(), done
    , (err, repo)=>
      callback(err, this)


  # Waterfall the requirements to compile a repo's readme
  compile: (callback)->
    if @source
      Repository.compile @source, (err, contents)=>
        return callback(err) if err
        @compiled = contents.compiled
        @toc      = contents.toc
        callback(null, @)

    return this


    
  # Compiles the markdown to HTML with syntax highlighting
  # 
  # Makes it possible to send a highly optimized file with compression
  # and requiring only a single request.
  @compile = (source, callback)->
    # Sometimes the parsing might fail miserably.
    # Hence, we `try`.
    try
      body = Marked(source)
    catch err
      return callback(err)

    try
      toc = Repository._generateTableOfContents(source)
    catch err
      return callback(err)

    callback null, compiled: body, toc: toc


  # Generate the table of contents
  #
  # Takes the raw markdown and goes through its headings
  # to generate a table of contents following these rules:
  #
  # h2 -> first-level
  #   h3 -> second-level
  @_generateTableOfContents = (source)->
    navigation = marked_.lexer(source).filter((token)->
      return token.type == "heading" && (token.depth == 2 || token.depth == 3)
    )

    current_section = null
    toc = {}
    navigation.forEach (token, i, arr)->
      id =   token.text.parameterize()
      n  =   token.text
      
      if token.depth == 2
        current_section = id
        toc[id] =
          name: n
      else if toc[current_section]
        toc[current_section]["subSections"] ||= []
        toc[current_section]["subSections"].push
          id:   id
          name: n
      
    return toc


  update: (callback)->
    @getFiles (err, repo)=>
      return callback(err) if err
      @compile (err, compiled)=>
        return callback(err) if err
        @save callback
    return this


  @populate = (name, callback)->
    name = name.toLowerCase()
    Repository.list[name] ||= new Repository(name)
    repo = Repository.list[name]
    
    if repo.isComplete()
      return callback(null, repo)
    else
      repo.retrieve (err, repo)=>
        return callback(err) if err
        if !repo.isComplete()
          repo.update callback
        else
          callback(null, repo)



module.exports = Repository