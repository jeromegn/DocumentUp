# App timezone is UTC. This needs to be set before ANY Date() methods are called
# or it will be ignored
process.env.TZ = "EST"

# NODE_ENV
process.env.NODE_ENV ||= "development"

process.on "uncaughtException", (error)->
  console.log "Caught exception: #{error}"
  console.log error.stack.split("\n")
  process.exit(1)

config = require("./config")

# Running this file fires up the Web server.
if module.id == "."
  Server = require("./server")
  Server.on "loaded", ->
    console.log "Server is READY!"
    if process.env.NODE_ENV == "development"
      growl = require("growl").notify
      growl "Restarted", title: "DocumentUp"

  Server.listen config.server.port
  return

require("sugar")

Express    = require("express")
RedisStore = require('connect-redis')(Express)
Eco        = require("eco")
Stylus     = require("stylus")
Nib        = require("nib")
FS         = require("fs")
logger     = require("./config/logger")

compileStylus = (str, path) ->
  Stylus(str).set('filename', path).set('compress', true).use(Nib())

server = Express.createServer()

server.register ".eco", Eco

server = Express.createServer()
server.configure ->
  server.set "root", __dirname
  server.set "jsonp callback", true

  server.use Express.query()
  server.use Express.bodyParser()
  server.use Express.cookieParser()

  server.use logger.middleware()

  server.use Express.session(secret: "c96dbcc746d551ea0665da4a23536280", store: new RedisStore)

  # Templates and views
  server.set "views", "#{__dirname}/app/views"
  server.set "view engine", "eco"
  server.set "view options"
    layout:  "layouts/default.eco"
    release:  new Date().toJSON()
    env:      server.settings.env

server.configure "development", ->
  if process.env.DEBUG
    server.use Express.profiler()
  server.error Express.errorHandler(dumpExceptions: true, showStack: true)

  # use Stylus
  server.use Stylus.middleware
    src: "#{__dirname}/app"
    dest: "#{__dirname}/public"
    compile: compileStylus

  server.use server.router
  server.use Express.static "#{__dirname}/public"


server.configure "production", ->
  server.error Express.errorHandler()
  server.use Express.responseTime()
  server.use server.router
  server.use Express.static "#{__dirname}/public", maxAge: 1000 * 60 * 60 * 24 * 14


server.on "listening", ->
  require("./app/resources/projects")
  require("./app/resources/site")

  server.configure ->
    server.use (error, req, res, next)->
      logger.error(error)
      if code = error.code
        res.render "errors/#{code}", layout: "layouts/error", status: 404
      else
        res.render "errors/500", layout: "layouts/error", status: 500

    # 404 error
    server.use (req, res, next)->
      res.render "errors/404", layout: "layouts/error", status: 404

  server.emit "loaded"

module.exports = server
