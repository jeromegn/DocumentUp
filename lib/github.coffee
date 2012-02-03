Request = require("request")
Async = require("async")

file_matchers = require("./matchers")


# Static class to handle Github API requests
class Github

  # Get the required files for a repo (readme.md and documentup.json)
  # 
  # - After getting the master tree, select the right SHAs
  # - Then go get each of the blobs
  @getBlobsFor = (repo, callback)=>
    @getMasterTree repo, (err, tree)=>
      return callback(err) if err
      readme_sha = obj.sha for obj in tree when file_matchers.readme.test(obj.path)
      config_sha = obj.sha for obj in tree when file_matchers.config.test(obj.path)

      Async.parallel

        readme: (callback)=>
          @getBlob readme_sha, repo, callback
        
        config: (callback)=>
          return callback(null, null) if !config_sha
          @getBlob config_sha, repo, callback
      
      , (err, results)->
        return callback(err) if err
        callback null, readme: results.readme, config: JSON.parse(results.config)

  # Gets one blob from the sha and repository
  @getBlob = (sha, repo, callback)=>
    Request
      method: "GET"
      url: "https://api.github.com/repos/#{repo}/git/blobs/#{sha}"
      # Required to not get a base64 encoded string
      headers:
        "Accept": "application/vnd.github-blob.raw"
      (err, resp, body)->
        return callback(err) if err
        callback(null, body)

  # Gets the master tree of a repository
  @getMasterTree = (repo, callback)=>
    Request
      method: "GET"
      url: "https://api.github.com/repos/#{repo}/git/trees/master"
      (err, resp, body)=>
        return callback(err) if err
        data = JSON.parse(body)
        return callback(new Error(data.message)) if data.message
        tree = data.tree
        callback(null, tree)

module.exports = Github