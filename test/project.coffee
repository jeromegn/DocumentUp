{ assert, flush_redis } = require("./helpers")
config  = require("../config")
redis   = require("../config/redis")
Project = require("../app/models/project")

describe "Project", ->
  before flush_redis

  describe "instantiation", ->
    before ->
      @project = new Project("jeromegn", "DocumentUp")
    it "should create a new instance of Project",->
      assert.instanceOf @project, Project

  describe "class methods", ->
    describe "load", ->
      before (done)->
        Project.load "jeromegn", "DocumentUp", (error, @project)=>
          done(error)
      it "should return a project object", ->
        assert @project instanceof Project
      describe "should have set the property", ->
        it "username", ->
          assert.equal @project.username, "jeromegn"
        it "project name", ->
          assert.equal @project.project_name, "DocumentUp"
        it "config", ->
          config = 
            source:  "github"
            twitter: [ 'jeromegn', 'DocumentUp' ]
            issues:  true
            travis:  false
            ribbon:  true
            google_analytics: 'UA-5201171-14'
            theme:   null
            name:    'DocumentUp'
          assert.deepEqual @project.config, config
        it "source", ->
          assert.isString @project.source
        it "compiled", ->
          assert.isString @project.compiled
        it "toc", ->
          toc =
            'hosted':
              name: 'Hosted'
              subSections: [
                { id: 'post-receive-hook', name: 'Post-Receive Hook' }
                { id: 'manual-recompile', name: 'Manual Recompile' }
                { id: 'configuration', name: 'Configuration' }
              ]
            'on-demand-api': 
              name: 'On-Demand API'
              subSections: [
                { id: 'parameters', name: 'Parameters' }
                { id: 'post-example', name: 'POST example' }
                { id: 'jsonp-example-with-jquery', name: 'JSONP example with jQuery' }
              ]
            'gh-pages': 
              name: 'gh-pages'
              subSections: [
                { id: 'configuration', name: 'Configuration' }
                { id: 'example', name: 'Example' }
                { id: 'what-this-script-does', name: 'What this script does' }
              ]
            'formatting-guide':
              name: 'Formatting guide'
            'options':
              name: 'Options'
            'roadmap':
              name: 'Roadmap'
            'thank-you':
              name: 'Thank you'
            'changelog':
              name: 'Changelog'
            'license':
              name: 'License'
          
          assert.deepEqual @project.toc, toc


  describe "instance methods", ->
    before (done)->
      Project.load "jeromegn", "DocumentUp", (error, @project)=>
        done(error)
    
    describe "set config", ->
      before ->
        @project.config =
          google_analytics: "test"

      it "should have set the config element", ->
        assert.equal @project.config.google_analytics, "test"
      it "should have set the defaults for the others", ->
        assert.deepEqual @project.config.twitter, []
        assert.equal @project.config.travis, false
        assert.equal @project.config.issues, true
        assert.equal @project.config.ribbon, true
        assert.equal @project.config.theme, null