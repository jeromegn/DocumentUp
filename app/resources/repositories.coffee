Server = require("../../server")
marked_ = require("marked")
Express = require("express")
File = require("fs")

Github = require("../../lib/github")

# Load highlighter and languages
# I need to make this global or else the syntax highlighters
# won't know what to attach to.
global.hljs = require("../../vendor/javascript/highlight.js")
files = File.readdirSync "#{__dirname}/../../vendor/javascript/languages"

# Got to require XML first, some others rely on it.
require("../../vendor/javascript/languages/xml.js")
files.forEach (file) ->
  # Don't load XML once again or DS_Store
  return if /DS_Store/.test(file) || /xml/.test(file)
  require("../../vendor/javascript/languages/#{file}")


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


# Generate the table of contents
#
# Takes the raw markdown and goes through its headings
# to generate a table of contents following these rules:
#
# h2 -> first-level
#   h3 -> second-level

generateTableOfContents = (markdown)->
  navigation = marked_.lexer(markdown).filter((token)->
    return token.type == "heading" && (token.depth == 2 || token.depth == 3)
  )

  current_section = null
  sections = {}
  navigation.forEach (token, i, arr)->
    id =   token.text.parameterize()
    n  =   token.text
    
    if token.depth == 2
      current_section = id
      sections[id] =
        name: n
    else if sections[current_section]
      sections[current_section]["subSections"] ||= []
      sections[current_section]["subSections"].push
        id:   id
        name: n
    
  return sections


# Reusable regex to find the right files
file_matchers = require("../../lib/matchers")

compile_dir = "#{__dirname}/../../public/compiled"

# Caches the HTML in public/compiled for a repository
# 
# Tries to create the dirs if they don't exist and
# then writes the compiled file to it.
cacheHtml = (username, repository, html)->

  try File.mkdirSync "#{compile_dir}/#{username}"
  try File.mkdirSync "#{compile_dir}/#{username}/#{repository}"
  
  File.writeFile "#{compile_dir}/#{username}/#{repository}/index.html", html, (err)->
    return console.log err if err
    console.log "CACHED: #{username}/#{repository}"


# Defaults for all repos
defaults =
  twitter: null
  issues: true
  travis: false
  ribbon: true

stylus = require("stylus")
nib = require("nib")


# Compilation of a single HTML file without any dependencies
# 
# Embeds the styles too. No JS involved either.
# 
# Makes it possible to send a highly optimized file with compression
# and requiring only a single request.
compile = (req, res, readme, config, callback)->
  sections = generateTableOfContents(readme)

  if config
    config[key] = value for key, value of defaults when config[key] == undefined
  else
    config = defaults
  
  # Sometimes the parsing might fail miserably.
  try
    body = Marked(readme)
  catch e
    return callback(e)

  locals = 
    content: body
    sections: sections
    config: config
  
  locals.repository = "#{req.params.username}/#{req.params.repository}" if req.params.username && req.params.repository

  styl_path = "#{__dirname}/../stylesheets/screen.styl"
  File.readFile styl_path, "utf8", (err, contents)->
    stylus(contents).set('filename', styl_path).set('compress', true).use(nib()).render (err, css)->
      return callback(err) if err
      locals.css = css
      res.render "repositories/show", locals: locals, callback


sendHtml = (res, data, status = 200)->
  if res.req.query.callback
    json =
      status: status
    if status and status != 200
      console.log "ERROR SENT BACK: #{data}"
      json.error = data
    else
      json.html = data  

    return res.json(json)
  else
    return res.send(data, status)


# Github Post-Receive Hook
#
# Checks if the generated documentation needs to be regenerated and takes action
Server.post "/recompile", (req, res, next)->

  push = JSON.parse(req.body.payload)
  console.log push

  recompile = push.commits && push.commits.some (commit)->
    return commit.modified && commit.modified.some (modified)->
      return file_matchers.readme.test(modified) || file_matchers.config.test(modified)

  if recompile
    splitted = push.repository.url.replace(/(http|https):\/\/github.com/, "").split("/")
    req.params.username = splitted[1].toLowerCase()
    req.params.repository = splitted[2].toLowerCase()
    return handleRepository(req, res, next)


# Compile any markdown, doesn't cache it.
handleCompileRequest = (req, res, next)->
  config = !Object.isEmpty(req.body) && req.body || !Object.isEmpty(req.query) && req.query
  content = "#{config.content}"

  return sendHtml(res, "Please send markdown content as the `content` parameter", 400) unless content

  config.name ||= "undefined"

  # No need to pollute that object
  delete config.content

  locals =
    content: content
    config: config

  compile req, res, content, config, (err, html)->
    console.log err if err
    return sendHtml(res, "Error while compiling your content", 500) if err
    sendHtml(res, html)

Server.post "/compiled", handleCompileRequest
Server.get "/compiled", handleCompileRequest


# Handles sending the client the compiled HTML and caching it
handleRepository = (req, res, next)->
  return next() if req.params.username == "stylesheets" || req.params.username == "images"

  # If the user requested "/" then he wants the DocumentUp repo
  req.params.username ||= "jeromegn"
  req.params.repository ||= "documentup"

  return res.redirect("/", 301) if req.params.username == "username" && req.params.repository == "repository"

  req.params.username = req.params.username.toLowerCase()
  req.params.repository = req.params.repository.toLowerCase()

  console.log "COMPILING REPOSITORY: #{req.params.username}/#{req.params.repository}"

  Github.getBlobsFor "#{req.params.username}/#{req.params.repository}", (err, files)->
    return sendHtml(res, err.message, 500) if err
    {readme, config} = files

    if req.query && req.query.config
      config = JSON.parse(req.query.config)

    compile req, res, readme, config, (err, html)->
      return sendHtml(res, err.message, 500) if err
      sendHtml(res, html)
      cacheHtml(req.params.username, req.params.repository, html)
    

# Weird hack to either send HTML or send a
# JSON response with the `html` key
renderStaticUnlessJSONP = (path)->
  (req, res, next)->
    return next() if req.params.username == "stylesheets" || req.params.username == "images"
    if req.query.callback
      
      unless req.params.username and req.params.repository
        return sendHtml(res, "You need to supply a username and repository", 400)
      
      req.params.username = req.params.username.toLowerCase()
      req.params.repository = req.params.repository.toLowerCase()
      real_path = "#{path}/#{req.params.username}/#{req.params.repository}/index.html"

      File.readFile "#{real_path}", "utf8", (err, contents)->
        # Probably not found, so let's generate it
        return next() if err
        sendHtml(res, contents)

    else
      Express.static(path)(req, res, next)


Server.get "/", Express.static("#{__dirname}/../../public/compiled/jeromegn/documentup")
Server.get "/", handleRepository

Server.get "/:username/:repository", renderStaticUnlessJSONP("#{__dirname}/../../public/compiled")
Server.get "/:username/:repository", handleRepository