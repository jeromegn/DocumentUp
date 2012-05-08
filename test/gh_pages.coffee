Helper  = require("./helper") # must be at top
assert  = require("assert")
Browser = require("zombie")
Async   = require("async")
Request = require("request")


for_html_replaced = (window)->
  return window.document.querySelector("#nav")


describe "GH Pages", ->

  browser = new Browser()

  #before Helper.setup
  before Helper.once

  describe "viewing", ->
    before (done)->
      browser.visit "/gh_pages_test", ->
        browser.wait for_html_replaced, done

    it "should work", ->
      assert.equal browser.statusCode, 200

    it "should show the repository name", ->
      console.log browser.html()
      assert.equal browser.query("#logo").textContent, "DocumentUp"
