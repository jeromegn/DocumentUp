Helpers = require("./helpers")
assert  = require("assert")
Github  = require("../lib/github")

describe "Github", ->

  describe "without access token", ->
    before ->
      @api = new Github()

    describe "GET", ->
      before (done)->
        @api.get path: "repos/jeromegn/DocumentUp/git/trees/master", (error, @status, @tree)=>
          done(error)
      it "should return the status", ->
        assert.equal @status, 200
      it "should return json", ->
        assert.equal typeof @tree, "object"
      it "should have some data in it", ->
        assert.equal @tree.sha, "master"

    describe "GET raw file", ->
      before (done)->
        @api.getFile "jeromegn/DocumentUp/master/.documentup.json", (error, @status, @content)=>
          done(error)
      it "should return the status", ->
        assert.equal @status, 200
      it "should return the file's contents", ->
        expecting = {"name": "DocumentUp","twitter":["jeromegn","DocumentUp"],"google_analytics": "UA-5201171-14"}
        assert.deepEqual JSON.parse(@content), expecting