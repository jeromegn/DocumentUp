config = require("./index")
require("sugar")

Express    = require("express")
ECT        = require("ect")
Stylus     = require("stylus")
Nib        = require("nib")
FS         = require("fs")
logger     = require("./logger")
redis      = require("./redis")
bodyParser = require('body-parser')
session    = require('express-session')
cookieParser = require('cookie-parser')
responseTime = require('response-time')
serveStatic = require('serve-static')
errorHandler = require('errorhandler')

RedisStore = require('connect-redis')(session)

ectRenderer = ECT({ root: "#{__dirname}/../app/views", ext : '.ect' })

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
server.set "views", "#{__dirname}/../app/views"
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
  server.use serveStatic "#{__dirname}/public", maxAge: 1000 * 60 * 60 * 24 * 14

server.use errorHandler()

module.exports = server
