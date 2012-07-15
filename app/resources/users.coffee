Server  = require("../../server")
Request = require("request")
config  = require("../../config")
QS      = require("qs")


Server.get "/connect", (req, res, next)->
  repo = ""
  res.redirect "https://github.com/login/oauth/authorize?client_id=#{config.github.client_id}&redirect_uri=#{encodeURIComponent(config.base_uri+"/oauth_redirect?repo=#{}")}"

Server.get "/oauth_redirect", (req, res, next)->
  repo = req.query.repo
  if code = req.query.code
    opts =
      uri:    "https://github.com/login/oauth/access_token?client_id=#{config.github.client_id}&client_secret=#{config.github.client_secret}&code=#{code}"
      method: "POST"
    Request opts, (error, resp, body)->
      return next(error) if error
      if access_token = QS.parse(body).access_token
        Request uri: "https://api.github.com/user?access_token=#{access_token}", json: true, (error, resp, body)->