# Exports configuration object for the current environment (NODE_ENV).

CoffeeScript = require("coffee-script")
File         = require("fs")


# Default mode is development
process.env.NODE_ENV = (process.env.NODE_ENV || "development").toLowerCase()


load = (filename)->
  script = File.readFileSync(filename, "utf-8").split("\n").map((l)-> "  " + l).join("\n")
  wrapped = "config = \n#{script}\nreturn config"
  return eval(CoffeeScript.compile(wrapped))


# Load configuration files.
config = load("#{__dirname}/default.config")
env_fn = "#{__dirname}/#{process.env.NODE_ENV}.config"
if File.existsSync(env_fn)
  env_config = load(env_fn)
  for name, value of env_config
    config[name] = value

console.log config

module.exports = config
