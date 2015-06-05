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
logger = require("./config/logger")

server = require("./config/server")

require("./app/resources/projects")
require("./app/resources/site")

server.use (error, req, res, next)->
  console.log "ERROR", error
  console.log error.stack.split("\n")
  logger.error(error)
  if code = error.code
    res.render "errors/#{code}", layout: "layouts/error", status: 404
  else
    res.render "errors/500", layout: "layouts/error", status: 500

# 404 error
server.use (req, res, next)->
  res.render "errors/404", layout: "layouts/error", status: 404

server.listen config.server.port, ->
  console.log "server is READY! on port #{config.server.port}"