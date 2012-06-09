# Exports a Redis client.
Redis  = require("redis")
config = require("./index")


{ hostname, port } = config.redis
redis = Redis.createClient(port, hostname)


module.exports = redis
