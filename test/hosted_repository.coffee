{ listen, assert, flush_redis }  = require("./helpers")
Browser = require("zombie")
request = require("request")
File    = require("fs")

post_receive = File.readFileSync("#{__dirname}/fixtures/post_receive", "utf8")

describe "Hosted", ->

  before flush_redis
  before listen

  describe "viewing documentup's home", ->
    before (done)->
      @browser = new Browser()
      @browser.visit "/", done
    it "should succeed", ->
      assert.equal @browser.statusCode, 200

  describe "viewing documentup's documentation url", ->
    before (done)->
      @browser = new Browser()
      @browser.visit "/jeromegn/DocumentUp", done
    it "should succeed", ->
      assert.equal @browser.statusCode, 200
    it "should display the project's name", ->
      assert.equal @browser.text("#header"), "DocumentUp"
    it "should display the table of contents", ->
      # first level
      assert.equal @browser.text("#sections > li > a"), "HostedOn-Demand APIgh-pagesFormatting guideOptionsRoadmapThank youChangelogLicense"
      # second level
      assert.equal @browser.text("#sections li ul a"), "Post-Receive HookManual RecompileConfigurationParametersPOST exampleJSONP example with jQueryConfigurationExampleWhat this script does"
    it "should display a link to the repository", ->
      assert.equal @browser.text("#github"), "Source on Github"
    it "should display a link to the repository's issues", ->
      assert.equal @browser.text("#github-issues"), "Issues"
    it "should display the twitter buttons",->
      assert.equal @browser.queryAll(".extra.twitter").length, 2
    it "should display the github ribbon", ->
      assert @browser.query("#github-ribbon")
    it "should display the parsed markdown", ->
      # Look for a paragraph with an image in it.
      assert @browser.query("p:first img")


  describe "viewing a repository where github returns a 404", ->
    before (done)->
      @browser = new Browser()
      @browser.visit "/404/repo", =>
        done()
    it "should return a 404", ->
      assert.equal @browser.statusCode, 404
    it "should show 404 text", ->
      assert.equal @browser.text("h1"), "Not found"
    it "should show link to login", ->
      assert.equal @browser.text("a[href='/404/repo?auth=1']"), "Sign-in with Github"


  describe "logging in to view a private repo", ->
    before (done)->
      @browser = new Browser()
      @browser.visit "/private/repo?code=12345", =>
        done()
    it "should redirect to the repository", ->
      assert.ok @browser.redirected

  
  describe "post receive hook", ->
    before (done)->
      request.post "http://localhost:3003/recompile", form: payload: post_receive, (err, response, body)=>
        { @statusCode, @headers, @body } = response
        done()
    it "should succeed", ->
      assert.equal @statusCode, 200

  
  describe "manual recompile", ->
    before (done)->
      @browser = new Browser()
      @browser.visit "/jeromegn/DocumentUp/recompile", done
    it "should succeed", ->
      assert.equal @browser.location.pathname, "/jeromegn/DocumentUp"


  describe "different configurations", ->
    describe "no config file", ->
      before (done)->
        @browser = new Browser()
        @browser.visit "/test/test", done
      it "should succeed", ->
        assert.equal @browser.statusCode, 200
      it "should show a name for the project", ->
        assert.equal @browser.document.title, "test"
      it "should return a non-empty document", ->
        assert @browser.queryAll("body *").length > 0

    describe "invalid config", ->
      before (done)->
        @browser = new Browser()
        @browser.visit "/test/invalid", done
      it "should succeed", ->
        assert.equal @browser.statusCode, 200



