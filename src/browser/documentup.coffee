class window.DocumentUp
  @template = (locals)->
    """
    <nav id="nav">
      <header>
        <a href="#" id="logo">#{locals.name}</a>
      </header>
      <ul id="sections">
      </ul>
    </nav>
    <div id="content">
      <div id="loader">
        Loading documentation...
      </div>
    </div>
    """

  @defaults =
    color: "#369"
    twitter: null
    issues: true
    travis: false

  @document = (@options)->
    if "string" == typeof @options
      repo = @options
      @options = 
        repo: repo
    
    if !@options or !@options.repo or !/\//.test(@options.repo)
      throw new Error("Repository required with format: username/repository")

    @options[key] = value for key, value of @defaults when !@options[key]

    @options.name ||= @options.repo.replace(/.+\//, "")

    # Prepare layout
    $.domReady =>
      $("title").text(@options.name)
      $("body").html @template(@options)
      $("head").append """
        <style type="text/css">
          a {color: #{@options.color}}
        </style>
      """

      $nav = $("#nav")

      $nav.append """
        <div id="github" class="extra">
          <a href="https://github.com/#{@options.repo}">Source on Github</a>
        </div>
      """

      if @options.issues
        $nav.append """
          <div id="github-issues" class="extra">
            <a href="https://github.com/#{@options.repo}/issues">Issues</a>
          </div>
        """

      if @options.travis
        $nav.append """
          <div id="travis" class="extra">
            <a href="http://travis-ci.org/#{@options.repo}">
              <img src="https://secure.travis-ci.org/#{@options.repo}.png">
            </a>
          </div>
        """
      
      if @options.twitter
        @options.twitter = [@options.twitter] unless @options.twitter instanceof Array

        for twitter in @options.twitter
          twitter = twitter.replace("@", "")
          extra = $("<div class='extra twitter'>")
          iframe = $('<iframe allowtransparency="true" frameborder="0" scrolling="no" style="width:162px; height:20px;">')
          iframe.attr "src", "https://platform.twitter.com/widgets/follow_button.html?screen_name=#{twitter}&show_count=false"
          extra.append(iframe)
          $nav.append extra

    @getReadme (err, @html)=>
      return throw err if err
      $.domReady =>
        @renderContent()
  
  @getReadme = (callback)->
    using_cache = false
  
    if html = localStorage.getItem("cached_content")
      callback(null, html)
      @usingCache = true

    $.ajax
      url: "https://api.github.com/repos/#{@options.repo}/git/trees/master?callback=?"
      type: "jsonp"
      success: (resp)=>
        readme_sha = obj.sha for obj in resp.data.tree when /readme/i.test(obj.path)
        last_sha = localStorage.getItem("readme_sha")
        if readme_sha != last_sha
          $.ajax
            url: "https://api.github.com/repos/#{@options.repo}/git/blobs/#{readme_sha}?callback=?"
            type: "jsonp"
            success: (resp)=>
              html = marked(decode64(resp.data.content))
              localStorage.setItem("cached_content", html)
              localStorage.setItem("readme_sha", readme_sha)
              
              return callback(null, html) unless @usingCache
              
              $.domReady ->
                # Show a link to tell the user to refresh his browser to get
                # the latest version of the readme  
                refresh_link = $("<a id='refresh' href='#'>There's a new version of the documentation<br>Click here or refresh to see it.</a>")
                $("body").append(refresh_link)
                refresh_link.bind "click", (event)=>
                  event.preventDefault()
                  callback(null, html)
                  refresh_link.remove()
  
  @renderContent = ->
    # Populate HTML content
    $content = $("#content")
    $content.html @html

    # Generate the navigation tree with the document structure
    current_section = 0
    current_subsection = 0

    $sections = $("#sections")

    $sections.empty()

    $("h2, h3").each (el)->
      if el.tagName == "H2"
        current_subsection = 0
        current_section++
        el.id = section_id = "section-#{current_section}"
        $sections.append """
          <li id="for-#{section_id}">
            <a href="##{section_id}">#{el.textContent}</a>
          </li>
        """
      else if el.tagName == "H3"
        current_subsection++
        el.id = section_id = "section-#{current_section}-#{current_subsection}"
        $subsection = $("#for-section-#{current_section} ul")
        unless $subsection.length
          $("#for-section-#{current_section}").append("<ul></ul>")
          $subsection = $("#for-section-#{current_section} ul")
        $subsection.append """
          <li id="for-#{section_id}">
            <a href="##{section_id}">#{el.textContent}</a>
          </li>
        """
    
    # Highlight the code bits:
    $("pre code").each (el)->
      hljs.initHighlighting(el)


decode64 = (input) ->
  output = ""
  chr1 = undefined
  chr2 = undefined
  chr3 = ""
  enc1 = undefined
  enc2 = undefined
  enc3 = undefined
  enc4 = ""
  i = 0
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "")
  loop
    enc1 = keyStr.indexOf(input.charAt(i++))
    enc2 = keyStr.indexOf(input.charAt(i++))
    enc3 = keyStr.indexOf(input.charAt(i++))
    enc4 = keyStr.indexOf(input.charAt(i++))
    chr1 = (enc1 << 2) | (enc2 >> 4)
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
    chr3 = ((enc3 & 3) << 6) | enc4
    output = output + String.fromCharCode(chr1)
    output = output + String.fromCharCode(chr2)  unless enc3 is 64
    output = output + String.fromCharCode(chr3)  unless enc4 is 64
    chr1 = chr2 = chr3 = ""
    enc1 = enc2 = enc3 = enc4 = ""
    break unless i < input.length
  unescape output

keyStr = "ABCDEFGHIJKLMNOP" + "QRSTUVWXYZabcdef" + "ghijklmnopqrstuv" + "wxyz0123456789+/" + "="