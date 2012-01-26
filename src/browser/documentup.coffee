class window.DocumentUp

  # Base template that'll lie in the <body> of the page
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

  # Decent defaults
  @defaults =
    color: "#369"
    twitter: null
    issues: true
    travis: false

  # Documentation method
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
  
    if html = localStorage.getItem(@options.repo + ":cached_content")
      callback(null, html)
      @usingCache = true

    $.ajax
      url: "https://api.github.com/repos/#{@options.repo}/git/trees/master?callback=?"
      type: "jsonp"
      success: (resp)=>
        readme_sha = obj.sha for obj in resp.data.tree when /readme/i.test(obj.path)
        last_sha = localStorage.getItem(@options.repo + ":readme_sha")
        if readme_sha != last_sha
          $.ajax
            url: "https://api.github.com/repos/#{@options.repo}/git/blobs/#{readme_sha}?callback=?"
            type: "jsonp"
            success: (resp)=>
              html = marked(Base64.decode(resp.data.content))
              localStorage.setItem(@options.repo + ":cached_content", html)
              localStorage.setItem(@options.repo + ":readme_sha", readme_sha)
              
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
      hljs.highlightBlock(el, "  ")

Base64 =
  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
  encode: (input) ->
    output = ""
    chr1 = undefined
    chr2 = undefined
    chr3 = undefined
    enc1 = undefined
    enc2 = undefined
    enc3 = undefined
    enc4 = undefined
    i = 0
    input = Base64._utf8_encode(input)
    while i < input.length
      chr1 = input.charCodeAt(i++)
      chr2 = input.charCodeAt(i++)
      chr3 = input.charCodeAt(i++)
      enc1 = chr1 >> 2
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
      enc4 = chr3 & 63
      if isNaN(chr2)
        enc3 = enc4 = 64
      else enc4 = 64  if isNaN(chr3)
      output = output + @_keyStr.charAt(enc1) + @_keyStr.charAt(enc2) + @_keyStr.charAt(enc3) + @_keyStr.charAt(enc4)
    output

  decode: (input) ->
    output = ""
    chr1 = undefined
    chr2 = undefined
    chr3 = undefined
    enc1 = undefined
    enc2 = undefined
    enc3 = undefined
    enc4 = undefined
    i = 0
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "")
    while i < input.length
      enc1 = @_keyStr.indexOf(input.charAt(i++))
      enc2 = @_keyStr.indexOf(input.charAt(i++))
      enc3 = @_keyStr.indexOf(input.charAt(i++))
      enc4 = @_keyStr.indexOf(input.charAt(i++))
      chr1 = (enc1 << 2) | (enc2 >> 4)
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
      chr3 = ((enc3 & 3) << 6) | enc4
      output = output + String.fromCharCode(chr1)
      output = output + String.fromCharCode(chr2)  unless enc3 is 64
      output = output + String.fromCharCode(chr3)  unless enc4 is 64
    output = Base64._utf8_decode(output)
    output

  _utf8_encode: (string) ->
    string = string.replace(/\r\n/g, "\n")
    utftext = ""
    n = 0

    while n < string.length
      c = string.charCodeAt(n)
      if c < 128
        utftext += String.fromCharCode(c)
      else if (c > 127) and (c < 2048)
        utftext += String.fromCharCode((c >> 6) | 192)
        utftext += String.fromCharCode((c & 63) | 128)
      else
        utftext += String.fromCharCode((c >> 12) | 224)
        utftext += String.fromCharCode(((c >> 6) & 63) | 128)
        utftext += String.fromCharCode((c & 63) | 128)
      n++
    utftext

  _utf8_decode: (utftext) ->
    string = ""
    i = 0
    c = c1 = c2 = 0
    while i < utftext.length
      c = utftext.charCodeAt(i)
      if c < 128
        string += String.fromCharCode(c)
        i++
      else if (c > 191) and (c < 224)
        c2 = utftext.charCodeAt(i + 1)
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63))
        i += 2
      else
        c2 = utftext.charCodeAt(i + 1)
        c3 = utftext.charCodeAt(i + 2)
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))
        i += 3
    string

# decode64 = (input) ->
#   output = ""
#   chr1 = undefined
#   chr2 = undefined
#   chr3 = ""
#   enc1 = undefined
#   enc2 = undefined
#   enc3 = undefined
#   enc4 = ""
#   i = 0
#   input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "")
#   loop
#     enc1 = keyStr.indexOf(input.charAt(i++))
#     enc2 = keyStr.indexOf(input.charAt(i++))
#     enc3 = keyStr.indexOf(input.charAt(i++))
#     enc4 = keyStr.indexOf(input.charAt(i++))
#     chr1 = (enc1 << 2) | (enc2 >> 4)
#     chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
#     chr3 = ((enc3 & 3) << 6) | enc4
#     output = output + String.fromCharCode(chr1)
#     output = output + String.fromCharCode(chr2)  unless enc3 is 64
#     output = output + String.fromCharCode(chr3)  unless enc4 is 64
#     chr1 = chr2 = chr3 = ""
#     enc1 = enc2 = enc3 = enc4 = ""
#     break unless i < input.length
#   unescape output

# keyStr = "ABCDEFGHIJKLMNOP" + "QRSTUVWXYZabcdef" + "ghijklmnopqrstuv" + "wxyz0123456789+/" + "="
