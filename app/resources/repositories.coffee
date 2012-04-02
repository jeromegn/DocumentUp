Server = require("../../server")
Repository = require("../models/repository")


# Reusable regex to find the right files
file_matchers = require("../../lib/matchers")


respond_with_html = (res, data, status = 200)->
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
# Checks if the generated documentation needs to be regenerated and takes action
Server.post "/recompile", (req, res, next)->

  console.log "IN POST RECEIVE HOOK"
  console.log req.body.payload

  push = req.body.payload

  recompile = push.commits && push.commits.some (commit)->
    return commit.modified && commit.modified.some (modified)->
      return file_matchers.readme.test(modified) || file_matchers.config.test(modified)

  if recompile
    splitted = push.repository.url.replace(/(http|https):\/\/github.com/, "").split("/")
    Repository.populate "#{splitted[1]}/#{splitted[2]}", (err, repo)->
      return next(err) if err
      repo.update (err, repo)->
        return next(err) if err
        res.send 200
  else
    res.send 200



# Compile any markdown, doesn't cache it.
compile_route = (req, res, next)->
  config = !Object.isEmpty(req.body) && req.body || !Object.isEmpty(req.query) && req.query
  content = "#{config.content}"

  return next(new Error("Please send markdown content as the `content` parameter")) unless content

  config.name ||= "undefined"

  # No need to pollute that object
  delete config.content

  Repository.compile content, (err, contents)->
    return next(err) if err
    return respond_with_html(res, "Error while compiling your content", 500) if err
    {compiled, toc} = contents
    locals =
      compiled: compiled
      toc:      toc
      config:   config
    res.render "repositories/show", locals: locals, (err, html)->
      respond_with_html(res, html)


Server.post "/compiled", compile_route
Server.get "/compiled", compile_route


Server.get "/", (req, res, next)->
  Repository.populate "jeromegn/documentup", (err, repo)->
    res.render "repositories/show", locals: repo


render_repo = (res, repo)->
  res.render "repositories/show", locals: repo, (err, html)->
    respond_with_html res, html


Server.get "/:username/:repository", (req, res, next)->
  return next() if req.params.username == "stylesheets" || req.params.username == "images"
  return res.redirect("/", 301) if req.params.username == "username" && req.params.repository == "repository"
  
  Repository.populate "#{req.params.username}/#{req.params.repository}", (err, repo)->
    if (config = req.query.config && Repository.createConfig(JSON.parse(req.query.config))) && !Object.equal(repo.config, config)
      repo.setConfig(config)
      repo.save (err, repo)->
        return next(err) if err
        render_repo res, repo
    else
      render_repo res, repo


# Manual recompile
Server.get "/:username/:repository/recompile", (req, res, next)->
  name = "#{req.params.username}/#{req.params.repository}"
  Repository.populate "#{name}", (err, repo)->
    return next(err) if err
    repo.update (err, repo)->
      return next(err) if err
      res.redirect "/#{name}"

