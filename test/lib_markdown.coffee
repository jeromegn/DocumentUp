{ assert } = require("./helpers")
Markdown   = require("../lib/markdown")
File       = require("fs")

SAMPLE = File.readFileSync "#{__dirname}/fixtures/readme.md", "utf8"

describe "Markdown", ->
  describe "parse", ->
    before ->
      @compiled = Markdown.parse(SAMPLE)
    it "should return html", ->
      assert.equal @compiled, "<h1>h1</h1>\n<h2 id='h2'>h2</h2 id='h2'>\n<p>Some paragraph</p>\n"

  describe "table of contents", ->
    before ->
      @toc = Markdown.tableOfContents(SAMPLE)
    it "should return a table of contents",->
      assert.deepEqual @toc, { h2: { name: 'h2' } }