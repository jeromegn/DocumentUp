# Logging. Exports the application's default logger.
#
# The logger supports the logging methods debug, info, warning, error and alert. (Please don't use other logging
# levels)


Path    = require("path")
Winston = require("winston")
config  = require("./index")

require('winston-loggly')

# Use syslog logging levels.
Winston.setLevels Winston.config.syslog.levels

# Log to file based on the current environment.
env = process.env.NODE_ENV.toLowerCase()
filename = Path.resolve(__dirname, "../log/#{env}.log")
Winston.remove Winston.transports.Console


switch env
  when "development"
    # Log to file and console.
    Winston.add Winston.transports.File, filename: filename, level: "debug", json: false, timestamp: true
    Winston.add Winston.transports.Console, level: "debug", colorize: true
  when "test"
    # Log to file, console only running with DEBUG
    Winston.add Winston.transports.File, filename: filename, level: "debug", json: false, timestamp: true
    if process.env.DEBUG
      Winston.add Winston.transports.Console, level: "debug", colorize: true
  else
    # Production/staging, log to console, which gets piped to a file
    level = if process.env.DEBUG then "debug" else "info"
    Winston.add Winston.transports.Console, level: level, colorize: false, timestamp: true
    Winston.add Winston.transports.Loggly, level: level, subdomain: config.loggly.subdomain, inputToken: config.loggly.inputToken

# Connect middleware for logging every request.
Winston.middleware = ->
  return (req, res, next)->
    start = Date.now()
    if req._logged
      return next()
    req._logged
    end_fn = res.end
    res.end = ->
      remote_addr = req.socket && (req.socket.remoteAddress || (req.socket.socket && req.socket.socket.remoteAddress))
      referer = req.headers["referer"] || req.headers["referrer"] || ""
      length = res._headers["content-length"] || "-"
      Winston.info "#{remote_addr} - \"#{req.method} #{req.originalUrl} HTTP/#{req.httpVersionMajor}.#{req.httpVersionMinor}\" #{res.statusCode} #{length} \"#{referer}\" \"#{req.headers["user-agent"]}\" - #{Date.now() - start} ms"

      res.end = end_fn
      end_fn.apply res, arguments
    next()


# Log process start/complete.  Crashes logged by handleExceptions.
process.on "exit", (status)->
  Winston.info "Terminated process #{process.pid} status #{status}"


module.exports = Winston
