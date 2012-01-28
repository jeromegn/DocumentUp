# Routing support for PJAX.
#
# Allows client-side JavaScript to listen to location changes and act accordingly.
#
# Each route fires the 'enter' event with named parameter once the location changed and the PJAX request has done
# processing.
#
# Each route fires the 'exit' event with the value returned from firing the 'enter' event before changing to a new
# location.
#
# Example
#
#     route("/tick-tock").on "enter", (params)->
#       timer = setInterval(doSomething, 2000)
#       return timer
#     .on "exit", (timer)->
#       clearInterval timer
#
# You can register multiple event handlers.  As a short-cut you can register the 'enter' event handler by passing a
# function as the second argument to route.
#
# Example
#
#     route "/books/:name", (params)->
#       document.title = "Now reading #{params.name}"

# Defines and returns a route.  You can call on and emit on the route.  As a
# shortcut, you can also call this function with path and function,
# equivalent to registering handler for the 'enter' event.
#
# Example
#     route "/books/:name", (params)->
#       console.log "Showing the book", params.name
#
#     route("/books/:name").on "enter", (params)->
this.route = (path, fn)->
  # Find existing route, if not, create a new one.
  route = by_path[path]
  unless route
    route = new Route(path)
    routes.push route
    by_path[path] = route
  # Shortcut to register 'enter' event handler.
  if typeof fn == "function"
    route.on "enter", fn
  return route


PATH_NAME_MATCHER = /:([\w\d]+)/g
PATH_REPLACER     = "([^\/]+)"
# Maps routes by path.
by_path = {}
# Routes by order in which they were created.
routes = []
# The last route.  This is an object that holds the actual route and its
# state, the result of the last enter event handler.
last = null

# Defines a route.  A route is an event emitter, you bind by calling
# on(event, fn) and fire event by calling emit(event, params).
class Route
  constructor: (path)->
    # Determine all the names that show up in the route (e.g. /book/:name)
    # will result in ["name"].
    @names = []
    while match = PATH_NAME_MATCHER.exec(path)
      @names.push match[1]
    # Create a Regexp to match the route.
    @regexp = new RegExp("^#{path.replace(PATH_NAME_MATCHER, PATH_REPLACER)}$")

    # These are the event handlers.  The key is the event name, and the value
    # is either a function (most common case) or array of functions.
    @handlers = {}

  # Register a new event handler.
  #
  # Example
  #     route("/books").on "enter", (params)->
  on: (event, fn)->
    if !fn
      return
    # First time we set handler to function, subsequently we add to array of
    # functions.
    if @handlers[event]
      if !@handlers[event].push
        @handlers[event] = [@handlers[event]]
      @handlers[event].push fn
    else
      @handlers[event] = fn
    return this

  # Fires an event.
  #
  # Example
  #     route("/books").emit "exit"
  emit: (event, params)->
    handler = @handlers[event]
    # Most often handler maps to a single function, if not, an array of
    # functions to be called in order.
    if typeof handler == "function"
      return handler(params)
    state = null
    if handler && handler.length
      for fn in handler
        state = fn(params)
    return state

  # If route matches the given path, returns an object with the named
  # parameters.  Otherwise, returns undefined.
  match: (path)->
    if match = @regexp.exec(path)
      params = {}
      for i, name of @names
        params[name] = match[i + 1]
      return params

# Called whenever document location changes. Fires enter event.
locationChanged = ->
  if last
    last.route.emit("exit", last.state)
  path = window.location.pathname
  for route in routes
    if params = route.match(path)
      for param in window.location.search.slice(1).split("&")
        [name, value] = param.split("=")
        params[name] = unescape(value)
      last =
        route: route,
        state: route.emit("enter", params)
      return

# Fire after successfully processing PJAX response.
$(window).bind "statechange", ->
  locationChanged()

$.domReady ->
  locationChanged()