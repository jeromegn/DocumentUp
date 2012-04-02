Helper  = require("./helper") # must be at top
assert  = require("assert")
Browser = require("zombie")
Async   = require("async")
request = require("request")

post_receive = require("./fixtures/post_receive.json")


describe "Hosted", ->

  before Helper.once

  describe "post receive hook", ->

    statusCode = body = headers = null
    
    before (done)->
      request.post "http://localhost:3003/recompile", json: post_receive, (err, response, body)->
        { statusCode, headers, body } = response
        done()

    it "should work", ->
      assert.equal statusCode, 200
