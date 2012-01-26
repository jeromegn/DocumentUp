# App timezone is UTC. This needs to be set before ANY Date() methods are called
# or it will be ignored
process.env.TZ = "EST"

# NODE_ENV
process.env.NODE_ENV ||= "development"


# Running this file fires up the Web server.
if module.id == "."
  Server = require("./server")
  Server.on "loaded", ->
    console.log "Server is READY!"
    if process.env.NODE_ENV == "development"
      growl = require("growl").notify
      growl "Restarted", title: "DocumentUp"
  Server.listen 8080
  return

require("sugar")

Express = require("express")

Coffee  = require("coffee-script")
compileCS = (file, path, index, isLast, callback)->
  console.log "Compiling file: #{path}"
  callback if path.match(/\.coffee$/) then Coffee.compile(file) else file

stylus = require("stylus")
nib = require("nib")
compileStylus = (str, path) ->
  console.log "COMPILING STYLUS"
  stylus(str).set('filename', path).set('compress', true).use(nib())

server = Express.createServer()

eco = require 'eco'
compileEco = (file, path, index, isLast, callback)->
  return callback file unless path.match(/\.eco$/)
  template_name = path.match(/views\/(.+).eco/)[1]
  callback """
    (function() {
      this.JST || (this.JST = {});
      this.JST['#{template_name}'] = #{eco.precompile file}
    }).call(this);
  """

server.register ".eco", eco

FS = require("fs")

assetManager = require('connect-assetmanager')
assetHandler = require('connect-assetmanager-handlers')

# Nice little list
assets = require("./config/assets")

# Transform the bare list of files into a 
# connect-assetmanager readable list
Object.keys(assets).each (key)->
  formatted = 
    files: assets[key]
    route: new RegExp("/javascripts/#{key}.js")
    dataType: "javascript"
    preManipulate:
      "^": [compileCS, compileEco]
    path: "#{__dirname}/"
    debug: true
  assets[key] = formatted

server = Express.createServer()
server.configure ->
  server.set "root", __dirname

  # use Stylus
  server.use stylus.middleware
    src: "#{__dirname}/app"
    dest: "#{__dirname}/public"
    compile: compileStylus

  server.use Express.query()
  server.use Express.bodyParser()
  server.use Express.cookieParser()

  # Templates and views
  server.set "views", "#{__dirname}/app/views"
  server.set "view engine", "eco"
  server.set "view options"
    layout:  "layouts/default.eco"
    release:  new Date().toJSON()
    env:      server.settings.env
  
  compileCount = Object.keys(assets).length
  hasCompiled = 0

  Object.keys(assets).each (key)->
    assets[key].postManipulate =
      "^": [
        (file, path, index, isLast, callback) ->
          if isLast
            if ++hasCompiled == compileCount
              compileCount = 1
              hasCompiled = 0
              growl = require("growl").notify
              growl "Recompliled JS", title: "DocumentUp"
          callback file
      ]

  server.use assetManager(assets)

  #server.use bundle


server.configure "development", ->
  process.on "uncaughtException", (error)->
    console.log "Caught exception: #{error}"
    console.log error.stack.split("\n")

  server.use Express.logger(buffer: false)
  if process.env.DEBUG
    server.use Express.profiler()
  server.error Express.errorHandler(dumpExceptions: true, showStack: true)

  server.use Express.static "#{__dirname}/public"


server.configure "production", ->
  
  server.error Express.errorHandler()

  server.use Express.logger()
  server.use Express.responseTime()

  server.use Express.static "#{__dirname}/public", maxAge: 300000


#airbrake.trackDeployment server.settings.release, (err, params) ->
#  if err return console.log err
#  console.log "Tracked deployment of #{params.rev} to #{params.env}"
server.on "listening", ->
  console.log "listening"
  
  server.configure ->
    server.use server.router


  FS.readdir "#{__dirname}/app/resources/", (error, files)->
    for file in files
      if /\.coffee$/.test(file)
        require "#{__dirname}/app/resources/#{file}"
    
    server.emit "loaded"

module.exports = server