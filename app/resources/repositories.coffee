Server = require("../../server")
marked_ = require("marked")
Request = require("request")
Express = require("express")
File = require("fs")
Async = require("async")

# Load highlighter and languages
global.hljs = require("../../vendor/javascript/highlight.js")
files = File.readdirSync "#{__dirname}/../../vendor/javascript/languages", (err, files)->
require("../../vendor/javascript/languages/xml.js")
files.forEach (file) ->
  return if /DS_Store/.test(file) || /index/.test(file) || /xml/.test(file)
  require("../../vendor/javascript/languages/#{file}")

# Custom markdown parsing addition
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
      token.text = hljs.highlightAuto(token.text).value
      token.escaped = true;
    i++
  text = marked_.parser(tokens)
  text


generateNavigation = (markdown)->
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
    else
      sections[current_section]["subSections"] ||= []
      sections[current_section]["subSections"].push
        id:   id
        name: n
    
  return sections


file_matchers =
  readme: /readme/i
  config: /documentup\.json/i


# Static class to handle Github API requests
class Github

  # Get the required files for a project (readme.md and documentup.json)
  @getFilesFor = (repo, callback)=>
    @getMasterTree repo, (err, tree)=>
      readme_sha = obj.sha for obj in tree when file_matchers.readme.test(obj.path)
      config_sha = obj.sha for obj in tree when file_matchers.config.test(obj.path)

      console.log config_sha

      Async.parallel

        readme: (callback)=>
          @getFile readme_sha, repo, callback
        
        config: (callback)=>
          return callback(null, null) unless config_sha
          @getFile config_sha, repo, callback
      
      , (err, results)->
        return callback(err) if err
        callback null, readme: results.readme, config: JSON.parse(results.config)

  # Gets one file from the sha and repository
  @getFile = (sha, repo, callback)=>
    Request
      method: "GET"
      url: "https://api.github.com/repos/#{repo}/git/blobs/#{sha}"
      headers:
        "Accept": "application/vnd.github-blob.raw"
      (err, resp, body)->
        return callback(err) if err
        callback(null, body)

  # Gets the master tree of a repository
  @getMasterTree = (repo, callback)=>
    Request
      method: "GET"
      url: "https://api.github.com/repos/#{repo}/git/trees/master"
      (err, resp, body)=>
        return callback(err) if err
        tree = JSON.parse(body).tree
        callback(null, tree)


compile_dir = "#{__dirname}/../../public/compiled"
# Caches the HTML in public/compiled for a repository
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

# Handles sending the client the compiled HTML and caching it
renderAndCache = (req, res, next)->

  req.params.username ||= "jeromegn"
  req.params.repository ||= "documentup"

  Github.getFilesFor "#{req.params.username}/#{req.params.repository}", (err, files)->
    return res.send(err, 500) if err
    {readme, config} = files

    sections = generateNavigation(readme)

    if config
      config[key] = value for key, value of defaults when config[key] == undefined
    else
      config = defaults

    locals = 
      repository: "#{req.params.username}/#{req.params.repository}"
      content: Marked(readme)
      sections: sections
      config: config

    res.render "repositories/show", locals: locals, (err, html)->
      return res.send(err, 500) if err
      res.send(html)
      cacheHtml(req.params.username, req.params.repository, html)
    

Server.get "/", Express.static("#{__dirname}/../../public/compiled/jeromegn/documentup")
Server.get "/", renderAndCache

Server.get "/:username/:repository", Express.static("#{__dirname}/../../public/compiled")
Server.get "/:username/:repository", renderAndCache

# Post-Receive hook
Server.post "/compile", (req, res, next)->

  push = req.body.payload
  console.log push

  recompile = push.commits && push.commits.some (commit)->
    console.log commit
    return commit.modified && commit.modified.some (modified)->
      console.log modified
      return file_matchers.readme.test(modified) || file_matchers.config.test(modified)

  console.log recompile

  if recompile
    splitted = push.repository.url.replace(/(http|https):\/\/github.com/, "").split("/")
    console.log splitted
    req.params.username = splitted[0]
    req.params.repository = splitted[0]
    return renderAndCache(req, res, next)
