Server   = require("../../server")
Project  = require("../models/project")
Markdown = require("../../lib/markdown")

# Reusable regex to find the right files
file_matchers = require("../../lib/matchers")


respond_with_html = (res, data, status = 200)->
  if res.req.query.callback
    json =
      status: status
    if status && status != 200
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

  push = JSON.parse(req.body.payload)

  recompile = push.commits && push.commits.some (commit)->
    return commit.modified && commit.modified.some (modified)->
      return file_matchers.readme.test(modified) || file_matchers.config.test(modified)

  if recompile
    splitted = push.repository.url.replace(/(http|https):\/\/github.com/, "").split("/")
    Project.load splitted[1], splitted[2], (error, project)->
      return next(error) if error
      project.update (error, project)->
        return next(error) if error
        res.send 200
  else
    res.send 200



# Compile any markdown, doesn't cache it.
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
  res.render "projects/show", locals: locals, (error, html)->
    respond_with_html(res, html)


Server.post "/compiled", compile_route
Server.get "/compiled", compile_route


Server.get "/", (req, res, next)->
  Project.load "jeromegn", "DocumentUp", (error, project)->
    render_project req, res, project


render_project = (req, res, project)->
  res.render "projects/show", locals: {project: project}, theme: req.query.theme || project.config.theme, (error, html)->
    return next(error) if error
    respond_with_html res, html


Server.get "/:username/:project_name", (req, res, next)->
  return next() if req.params.username == "stylesheets" || req.params.username == "javascripts" || req.params.username == "images"
  return res.redirect("/", 301) if req.params.username == "username" && req.params.project_name == "repository"
  
  Project.load req.params.username, req.params.project_name, (error, project)->
    return next(error) if error
    if (config = req.query.config && Project.createConfig(JSON.parse(req.query.config))) && !Object.equal(project.config, config)
      project.setConfig(config)
      project.save (error, project)->
        return next(error) if error
        res.render "projects/show", locals:
          project: project
          theme: req.query.theme || project.config.theme

    else
      res.render "projects/show", locals:
        project: project
        theme: req.query.theme || project.config.theme


# Manual recompile
Server.get "/:username/:project_name/recompile", (req, res, next)->
  Project.load req.params.username, req.params.project_name, (error, project)->
    return next(error) if error
    project.update (error)->
      return next(error) if error
      res.redirect "/#{project.name}", 302

