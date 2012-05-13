Server = require("../../server")

Server.get "/mobile", (req, res, next)->
  res.render "mobile", layout: false