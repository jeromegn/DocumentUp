Helper  = require("./helpers") # must be at top
assert  = require("assert")
Browser = require("zombie")
Async   = require("async")
request = require("request")
File    = require("fs")

post_receive = File.readFileSync("#{__dirname}/fixtures/post_receive", "utf8")

describe "Hosted", ->

  browser = new Browser()
  before Helper.listen

  describe "viewing documentup's home", ->
    before (done)->
      browser.visit "/", done
    it "should work", ->
      assert.equal browser.statusCode, 200

  describe "viewing documentup's documentation url", ->
    before (done)->
      browser.visit "/jeromegn/documentup", done
    it "should work", ->
      assert.equal browser.statusCode, 200

  describe "post receive hook", ->
    statusCode = body = headers = null
    before (done)->
      request.post "http://localhost:3003/recompile", form: payload: post_receive, (err, response, body)->
        { statusCode, headers, body } = response
        done()
    it "should work", ->
      assert.equal statusCode, 200