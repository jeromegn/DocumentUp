# Exports a Redis client.
Redis  = require("redis")
config = require("./index")

{ hostname, port } = config.redis
options = {}
options.password = config.redis.password if config.redis.password
redis = Redis.createClient(port, hostname, options)

module.exports = redis