# Exports a Redis client.
Redis  = require("redis")
config = require("./index")

{ hostname, port } = config.redis
options = {}
options.auth_pass = config.redis.password if config.redis.password
console.log "creating client"
redis = Redis.createClient(port, hostname, options)
# console.log "redis client created", redis
module.exports = redis