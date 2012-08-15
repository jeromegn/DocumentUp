{ listen, assert } = require("./helpers")
config             = require("../config")
Browser            = require("zombie")
File               = require("fs")
request            = require("request")

SAMPLE = File.readFileSync "#{__dirname}/fixtures/readme.md", "utf8"

describe "On Demand API", ->
  before listen

  describe "POST", ->
    before (done)->
      options =
        body:
          content: SAMPLE
        json: true
      request.post "#{config.base_uri}/compiled", options, (error, response, body)=>
        { @statusCode, body } = response
        @browser = new Browser()
        @browser.load body, done
        
    it "should return the parsed html", ->
      assert @browser.query("a[href='#h2']")
      assert.equal @browser.text("p"), "Some paragraph"

    it "uses the screen.css", ->
      stylesheet_url = @browser.query("link[href]").getAttribute("href")
      assert stylesheet_url.indexOf("screen.css") > -1

  describe "POST", ->
    before (done)->
      options =
        body:
          content: SAMPLE
          theme: 'v1'
        json: true
      request.post "#{config.base_uri}/compiled", options, (error, response, body)=>
        { @statusCode, body } = response
        @browser = new Browser()
        @browser.load body, done

    it "uses the v1.css", ->
      stylesheet_url = @browser.query("link[href]").getAttribute("href")
      assert stylesheet_url.indexOf("v1.css") > -1
    
