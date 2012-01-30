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

current_h2 = null
Marked = (text) ->
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

# Static class to handle Github API requests
class Github

  # Get the required files for a project (readme.md and documentup.json)
  @getFilesFor = (repo, callback)=>
    @getMasterTree repo, (err, tree)=>
      readme_sha = obj.sha for obj in tree when /readme/i.test(obj.path)
      config_sha = obj.sha for obj in tree when /documentup\.json/i.test(obj.path)

      Async.parallel

        readme: (callback)=>
          @getFile readme_sha, repo, callback
        
        config: (callback)=>
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
  
          
# Caches the HTML in public/compiled for a repository
cacheHtml = (username, repository, html)->

  try File.mkdirSync "#{__dirname}/../../public/compiled/#{username}"
  try File.mkdirSync "#{__dirname}/../../public/compiled/#{username}/#{repository}"
  
  File.writeFile "#{__dirname}/../../public/compiled/#{username}/#{repository}/index.html", html, (err)->
    return console.log err if err
    console.log "CACHED: #{username}/#{repository}"

# Handles sending the client the compiled HTML and caching it
renderAndCache = (req, res, next)->

  req.params.username ||= "jeromegn"
  req.params.repository ||= "documentup"

  Github.getFilesFor "#{req.params.username}/#{req.params.repository}", (err, files)->
    return res.send(err, 500) if err
    {readme, config} = files

    config.name ||= req.params.repository

    sections = generateNavigation(readme)
    locals = {repository: req.params.repository, content: Marked(readme), sections: sections}

    Object.merge(config, locals)

    res.render "repositories/show", locals: config, (err, html)->
      res.send(html)
      cacheHtml(req.params.username, req.params.repository, html)
      
    

Server.get "/", Express.static("#{__dirname}/../../public/compiled/jeromegn/documentup")
Server.get "/", renderAndCache

Server.get "/:username/:repository", Express.static("#{__dirname}/../../public/compiled")
Server.get "/:username/:repository", renderAndCache
  