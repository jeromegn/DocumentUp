Remarkable = require("remarkable")
hljs   = require("highlight.js")
toc = require('markdown-toc')
# emojis = require('remarkable-emoji')

md = new Remarkable
  html: true
  highlight: (code, lang)->
    try
      return hljs.highlight(lang, code).value
    catch error
      return hljs.highlightAuto(code).value

toc_md = new Remarkable

# md.use(emojis)

# marked.setOptions
#   gfm: true
#   highlight: (code, lang)->
#     try
#       return hljs.highlight(lang, code).value
#     catch error
#       return hljs.highlightAuto(code).value

Markdown =
  # Modification of the markdown parser
  #
  # This is necessary to both highlight the code and
  # add browsable IDs (via /#some-id) to each heading
  parse: (markdown)->
    md.render(markdown)
    # current_h2 = null
    # tokens = marked.lexer(markdown)
    # for token in tokens
    #   if token.type == "heading"
    #     to_param = token.text.parameterize()
    #     if token.depth == 2
    #       current_h2 = to_param
    #       token.depth = "#{token.depth} id='#{to_param}'"
    #     else if token.depth == 3
    #       token.depth = "#{token.depth} id='#{current_h2}/#{to_param}'"
    # return marked.parser(tokens)


  # Generate the table of contents
  #
  # Takes the raw markdown and goes through its headings
  # to generate a table of contents following these rules:
  #
  # h2 -> first-level
  #   h3 -> second-level
  tableOfContents: (markdown)->
    toc_md.render toc(markdown).content
    # navigation = marked.lexer(markdown).filter((token)->
    #   return token.type == "heading" && (token.depth == 2 || token.depth == 3)
    # )

    # current_section = null
    # toc = {}
    # navigation.forEach (token, i, arr)->
    #   id =   token.text.parameterize()
    #   n  =   token.text

    #   if token.depth == 2
    #     current_section = id
    #     toc[id] =
    #       name: n
    #   else if toc[current_section]
    #     toc[current_section]["subSections"] ||= []
    #     toc[current_section]["subSections"].push
    #       id:   id
    #       name: n

    # return toc

module.exports = Markdown