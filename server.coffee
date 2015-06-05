# App timezone is UTC. This needs to be set before ANY Date() methods are called
# or it will be ignored
process.env.TZ = "EST"

# NODE_ENV
process.env.NODE_ENV ||= "development"

process.on "uncaughtException", (error)->
  console.log "Uncaught exception: #{error}"
  console.log error.stack.split("\n")
  # process.exit(1)

config = require("./config")
require("sugar")

Express    = require("express")
ECT        = require("ect")
Stylus     = require("stylus")
Nib        = require("nib")
FS         = require("fs")
logger     = require("./config/logger")
redis      = require("./config/redis")
bodyParser = require('body-parser')
session    = require('express-session')
cookieParser = require('cookie-parser')
responseTime = require('response-time')
serveStatic = require('serve-static')
errorHandler = require('errorhandler')

# Running this file fires up the Web server.
if module.id == "."
  Server = require("./server")
  Server.on "loaded", ->
    console.log "Server is READY! on port #{config.server.port}"
    if process.env.NODE_ENV == "development"
      growl = require("growl").notify
      growl "Restarted", title: "DocumentUp"

  Server.listen config.server.port, ->
    require("./app/resources/projects")
    require("./app/resources/site")
    Server.use (error, req, res, next)->
      logger.error(error)
      if code = error.code
        res.render "errors/#{code}", layout: "layouts/error", status: 404
      else
        res.render "errors/500", layout: "layouts/error", status: 500

    # 404 error
    Server.use (req, res, next)->
      res.render "errors/404", layout: "layouts/error", status: 404

    Server.emit "loaded"
  return

RedisStore = require('connect-redis')(session)

ectRenderer = ECT({ root: "#{__dirname}/app/views", ext : '.ect' })

compileStylus = (str, path) ->
  Stylus(str).set('filename', path).set('compress', true).use(Nib())

server = Express()
server.set "root", __dirname
server.set "jsonp callback", true

server.use bodyParser()
server.use cookieParser()

server.use logger.middleware()

server.use session(secret: "c96dbcc746d551ea0665da4a23536280", store: new RedisStore(client: redis))

# Templates and views
server.set "view engine", "ect"
server.engine "ect", ectRenderer.render
server.set "views", "#{__dirname}/app/views"
server.locals.env = server.settings.env
server.locals.release = new Date().toJSON()

if process.env['NODE_ENV'] == "development"
  # use Stylus
  server.use Stylus.middleware
    src: "#{__dirname}/app"
    dest: "#{__dirname}/public"
    compile: compileStylus

  # server.use server.router
  server.use serveStatic "#{__dirname}/public"


if process.env['NODE_ENV'] == "production"
  server.use responseTime()
  # server.use server.router
  server.use serveStatic "#{__dirname}/public", maxAge: 1000 * 60 * 60 * 24 * 14

server.use errorHandler()

# server.on "listening", ->
#   server.configure ->


#   server.emit "loaded"

module.exports = server
