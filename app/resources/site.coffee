Server = require("../../config/server")

Server.get "/mobile", (req, res, next)->
  res.render "mobile", layout: false