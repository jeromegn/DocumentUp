process.env.NODE_ENV = "test"

Async   = require("async")
Browser = require("zombie")
Replay  = require("replay")
Express = require("express")
server  = require("../../server")
File    = require("fs")

Helper =
  # Call this once before running all tests.
  listen: (callback)->
    server.listen(3003, callback)

Browser.site = "localhost:3003"

# To capture and record API calls, run with environment variable RECORD=true
Replay.fixtures = "#{__dirname}/../replay"
Replay.networkAccess = false
Replay.localhost "localhost"

module.exports = Helper