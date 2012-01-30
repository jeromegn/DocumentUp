$.domReady ->
  $("pre code").each (el)->
      hljs.highlightBlock(el, "  ")