Server   = require("../../config/server")
Project  = require("../models/project")
Markdown = require("../../lib/markdown")
Github   = require("../../lib/github")

# Reusable regex to find the right files
file_matchers = require("../../lib/matchers")


respond_with_html = (res, data, status = 200)->
  if res.req.query.callback
    json =
      status: status
    if status && status != 200
      json.error = data
    else
      json.html = data
    return res.json(json)
  else
    return res.status(status).send(data)


# Github Post-Receive Hook
# Checks if the generated documentation needs to be regenerated and takes action
Server.post "/recompile", (req, res, next)->

  push = JSON.parse(req.body.payload)

  recompile = push.commits && push.commits.some (commit)->
    return commit.modified && commit.modified.some (modified)->
      return file_matchers.readme.test(modified) || file_matchers.config.test(modified)

  if recompile
    splitted = push.repository.url.replace(/(http|https):\/\/github.com/, "").split("/")
    Project.load splitted[1], splitted[2], null, (error, project)->
      return next(error) if error
      return res.send(200) unless project
      project.update null, (error, project)->
        return next(error) if error
        res.send 200
  else
    res.send 200



# Compile any markdown
compile_route = (req, res, next)->

  config = (!Object.isEmpty(req.body) && req.body) || (!Object.isEmpty(req.query) && req.query)
  return next(new Error("Please send markdown content as the `content` parameter")) unless config || config.content

  content = "#{config.content}"
  config = Project.makeConfig(config)

  config.name ||= "undefined"

  # No need to pollute that object
  delete config.content

  try
    compiled = Markdown.parse(content)
    toc      = Markdown.tableOfContents(content)
  catch error
    return respond_with_html(res, "Error while compiling your content", 500)

  locals =
    project:
      compiled: compiled
      toc:      toc
      config:   config
    theme: config.theme

  res.render "projects/show", locals, (error, html)->
    respond_with_html(res, html)


Server.post "/compiled", compile_route
Server.get "/compiled", compile_route


Server.get "/", (req, res, next)->
  console.log "Hello /"
  Project.load "jeromegn", "DocumentUp", req.session.access_token, (error, project)->
    console.log "DocumentUp project loaded"
    console.log project.config
    render_project req, res, project, next


render_project = (req, res, project, next)->
  res.render "projects/show", project: project, theme: req.query.theme || project.config.theme, (error, html)->
    return next(error) if error
    respond_with_html res, html


Server.get "/:username/:project_name", (req, res, next)->
  return next() if req.params.username == "stylesheets" || req.params.username == "javascripts" || req.params.username == "images"
  return res.redirect("/", 301) if req.params.username == "username" && req.params.project_name == "repository"

  if req.query.auth
    return res.redirect Github.oauthUrl("/#{req.params.username}/#{req.params.project_name}")

  if code = req.query.code
    return Github.getAccessToken code, (error, access_token)->
      return next(error) if error
      return next() unless access_token

      req.session.access_token = access_token
      return res.redirect "/#{req.params.username}/#{req.params.project_name}"

  Project.load req.params.username, req.params.project_name, req.session.access_token, (error, project)->
    return next(error) if error
    return next() unless project
    try
      if req.query.config
        config = Project.makeConfig(JSON.parse(req.query.config))
    catch e
      return res.render "projects/show", project: project, theme: req.query.theme || project.config.theme, (error, html)->
        respond_with_html(res, html)

    config ||= null

    if config
      project.config = config
      project.save (error, project)->
        return next(error) if error
        res.render "projects/show", project: project, theme: req.query.theme || project.config.theme, (error, html)->
          respond_with_html(res, html)
    else
      res.render "projects/show", project: project, theme: req.query.theme || project.config.theme, (error, html)->
        respond_with_html(res, html)

Server.get "/:username/:project_name", (req, res, next)->
  return next() if req.params.username == "stylesheets" || req.params.username == "javascripts" || req.params.username == "images"
  res.render "projects/404", status: 404, locals:
    project: "#{req.params.username}/#{req.params.project_name}"


# Manual recompile
Server.get "/:username/:project_name/recompile", (req, res, next)->
  Project.load req.params.username, req.params.project_name, req.session.access_token, (error, project)->
    return next(error) if error
    if !project
      error = new Error("Could not find project")
      error.code = 404
      return next(error)
    project.update req.session.access_token, (error)->
      if error
        next(error)
      else
        console.log "NO ERRORS"
        res.redirect "/#{project.name}", 302
