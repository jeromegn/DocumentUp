marked = require("./marked.js")
hljs   = require("highlight.js")


marked.setOptions
  gfm: true
  highlight: (code, lang)->
    if lang in Object.keys(hljs.LANGUAGES)
      return hljs.highlight(lang, code).value
    else if lang != "plain" && lang != "text"
      return hljs.highlightAuto(code).value
    else
      return code



Markdown =
  # Modification of the markdown parser
  #
  # This is necessary to both highlight the code and
  # add browsable IDs (via /#some-id) to each heading
  parse: (markdown)->
    current_h2 = null
    tokens = marked.lexer(markdown)
    token = undefined
    for token in tokens
      if token.type == "heading"
        to_param = token.text.parameterize()
        if token.depth == 2
          current_h2 = to_param
          token.depth = "#{token.depth} id='#{to_param}'"
        else if token.depth == 3
          token.depth = "#{token.depth} id='#{current_h2}/#{to_param}'"
    
    return marked.parser(tokens)


  # Generate the table of contents
  #
  # Takes the raw markdown and goes through its headings
  # to generate a table of contents following these rules:
  #
  # h2 -> first-level
  #   h3 -> second-level
  tableOfContents: (markdown)->
    navigation = marked.lexer(markdown).filter((token)->
      return token.type == "heading" && (token.depth == 2 || token.depth == 3)
    )

    current_section = null
    toc = {}
    navigation.forEach (token, i, arr)->
      id =   token.text.parameterize()
      n  =   marked.parse(token.text).replace(/<[^>]+>/g, '').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim()
      
      if token.depth == 2
        current_section = id
        toc[id] =
          name: n
      else if toc[current_section]
        toc[current_section]["subSections"] ||= []
        toc[current_section]["subSections"].push
          id:   id
          name: n

    return toc

module.exports = Markdown
