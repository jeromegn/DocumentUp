process.env.NODE_ENV = "test"

Async   = require("async")
Browser = require("zombie")
Replay  = require("replay")
Express = require("express")
server  = require("../../server")
File    = require("fs")
Chai    = require('chai')
redis   = require("../../config/redis")

listening = false
listen = (callback)->
  if listening
    process.nextTick callback
    return
  server.listen 3003, ->
    listening = true
    process.nextTick callback

flush_redis = (callback)->
  redis.flushall callback

Browser.site = "localhost:3003"

# To capture and record API calls, run with environment variable RECORD=true
Replay.fixtures = "#{__dirname}/../replay"
Replay.networkAccess = false
Replay.localhost "localhost"

module.exports.listen      = listen
module.exports.flush_redis = flush_redis
module.exports.assert      = Chai.assert