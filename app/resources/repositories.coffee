Server = require("../../server")
marked_ = require("marked")
Request = require("request")

current_h2 = null
Marked = (text) ->
  tokens = marked_.lexer(text)
  l = tokens.length
  i = 0
  token = undefined
  while i < l
    token = tokens[i]
    if token.type is "heading"
      to_param = token.text.parameterize()
      if token.depth == 2
        current_h2 = to_param
        token.depth = "#{token.depth} id='#{to_param}'"
      else if token.depth == 3
        token.depth = "#{token.depth} id='#{current_h2}/#{to_param}'"
    i++
  text = marked_.parser(tokens)
  text

renderRepo = (repo, callback)->
  name = repo.split("/")[1]
  Request
    method: "GET"
    url: "https://api.github.com/repos/#{repo}/git/trees/master"
    (err, resp, body)->
      return callback(err) if err
      data = JSON.parse(body)
      readme_sha = obj.sha for obj in data.tree when /readme/i.test(obj.path)
      Request
        method: "GET"
        url: "https://api.github.com/repos/#{repo}/git/blobs/#{readme_sha}"
        headers:
          "Accept": "application/vnd.github-blob.raw"
        (err, resp, body)->
          return callback(err) if err
          navigation = marked_.lexer(body).filter((token)->
            return token.type == "heading" && (token.depth == 2 || token.depth == 3)
          )

          current_section = null
          sections = {}
          navigation.forEach (token, i, arr)->
            id =   token.text.parameterize()
            n  =   token.text
            
            if token.depth == 2
              current_section = id
              sections[id] =
                name: n
            else
              sections[current_section]["subSections"] ||= []
              sections[current_section]["subSections"].push
                id:   id
                name: n
          
          callback
            name: name
            repository: repo
            content: Marked(body)
            sections: sections

Server.get "/", (req, res, next)->
  renderRepo "jeromegn/documentup", (locals)->
    res.render "repositories/show", locals: locals

Server.get "/:username/:repository", (req, res, next)->
  renderRepo "#{req.params.username}/#{req.params.repository}", (locals)->
    res.render "repositories/show", locals: locals