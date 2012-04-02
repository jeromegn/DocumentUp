process.env.NODE_ENV = "test"

Async   = require("async")
Browser = require("zombie")
#Replay  = require("replay")
server  = require("../server")


Helper =

  # Call this once before running all tests.
  once: (callback)->
    Async.parallel [
      (done)->
        server.listen(3003, done)
    ], (error)->
      if error
        throw error
      else
        callback()

Browser.site = "localhost:3003"


# To capture and record API calls, run with environment variable RECORD=true
# Replay.fixtures = "#{__dirname}/replay"
# Replay.networkAccess = false
# Replay.localhost "localhost"
# Replay.ignore "mt1.googleapis.com"

module.exports = Helper