if (typeof window.localStorage == 'undefined' || typeof window.sessionStorage == 'undefined') (function () {

var Storage = function (type) {
  function createCookie(name, value, days) {
    var date, expires;

    if (days) {
      date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      expires = "; expires="+date.toGMTString();
    } else {
      expires = "";
    }
    document.cookie = name+"="+value+expires+"; path=/";
  }

  function readCookie(name) {
    var nameEQ = name + "=",
        ca = document.cookie.split(';'),
        i, c;

    for (i=0; i < ca.length; i++) {
      c = ca[i];
      while (c.charAt(0)==' ') {
        c = c.substring(1,c.length);
      }

      if (c.indexOf(nameEQ) == 0) {
        return c.substring(nameEQ.length,c.length);
      }
    }
    return null;
  }
  
  function setData(data) {
    data = JSON.stringify(data);
    if (type == 'session') {
      window.name = data;
    } else {
      createCookie('localStorage', data, 365);
    }
  }
  
  function clearData() {
    if (type == 'session') {
      window.name = '';
    } else {
      createCookie('localStorage', '', 365);
    }
  }
  
  function getData() {
    var data = type == 'session' ? window.name : readCookie('localStorage');
    return data ? JSON.parse(data) : {};
  }


  // initialise if there's already data
  var data = getData();

  return {
    length: 0,
    clear: function () {
      data = {};
      this.length = 0;
      clearData();
    },
    getItem: function (key) {
      return data[key] === undefined ? null : data[key];
    },
    key: function (i) {
      // not perfect, but works
      var ctr = 0;
      for (var k in data) {
        if (ctr == i) return k;
        else ctr++;
      }
      return null;
    },
    removeItem: function (key) {
      delete data[key];
      this.length--;
      setData(data);
    },
    setItem: function (key, value) {
      data[key] = value+''; // forces the value to a string
      this.length++;
      setData(data);
    }
  };
};

if (typeof window.localStorage == 'undefined') window.localStorage = new Storage('local');
if (typeof window.sessionStorage == 'undefined') window.sessionStorage = new Storage('session');

})();/*!
  * =============================================================
  * Ender: open module JavaScript framework (https://ender.no.de)
  * Build: ender build bonzo qwery bean reqwest domready
  * =============================================================
  */

/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)
  * http://ender.no.de
  * License MIT
  */
!function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context.$

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules[identifier] || window[identifier]
    if (!module) throw new Error("Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules[name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  function boosh(s, r, els) {
    // string || node || nodelist || window
    if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      els = ender._select(s, r)
      els.selector = s
    } else els = isFinite(s.length) ? s : [s]
    return aug(els, boosh)
  }

  function ender(s, r) {
    return boosh(s, r)
  }

  aug(ender, {
      _VERSION: '0.3.6'
    , fn: boosh // for easy compat to jQuery plugins
    , ender: function (o, chain) {
        aug(chain ? boosh : ender, o)
      }
    , _select: function (s, r) {
        return (r || document).querySelectorAll(s)
      }
  })

  aug(boosh, {
    forEach: function (fn, scope, i) {
      // opt out of native forEach so we can intentionally call our own scope
      // defaulting to the current item and be able to return self
      for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(scope || this[i], this[i], i, this)
      // return self for chaining
      return this
    },
    $: ender // handy reference to self
  })

  ender.noConflict = function () {
    context.$ = old
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = context['ender'] || ender

}(this);

!function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * bean.js - copyright Jacob Thornton 2011
    * https://github.com/fat/bean
    * MIT License
    * special thanks to:
    * dean edwards: http://dean.edwards.name/
    * dperini: https://github.com/dperini/nwevents
    * the entire mootools team: github.com/mootools/mootools-core
    */
  !function (name, context, definition) {
    if (typeof module !== 'undefined') module.exports = definition(name, context);
    else if (typeof define === 'function' && typeof define.amd  === 'object') define(definition);
    else context[name] = definition(name, context);
  }('bean', this, function (name, context) {
    var win = window
      , old = context[name]
      , overOut = /over|out/
      , namespaceRegex = /[^\.]*(?=\..*)\.|.*/
      , nameRegex = /\..*/
      , addEvent = 'addEventListener'
      , attachEvent = 'attachEvent'
      , removeEvent = 'removeEventListener'
      , detachEvent = 'detachEvent'
      , doc = document || {}
      , root = doc.documentElement || {}
      , W3C_MODEL = root[addEvent]
      , eventSupport = W3C_MODEL ? addEvent : attachEvent
      , slice = Array.prototype.slice
      , mouseTypeRegex = /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i
      , mouseWheelTypeRegex = /mouse.*(wheel|scroll)/i
      , textTypeRegex = /^text/i
      , touchTypeRegex = /^touch|^gesture/i
      , ONE = { one: 1 } // singleton for quick matching making add() do one()
  
      , nativeEvents = (function (hash, events, i) {
          for (i = 0; i < events.length; i++)
            hash[events[i]] = 1
          return hash
        })({}, (
            'click dblclick mouseup mousedown contextmenu ' +                  // mouse buttons
            'mousewheel mousemultiwheel DOMMouseScroll ' +                     // mouse wheel
            'mouseover mouseout mousemove selectstart selectend ' +            // mouse movement
            'keydown keypress keyup ' +                                        // keyboard
            'orientationchange ' +                                             // mobile
            'focus blur change reset select submit ' +                         // form elements
            'load unload beforeunload resize move DOMContentLoaded readystatechange ' + // window
            'error abort scroll ' +                                            // misc
            (W3C_MODEL ? // element.fireEvent('onXYZ'... is not forgiving if we try to fire an event
                         // that doesn't actually exist, so make sure we only do these on newer browsers
              'show ' +                                                          // mouse buttons
              'input invalid ' +                                                 // form elements
              'touchstart touchmove touchend touchcancel ' +                     // touch
              'gesturestart gesturechange gestureend ' +                         // gesture
              'message readystatechange pageshow pagehide popstate ' +           // window
              'hashchange offline online ' +                                     // window
              'afterprint beforeprint ' +                                        // printing
              'dragstart dragenter dragover dragleave drag drop dragend ' +      // dnd
              'loadstart progress suspend emptied stalled loadmetadata ' +       // media
              'loadeddata canplay canplaythrough playing waiting seeking ' +     // media
              'seeked ended durationchange timeupdate play pause ratechange ' +  // media
              'volumechange cuechange ' +                                        // media
              'checking noupdate downloading cached updateready obsolete ' +     // appcache
              '' : '')
          ).split(' ')
        )
  
      , customEvents = (function () {
          function isDescendant(parent, node) {
            while ((node = node.parentNode) !== null) {
              if (node === parent) return true
            }
            return false
          }
  
          function check(event) {
            var related = event.relatedTarget
            if (!related) return related === null
            return (related !== this && related.prefix !== 'xul' && !/document/.test(this.toString()) && !isDescendant(this, related))
          }
  
          return {
              mouseenter: { base: 'mouseover', condition: check }
            , mouseleave: { base: 'mouseout', condition: check }
            , mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
          }
        })()
  
      , fixEvent = (function () {
          var commonProps = 'altKey attrChange attrName bubbles cancelable ctrlKey currentTarget detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey srcElement target timeStamp type view which'.split(' ')
            , mouseProps = commonProps.concat('button buttons clientX clientY dataTransfer fromElement offsetX offsetY pageX pageY screenX screenY toElement'.split(' '))
            , mouseWheelProps = mouseProps.concat('wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ axis'.split(' ')) // 'axis' is FF specific
            , keyProps = commonProps.concat('char charCode key keyCode keyIdentifier keyLocation'.split(' '))
            , textProps = commonProps.concat(['data'])
            , touchProps = commonProps.concat('touches targetTouches changedTouches scale rotation'.split(' '))
            , preventDefault = 'preventDefault'
            , createPreventDefault = function (event) {
                return function () {
                  if (event[preventDefault])
                    event[preventDefault]()
                  else
                    event.returnValue = false
                }
              }
            , stopPropagation = 'stopPropagation'
            , createStopPropagation = function (event) {
                return function () {
                  if (event[stopPropagation])
                    event[stopPropagation]()
                  else
                    event.cancelBubble = true
                }
              }
            , createStop = function (synEvent) {
                return function () {
                  synEvent[preventDefault]()
                  synEvent[stopPropagation]()
                  synEvent.stopped = true
                }
              }
            , copyProps = function (event, result, props) {
                var i, p
                for (i = props.length; i--;) {
                  p = props[i]
                  if (!(p in result) && p in event) result[p] = event[p]
                }
              }
  
          return function (event, isNative) {
            var result = { originalEvent: event, isNative: isNative }
            if (!event)
              return result
  
            var props
              , type = event.type
              , target = event.target || event.srcElement
  
            result[preventDefault] = createPreventDefault(event)
            result[stopPropagation] = createStopPropagation(event)
            result.stop = createStop(result)
            result.target = target && target.nodeType === 3 ? target.parentNode : target
  
            if (isNative) { // we only need basic augmentation on custom events, the rest is too expensive
              if (type.indexOf('key') !== -1) {
                props = keyProps
                result.keyCode = event.which || event.keyCode
              } else if (mouseTypeRegex.test(type)) {
                props = mouseProps
                result.rightClick = event.which === 3 || event.button === 2
                result.pos = { x: 0, y: 0 }
                if (event.pageX || event.pageY) {
                  result.clientX = event.pageX
                  result.clientY = event.pageY
                } else if (event.clientX || event.clientY) {
                  result.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft
                  result.clientY = event.clientY + doc.body.scrollTop + root.scrollTop
                }
                if (overOut.test(type))
                  result.relatedTarget = event.relatedTarget || event[(type === 'mouseover' ? 'from' : 'to') + 'Element']
              } else if (touchTypeRegex.test(type)) {
                props = touchProps
              } else if (mouseWheelTypeRegex.test(type)) {
                props = mouseWheelProps
              } else if (textTypeRegex.test(type)) {
                props = textProps
              }
              copyProps(event, result, props || commonProps)
            }
            return result
          }
        })()
  
        // if we're in old IE we can't do onpropertychange on doc or win so we use doc.documentElement for both
      , targetElement = function (element, isNative) {
          return !W3C_MODEL && !isNative && (element === doc || element === win) ? root : element
        }
  
        // we use one of these per listener, of any type
      , RegEntry = (function () {
          function entry(element, type, handler, original, namespaces) {
            this.element = element
            this.type = type
            this.handler = handler
            this.original = original
            this.namespaces = namespaces
            this.custom = customEvents[type]
            this.isNative = nativeEvents[type] && element[eventSupport]
            this.eventType = W3C_MODEL || this.isNative ? type : 'propertychange'
            this.customType = !W3C_MODEL && !this.isNative && type
            this.target = targetElement(element, this.isNative)
            this.eventSupport = this.target[eventSupport]
          }
  
          entry.prototype = {
              // given a list of namespaces, is our entry in any of them?
              inNamespaces: function (checkNamespaces) {
                var i, j
                if (!checkNamespaces)
                  return true
                if (!this.namespaces)
                  return false
                for (i = checkNamespaces.length; i--;) {
                  for (j = this.namespaces.length; j--;) {
                    if (checkNamespaces[i] === this.namespaces[j])
                      return true
                  }
                }
                return false
              }
  
              // match by element, original fn (opt), handler fn (opt)
            , matches: function (checkElement, checkOriginal, checkHandler) {
                return this.element === checkElement &&
                  (!checkOriginal || this.original === checkOriginal) &&
                  (!checkHandler || this.handler === checkHandler)
              }
          }
  
          return entry
        })()
  
      , registry = (function () {
          // our map stores arrays by event type, just because it's better than storing
          // everything in a single array. uses '$' as a prefix for the keys for safety
          var map = {}
  
            // generic functional search of our registry for matching listeners,
            // `fn` returns false to break out of the loop
            , forAll = function (element, type, original, handler, fn) {
                if (!type || type === '*') {
                  // search the whole registry
                  for (var t in map) {
                    if (t.charAt(0) === '$')
                      forAll(element, t.substr(1), original, handler, fn)
                  }
                } else {
                  var i = 0, l, list = map['$' + type], all = element === '*'
                  if (!list)
                    return
                  for (l = list.length; i < l; i++) {
                    if (all || list[i].matches(element, original, handler))
                      if (!fn(list[i], list, i, type))
                        return
                  }
                }
              }
  
            , has = function (element, type, original) {
                // we're not using forAll here simply because it's a bit slower and this
                // needs to be fast
                var i, list = map['$' + type]
                if (list) {
                  for (i = list.length; i--;) {
                    if (list[i].matches(element, original, null))
                      return true
                  }
                }
                return false
              }
  
            , get = function (element, type, original) {
                var entries = []
                forAll(element, type, original, null, function (entry) { return entries.push(entry) })
                return entries
              }
  
            , put = function (entry) {
                (map['$' + entry.type] || (map['$' + entry.type] = [])).push(entry)
                return entry
              }
  
            , del = function (entry) {
                forAll(entry.element, entry.type, null, entry.handler, function (entry, list, i) {
                  list.splice(i, 1)
                  if (list.length === 0)
                    delete map['$' + entry.type]
                  return false
                })
              }
  
              // dump all entries, used for onunload
            , entries = function () {
                var t, entries = []
                for (t in map) {
                  if (t.charAt(0) === '$')
                    entries = entries.concat(map[t])
                }
                return entries
              }
  
          return { has: has, get: get, put: put, del: del, entries: entries }
        })()
  
        // add and remove listeners to DOM elements
      , listener = W3C_MODEL ? function (element, type, fn, add) {
          element[add ? addEvent : removeEvent](type, fn, false)
        } : function (element, type, fn, add, custom) {
          if (custom && add && element['_on' + custom] === null)
            element['_on' + custom] = 0
          element[add ? attachEvent : detachEvent]('on' + type, fn)
        }
  
      , nativeHandler = function (element, fn, args) {
          return function (event) {
            event = fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || win).event, true)
            return fn.apply(element, [event].concat(args))
          }
        }
  
      , customHandler = function (element, fn, type, condition, args, isNative) {
          return function (event) {
            if (condition ? condition.apply(this, arguments) : W3C_MODEL ? true : event && event.propertyName === '_on' + type || !event) {
              if (event)
                event = fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || win).event, isNative)
              fn.apply(element, event && (!args || args.length === 0) ? arguments : slice.call(arguments, event ? 0 : 1).concat(args))
            }
          }
        }
  
      , once = function (rm, element, type, fn, originalFn) {
          // wrap the handler in a handler that does a remove as well
          return function () {
            rm(element, type, originalFn)
            fn.apply(this, arguments)
          }
        }
  
      , removeListener = function (element, orgType, handler, namespaces) {
          var i, l, entry
            , type = (orgType && orgType.replace(nameRegex, ''))
            , handlers = registry.get(element, type, handler)
  
          for (i = 0, l = handlers.length; i < l; i++) {
            if (handlers[i].inNamespaces(namespaces)) {
              if ((entry = handlers[i]).eventSupport)
                listener(entry.target, entry.eventType, entry.handler, false, entry.type)
              // TODO: this is problematic, we have a registry.get() and registry.del() that
              // both do registry searches so we waste cycles doing this. Needs to be rolled into
              // a single registry.forAll(fn) that removes while finding, but the catch is that
              // we'll be splicing the arrays that we're iterating over. Needs extra tests to
              // make sure we don't screw it up. @rvagg
              registry.del(entry)
            }
          }
        }
  
      , addListener = function (element, orgType, fn, originalFn, args) {
          var entry
            , type = orgType.replace(nameRegex, '')
            , namespaces = orgType.replace(namespaceRegex, '').split('.')
  
          if (registry.has(element, type, fn))
            return element // no dupe
          if (type === 'unload')
            fn = once(removeListener, element, type, fn, originalFn) // self clean-up
          if (customEvents[type]) {
            if (customEvents[type].condition)
              fn = customHandler(element, fn, type, customEvents[type].condition, true)
            type = customEvents[type].base || type
          }
          entry = registry.put(new RegEntry(element, type, fn, originalFn, namespaces[0] && namespaces))
          entry.handler = entry.isNative ?
            nativeHandler(element, entry.handler, args) :
            customHandler(element, entry.handler, type, false, args, false)
          if (entry.eventSupport)
            listener(entry.target, entry.eventType, entry.handler, true, entry.customType)
        }
  
      , del = function (selector, fn, $) {
          return function (e) {
            var target, i, array = typeof selector === 'string' ? $(selector, this) : selector
            for (target = e.target; target && target !== this; target = target.parentNode) {
              for (i = array.length; i--;) {
                if (array[i] === target) {
                  return fn.apply(target, arguments)
                }
              }
            }
          }
        }
  
      , remove = function (element, typeSpec, fn) {
          var k, m, type, namespaces, i
            , rm = removeListener
            , isString = typeSpec && typeof typeSpec === 'string'
  
          if (isString && typeSpec.indexOf(' ') > 0) {
            // remove(el, 't1 t2 t3', fn) or remove(el, 't1 t2 t3')
            typeSpec = typeSpec.split(' ')
            for (i = typeSpec.length; i--;)
              remove(element, typeSpec[i], fn)
            return element
          }
          type = isString && typeSpec.replace(nameRegex, '')
          if (type && customEvents[type])
            type = customEvents[type].type
          if (!typeSpec || isString) {
            // remove(el) or remove(el, t1.ns) or remove(el, .ns) or remove(el, .ns1.ns2.ns3)
            if (namespaces = isString && typeSpec.replace(namespaceRegex, ''))
              namespaces = namespaces.split('.')
            rm(element, type, fn, namespaces)
          } else if (typeof typeSpec === 'function') {
            // remove(el, fn)
            rm(element, null, typeSpec)
          } else {
            // remove(el, { t1: fn1, t2, fn2 })
            for (k in typeSpec) {
              if (typeSpec.hasOwnProperty(k))
                remove(element, k, typeSpec[k])
            }
          }
          return element
        }
  
      , add = function (element, events, fn, delfn, $) {
          var type, types, i, args
            , originalFn = fn
            , isDel = fn && typeof fn === 'string'
  
          if (events && !fn && typeof events === 'object') {
            for (type in events) {
              if (events.hasOwnProperty(type))
                add.apply(this, [ element, type, events[type] ])
            }
          } else {
            args = arguments.length > 3 ? slice.call(arguments, 3) : []
            types = (isDel ? fn : events).split(' ')
            isDel && (fn = del(events, (originalFn = delfn), $)) && (args = slice.call(args, 1))
            // special case for one()
            this === ONE && (fn = once(remove, element, events, fn, originalFn))
            for (i = types.length; i--;) addListener(element, types[i], fn, originalFn, args)
          }
          return element
        }
  
      , one = function () {
          return add.apply(ONE, arguments)
        }
  
      , fireListener = W3C_MODEL ? function (isNative, type, element) {
          var evt = doc.createEvent(isNative ? 'HTMLEvents' : 'UIEvents')
          evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1)
          element.dispatchEvent(evt)
        } : function (isNative, type, element) {
          element = targetElement(element, isNative)
          // if not-native then we're using onpropertychange so we just increment a custom property
          isNative ? element.fireEvent('on' + type, doc.createEventObject()) : element['_on' + type]++
        }
  
      , fire = function (element, type, args) {
          var i, j, l, names, handlers
            , types = type.split(' ')
  
          for (i = types.length; i--;) {
            type = types[i].replace(nameRegex, '')
            if (names = types[i].replace(namespaceRegex, ''))
              names = names.split('.')
            if (!names && !args && element[eventSupport]) {
              fireListener(nativeEvents[type], type, element)
            } else {
              // non-native event, either because of a namespace, arguments or a non DOM element
              // iterate over all listeners and manually 'fire'
              handlers = registry.get(element, type)
              args = [false].concat(args)
              for (j = 0, l = handlers.length; j < l; j++) {
                if (handlers[j].inNamespaces(names))
                  handlers[j].handler.apply(element, args)
              }
            }
          }
          return element
        }
  
      , clone = function (element, from, type) {
          var i = 0
            , handlers = registry.get(from, type)
            , l = handlers.length
  
          for (;i < l; i++)
            handlers[i].original && add(element, handlers[i].type, handlers[i].original)
          return element
        }
  
      , bean = {
            add: add
          , one: one
          , remove: remove
          , clone: clone
          , fire: fire
          , noConflict: function () {
              context[name] = old
              return this
            }
        }
  
    if (win[attachEvent]) {
      // for IE, clean up on unload to avoid leaks
      var cleanup = function () {
        var i, entries = registry.entries()
        for (i in entries) {
          if (entries[i].type && entries[i].type !== 'unload')
            remove(entries[i].element, entries[i].type)
        }
        win[detachEvent]('onunload', cleanup)
        win.CollectGarbage && win.CollectGarbage()
      }
      win[attachEvent]('onunload', cleanup)
    }
  
    return bean
  })
  

  provide("bean", module.exports);

  !function ($) {
    var b = require('bean')
      , integrate = function (method, type, method2) {
          var _args = type ? [type] : []
          return function () {
            for (var args, i = 0, l = this.length; i < l; i++) {
              args = [this[i]].concat(_args, Array.prototype.slice.call(arguments, 0))
              args.length == 4 && args.push($)
              !arguments.length && method == 'add' && type && (method = 'fire')
              b[method].apply(this, args)
            }
            return this
          }
        }
      , add = integrate('add')
      , remove = integrate('remove')
      , fire = integrate('fire')
  
      , methods = {
            on: add
          , addListener: add
          , bind: add
          , listen: add
          , delegate: add
  
          , one: integrate('one')
  
          , off: remove
          , unbind: remove
          , unlisten: remove
          , removeListener: remove
          , undelegate: remove
  
          , emit: fire
          , trigger: fire
  
          , cloneEvents: integrate('clone')
  
          , hover: function (enter, leave, i) { // i for internal
              for (i = this.length; i--;) {
                b.add.call(this, this[i], 'mouseenter', enter)
                b.add.call(this, this[i], 'mouseleave', leave)
              }
              return this
            }
        }
  
      , shortcuts = [
            'blur', 'change', 'click', 'dblclick', 'error', 'focus', 'focusin'
          , 'focusout', 'keydown', 'keypress', 'keyup', 'load', 'mousedown'
          , 'mouseenter', 'mouseleave', 'mouseout', 'mouseover', 'mouseup', 'mousemove'
          , 'resize', 'scroll', 'select', 'submit', 'unload'
        ]
  
    for (var i = shortcuts.length; i--;) {
      methods[shortcuts[i]] = integrate('add', shortcuts[i])
    }
  
    $.ender(methods, true)
  }(ender)
  

}();

!function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Reqwest! A general purpose XHR connection manager
    * (c) Dustin Diaz 2011
    * https://github.com/ded/reqwest
    * license MIT
    */
  !function (name, definition) {
    if (typeof define == 'function') define(definition)
    else if (typeof module != 'undefined') module.exports = definition()
    else this[name] = definition()
  }('reqwest', function () {
  
    var context = this
      , win = window
      , doc = document
      , old = context.reqwest
      , twoHundo = /^20\d$/
      , byTag = 'getElementsByTagName'
      , readyState = 'readyState'
      , contentType = 'Content-Type'
      , requestedWith = 'X-Requested-With'
      , head = doc[byTag]('head')[0]
      , uniqid = 0
      , lastValue // data stored by the most recent JSONP callback
      , xmlHttpRequest = 'XMLHttpRequest'
      , defaultHeaders = {
            contentType: 'application/x-www-form-urlencoded'
          , accept: {
                '*':  'text/javascript, text/html, application/xml, text/xml, */*'
              , xml:  'application/xml, text/xml'
              , html: 'text/html'
              , text: 'text/plain'
              , json: 'application/json, text/javascript'
              , js:   'application/javascript, text/javascript'
            }
          , requestedWith: xmlHttpRequest
        }
      , xhr = (xmlHttpRequest in win) ?
          function () {
            return new XMLHttpRequest()
          } :
          function () {
            return new ActiveXObject('Microsoft.XMLHTTP')
          }
  
    function handleReadyState(o, success, error) {
      return function () {
        if (o && o[readyState] == 4) {
          if (twoHundo.test(o.status)) {
            success(o)
          } else {
            error(o)
          }
        }
      }
    }
  
    function setHeaders(http, o) {
      var headers = o.headers || {}
      headers.Accept = headers.Accept || defaultHeaders.accept[o.type] || defaultHeaders.accept['*']
      // breaks cross-origin requests with legacy browsers
      if (!o.crossOrigin && !headers[requestedWith]) headers[requestedWith] = defaultHeaders.requestedWith
      if (!headers[contentType]) headers[contentType] = o.contentType || defaultHeaders.contentType
      for (var h in headers) {
        headers.hasOwnProperty(h) && http.setRequestHeader(h, headers[h])
      }
    }
  
    function generalCallback(data) {
      lastValue = data
    }
  
    function urlappend(url, s) {
      return url + (/\?/.test(url) ? '&' : '?') + s
    }
  
    function handleJsonp(o, fn, err, url) {
      var reqId = uniqid++
        , cbkey = o.jsonpCallback || 'callback' // the 'callback' key
        , cbval = o.jsonpCallbackName || ('reqwest_' + reqId) // the 'callback' value
        , cbreg = new RegExp('(' + cbkey + ')=(.+)(&|$)')
        , match = url.match(cbreg)
        , script = doc.createElement('script')
        , loaded = 0
  
      if (match) {
        if (match[2] === '?') {
          url = url.replace(cbreg, '$1=' + cbval + '$3') // wildcard callback func name
        } else {
          cbval = match[2] // provided callback func name
        }
      } else {
        url = urlappend(url, cbkey + '=' + cbval) // no callback details, add 'em
      }
  
      win[cbval] = generalCallback
  
      script.type = 'text/javascript'
      script.src = url
      script.async = true
      if (typeof script.onreadystatechange !== 'undefined') {
          // need this for IE due to out-of-order onreadystatechange(), binding script
          // execution to an event listener gives us control over when the script
          // is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
          script.event = 'onclick'
          script.htmlFor = script.id = '_reqwest_' + reqId
      }
  
      script.onload = script.onreadystatechange = function () {
        if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
          return false
        }
        script.onload = script.onreadystatechange = null
        script.onclick && script.onclick()
        // Call the user callback with the last value stored and clean up values and scripts.
        o.success && o.success(lastValue)
        lastValue = undefined
        head.removeChild(script)
        loaded = 1
      }
  
      // Add the script to the DOM head
      head.appendChild(script)
    }
  
    function getRequest(o, fn, err) {
      var method = (o.method || 'GET').toUpperCase()
        , url = typeof o === 'string' ? o : o.url
        // convert non-string objects to query-string form unless o.processData is false
        , data = (o.processData !== false && o.data && typeof o.data !== 'string')
          ? reqwest.toQueryString(o.data)
          : (o.data || null);
  
      // if we're working on a GET request and we have data then we should append
      // query string to end of URL and not post data
      (o.type == 'jsonp' || method == 'GET')
        && data
        && (url = urlappend(url, data))
        && (data = null)
  
      if (o.type == 'jsonp') return handleJsonp(o, fn, err, url)
  
      var http = xhr()
      http.open(method, url, true)
      setHeaders(http, o)
      http.onreadystatechange = handleReadyState(http, fn, err)
      o.before && o.before(http)
      http.send(data)
      return http
    }
  
    function Reqwest(o, fn) {
      this.o = o
      this.fn = fn
      init.apply(this, arguments)
    }
  
    function setType(url) {
      var m = url.match(/\.(json|jsonp|html|xml)(\?|$)/)
      return m ? m[1] : 'js'
    }
  
    function init(o, fn) {
      this.url = typeof o == 'string' ? o : o.url
      this.timeout = null
      var type = o.type || setType(this.url)
        , self = this
      fn = fn || function () {}
  
      if (o.timeout) {
        this.timeout = setTimeout(function () {
          self.abort()
        }, o.timeout)
      }
  
      function complete(resp) {
        o.timeout && clearTimeout(self.timeout)
        self.timeout = null
        o.complete && o.complete(resp)
      }
  
      function success(resp) {
        var r = resp.responseText
        if (r) {
          switch (type) {
          case 'json':
            try {
              resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')')
            } catch(err) {
              return error(resp, 'Could not parse JSON in response', err)
            }
            break;
          case 'js':
            resp = eval(r)
            break;
          case 'html':
            resp = r
            break;
          }
        }
  
        fn(resp)
        o.success && o.success(resp)
  
        complete(resp)
      }
  
      function error(resp, msg, t) {
        o.error && o.error(resp, msg, t)
        complete(resp)
      }
  
      this.request = getRequest(o, success, error)
    }
  
    Reqwest.prototype = {
      abort: function () {
        this.request.abort()
      }
  
    , retry: function () {
        init.call(this, this.o, this.fn)
      }
    }
  
    function reqwest(o, fn) {
      return new Reqwest(o, fn)
    }
  
    // normalize newline variants according to spec -> CRLF
    function normalize(s) {
      return s ? s.replace(/\r?\n/g, '\r\n') : ''
    }
  
    var isArray = typeof Array.isArray == 'function' ? Array.isArray : function(a) {
      return a instanceof Array
    }
  
    function serial(el, cb) {
      var n = el.name
        , t = el.tagName.toLowerCase()
        , optCb = function(o) {
            // IE gives value="" even where there is no value attribute
            // 'specified' ref: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-862529273
            if (o && !o.disabled)
              cb(n, normalize(o.attributes.value && o.attributes.value.specified ? o.value : o.text))
          }
  
      // don't serialize elements that are disabled or without a name
      if (el.disabled || !n) return;
  
      switch (t) {
      case 'input':
        if (!/reset|button|image|file/i.test(el.type)) {
          var ch = /checkbox/i.test(el.type)
            , ra = /radio/i.test(el.type)
            , val = el.value;
          // WebKit gives us "" instead of "on" if a checkbox has no value, so correct it here
          (!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val))
        }
        break;
      case 'textarea':
        cb(n, normalize(el.value))
        break;
      case 'select':
        if (el.type.toLowerCase() === 'select-one') {
          optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null)
        } else {
          for (var i = 0; el.length && i < el.length; i++) {
            el.options[i].selected && optCb(el.options[i])
          }
        }
        break;
      }
    }
  
    // collect up all form elements found from the passed argument elements all
    // the way down to child elements; pass a '<form>' or form fields.
    // called with 'this'=callback to use for serial() on each element
    function eachFormElement() {
      var cb = this
        , e, i, j
        , serializeSubtags = function(e, tags) {
          for (var i = 0; i < tags.length; i++) {
            var fa = e[byTag](tags[i])
            for (j = 0; j < fa.length; j++) serial(fa[j], cb)
          }
        }
  
      for (i = 0; i < arguments.length; i++) {
        e = arguments[i]
        if (/input|select|textarea/i.test(e.tagName)) serial(e, cb)
        serializeSubtags(e, [ 'input', 'select', 'textarea' ])
      }
    }
  
    // standard query string style serialization
    function serializeQueryString() {
      return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments))
    }
  
    // { 'name': 'value', ... } style serialization
    function serializeHash() {
      var hash = {}
      eachFormElement.apply(function (name, value) {
        if (name in hash) {
          hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]])
          hash[name].push(value)
        } else hash[name] = value
      }, arguments)
      return hash
    }
  
    // [ { name: 'name', value: 'value' }, ... ] style serialization
    reqwest.serializeArray = function () {
      var arr = []
      eachFormElement.apply(function(name, value) {
        arr.push({name: name, value: value})
      }, arguments)
      return arr
    }
  
    reqwest.serialize = function () {
      if (arguments.length === 0) return ''
      var opt, fn
        , args = Array.prototype.slice.call(arguments, 0)
  
      opt = args.pop()
      opt && opt.nodeType && args.push(opt) && (opt = null)
      opt && (opt = opt.type)
  
      if (opt == 'map') fn = serializeHash
      else if (opt == 'array') fn = reqwest.serializeArray
      else fn = serializeQueryString
  
      return fn.apply(null, args)
    }
  
    reqwest.toQueryString = function (o) {
      var qs = '', i
        , enc = encodeURIComponent
        , push = function (k, v) {
            qs += enc(k) + '=' + enc(v) + '&'
          }
  
      if (isArray(o)) {
        for (i = 0; o && i < o.length; i++) push(o[i].name, o[i].value)
      } else {
        for (var k in o) {
          if (!Object.hasOwnProperty.call(o, k)) continue;
          var v = o[k]
          if (isArray(v)) {
            for (i = 0; i < v.length; i++) push(k, v[i])
          } else push(k, o[k])
        }
      }
  
      // spaces should be + according to spec
      return qs.replace(/&$/, '').replace(/%20/g,'+')
    }
  
    // jQuery and Zepto compatibility, differences can be remapped here so you can call
    // .ajax.compat(options, callback)
    reqwest.compat = function (o, fn) {
      if (o) {
        o.type && (o.method = o.type) && delete o.type
        o.dataType && (o.type = o.dataType)
        o.jsonpCallback && (o.jsonpCallbackName = o.jsonpCallback) && delete o.jsonpCallback
        o.jsonp && (o.jsonpCallback = o.jsonp)
      }
      return new Reqwest(o, fn)
    }
  
    reqwest.noConflict = function () {
      context.reqwest = old
      return this
    }
  
    return reqwest
  })
  

  provide("reqwest", module.exports);

  !function ($) {
    var r = require('reqwest')
      , integrate = function(method) {
        return function() {
          var args = (this && this.length > 0 ? this : []).concat(Array.prototype.slice.call(arguments, 0))
          return r[method].apply(null, args)
        }
      }
      , s = integrate('serialize')
      , sa = integrate('serializeArray')
  
    $.ender({
        ajax: r
      , serialize: s
      , serializeArray: sa
      , toQueryString: r.toQueryString
    })
  
    $.ender({
        serialize: s
      , serializeArray: sa
    }, true)
  }(ender);
  

}();

!function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Bonzo: DOM Utility (c) Dustin Diaz 2011
    * https://github.com/ded/bonzo
    * License MIT
    */
  !function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition()
    else if (typeof define == 'function' && define.amd) define(name, definition)
    else this[name] = definition()
  }('bonzo', function() {
    var context = this
      , win = window
      , doc = win.document
      , html = doc.documentElement
      , parentNode = 'parentNode'
      , query = null
      , specialAttributes = /^checked|value|selected$/
      , specialTags = /select|fieldset|table|tbody|tfoot|td|tr|colgroup/i
      , table = [ '<table>', '</table>', 1 ]
      , td = [ '<table><tbody><tr>', '</tr></tbody></table>', 3 ]
      , option = [ '<select>', '</select>', 1 ]
      , tagMap = {
          thead: table, tbody: table, tfoot: table, colgroup: table, caption: table
          , tr: [ '<table><tbody>', '</tbody></table>', 2 ]
          , th: td , td: td
          , col: [ '<table><colgroup>', '</colgroup></table>', 2 ]
          , fieldset: [ '<form>', '</form>', 1 ]
          , legend: [ '<form><fieldset>', '</fieldset></form>', 2 ]
          , option: option
          , optgroup: option }
      , stateAttributes = /^checked|selected$/
      , ie = /msie/i.test(navigator.userAgent)
      , hasClass, addClass, removeClass
      , uidMap = {}
      , uuids = 0
      , digit = /^-?[\d\.]+$/
      , dattr = /^data-(.+)$/
      , px = 'px'
      , setAttribute = 'setAttribute'
      , getAttribute = 'getAttribute'
      , byTag = 'getElementsByTagName'
      , features = function() {
          var e = doc.createElement('p')
          e.innerHTML = '<a href="#x">x</a><table style="float:left;"></table>'
          return {
            hrefExtended: e[byTag]('a')[0][getAttribute]('href') != '#x' // IE < 8
          , autoTbody: e[byTag]('tbody').length !== 0 // IE < 8
          , computedStyle: doc.defaultView && doc.defaultView.getComputedStyle
          , cssFloat: e[byTag]('table')[0].style.styleFloat ? 'styleFloat' : 'cssFloat'
          , transform: function () {
              var props = ['webkitTransform', 'MozTransform', 'OTransform', 'msTransform', 'Transform'], i
              for (i = 0; i < props.length; i++) {
                if (props[i] in e.style) return props[i]
              }
            }()
          , classList: 'classList' in e
          }
        }()
      , trimReplace = /(^\s*|\s*$)/g
      , unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1 }
      , trim = String.prototype.trim ?
          function (s) {
            return s.trim()
          } :
          function (s) {
            return s.replace(trimReplace, '')
          }
  
    function classReg(c) {
      return new RegExp("(^|\\s+)" + c + "(\\s+|$)")
    }
  
    function each(ar, fn, scope) {
      for (var i = 0, l = ar.length; i < l; i++) fn.call(scope || ar[i], ar[i], i, ar)
      return ar
    }
  
    function deepEach(ar, fn, scope) {
      for (var i = 0, l = ar.length; i < l; i++) {
        if (isNode(ar[i])) {
          deepEach(ar[i].childNodes, fn, scope)
          fn.call(scope || ar[i], ar[i], i, ar)
        }
      }
      return ar
    }
  
    function camelize(s) {
      return s.replace(/-(.)/g, function (m, m1) {
        return m1.toUpperCase()
      })
    }
  
    function decamelize(s) {
      return s ? s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : s
    }
  
    function data(el) {
      el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids)
      uid = el[getAttribute]('data-node-uid')
      return uidMap[uid] || (uidMap[uid] = {})
    }
  
    function clearData(el) {
      uid = el[getAttribute]('data-node-uid')
      uid && (delete uidMap[uid])
    }
  
    function dataValue(d) {
      try {
        return d === 'true' ? true : d === 'false' ? false : d === 'null' ? null : !isNaN(d) ? parseFloat(d) : d;
      } catch(e) {}
      return undefined
    }
  
    function isNode(node) {
      return node && node.nodeName && node.nodeType == 1
    }
  
    function some(ar, fn, scope, i) {
      for (i = 0, j = ar.length; i < j; ++i) if (fn.call(scope, ar[i], i, ar)) return true
      return false
    }
  
    function styleProperty(p) {
        (p == 'transform' && (p = features.transform)) ||
          (/^transform-?[Oo]rigin$/.test(p) && (p = features.transform + "Origin")) ||
          (p == 'float' && (p = features.cssFloat))
        return p ? camelize(p) : null
    }
  
    var getStyle = features.computedStyle ?
      function (el, property) {
        var value = null
          , computed = doc.defaultView.getComputedStyle(el, '')
        computed && (value = computed[property])
        return el.style[property] || value
      } :
  
      (ie && html.currentStyle) ?
  
      function (el, property) {
        if (property == 'opacity') {
          var val = 100
          try {
            val = el.filters['DXImageTransform.Microsoft.Alpha'].opacity
          } catch (e1) {
            try {
              val = el.filters('alpha').opacity
            } catch (e2) {}
          }
          return val / 100
        }
        var value = el.currentStyle ? el.currentStyle[property] : null
        return el.style[property] || value
      } :
  
      function (el, property) {
        return el.style[property]
      }
  
    // this insert method is intense
    function insert(target, host, fn) {
      var i = 0, self = host || this, r = []
        // target nodes could be a css selector if it's a string and a selector engine is present
        // otherwise, just use target
        , nodes = query && typeof target == 'string' && target.charAt(0) != '<' ? query(target) : target
      // normalize each node in case it's still a string and we need to create nodes on the fly
      each(normalize(nodes), function (t) {
        each(self, function (el) {
          var n = !el[parentNode] || (el[parentNode] && !el[parentNode][parentNode]) ?
            function () {
              var c = el.cloneNode(true)
              // check for existence of an event cloner
              // preferably https://github.com/fat/bean
              // otherwise Bonzo won't do this for you
              self.$ && self.cloneEvents && self.$(c).cloneEvents(el)
              return c
            }() : el
          fn(t, n)
          r[i] = n
          i++
        })
      }, this)
      each(r, function (e, i) {
        self[i] = e
      })
      self.length = i
      return self
    }
  
    function xy(el, x, y) {
      var $el = bonzo(el)
        , style = $el.css('position')
        , offset = $el.offset()
        , rel = 'relative'
        , isRel = style == rel
        , delta = [parseInt($el.css('left'), 10), parseInt($el.css('top'), 10)]
  
      if (style == 'static') {
        $el.css('position', rel)
        style = rel
      }
  
      isNaN(delta[0]) && (delta[0] = isRel ? 0 : el.offsetLeft)
      isNaN(delta[1]) && (delta[1] = isRel ? 0 : el.offsetTop)
  
      x != null && (el.style.left = x - offset.left + delta[0] + px)
      y != null && (el.style.top = y - offset.top + delta[1] + px)
  
    }
  
    // classList support for class management
    // altho to be fair, the api sucks because it won't accept multiple classes at once,
    // so we have to iterate. bullshit
    if (features.classList) {
      hasClass = function (el, c) {
        return some(c.toString().split(' '), function (c) {
          return el.classList.contains(c)
        })
      }
      addClass = function (el, c) {
        each(c.toString().split(' '), function (c) {
          el.classList.add(c)
        })
      }
      removeClass = function (el, c) { el.classList.remove(c) }
    }
    else {
      hasClass = function (el, c) { return classReg(c).test(el.className) }
      addClass = function (el, c) { el.className = trim(el.className + ' ' + c) }
      removeClass = function (el, c) { el.className = trim(el.className.replace(classReg(c), ' ')) }
    }
  
  
    // this allows method calling for setting values
    // example:
    // bonzo(elements).css('color', function (el) {
    //   return el.getAttribute('data-original-color')
    // })
    function setter(el, v) {
      return typeof v == 'function' ? v(el) : v
    }
  
    function Bonzo(elements) {
      this.length = 0
      if (elements) {
        elements = typeof elements !== 'string' &&
          !elements.nodeType &&
          typeof elements.length !== 'undefined' ?
            elements :
            [elements]
        this.length = elements.length
        for (var i = 0; i < elements.length; i++) {
          this[i] = elements[i]
        }
      }
    }
  
    Bonzo.prototype = {
  
        // indexr method, because jQueriers want this method
        get: function (index) {
          return this[index] || null
        }
  
        // itetators
      , each: function (fn, scope) {
          return each(this, fn, scope)
        }
  
      , deepEach: function (fn, scope) {
          return deepEach(this, fn, scope)
        }
  
      , map: function (fn, reject) {
          var m = [], n, i
          for (i = 0; i < this.length; i++) {
            n = fn.call(this, this[i], i)
            reject ? (reject(n) && m.push(n)) : m.push(n)
          }
          return m
        }
  
      // text and html inserters!
      , html: function (h, text) {
          var method = text ?
            html.textContent === undefined ?
              'innerText' :
              'textContent' :
            'innerHTML', m;
          function append(el) {
            each(normalize(h), function (node) {
              el.appendChild(node)
            })
          }
          return typeof h !== 'undefined' ?
              this.empty().each(function (el) {
                !text && (m = el.tagName.match(specialTags)) ?
                  append(el, m[0]) :
                  !function() {
                    try { (el[method] = h) }
                    catch(e) { append(el) }
                  }();
              }) :
            this[0] ? this[0][method] : ''
        }
  
      , text: function (text) {
          return this.html(text, 1)
        }
  
        // more related insertion methods
      , append: function (node) {
          return this.each(function (el) {
            each(normalize(node), function (i) {
              el.appendChild(i)
            })
          })
        }
  
      , prepend: function (node) {
          return this.each(function (el) {
            var first = el.firstChild
            each(normalize(node), function (i) {
              el.insertBefore(i, first)
            })
          })
        }
  
      , appendTo: function (target, host) {
          return insert.call(this, target, host, function (t, el) {
            t.appendChild(el)
          })
        }
  
      , prependTo: function (target, host) {
          return insert.call(this, target, host, function (t, el) {
            t.insertBefore(el, t.firstChild)
          })
        }
  
      , before: function (node) {
          return this.each(function (el) {
            each(bonzo.create(node), function (i) {
              el[parentNode].insertBefore(i, el)
            })
          })
        }
  
      , after: function (node) {
          return this.each(function (el) {
            each(bonzo.create(node), function (i) {
              el[parentNode].insertBefore(i, el.nextSibling)
            })
          })
        }
  
      , insertBefore: function (target, host) {
          return insert.call(this, target, host, function (t, el) {
            t[parentNode].insertBefore(el, t)
          })
        }
  
      , insertAfter: function (target, host) {
          return insert.call(this, target, host, function (t, el) {
            var sibling = t.nextSibling
            if (sibling) {
              t[parentNode].insertBefore(el, sibling);
            }
            else {
              t[parentNode].appendChild(el)
            }
          })
        }
  
      , replaceWith: function(html) {
          this.deepEach(clearData)
  
          return this.each(function (el) {
            el.parentNode.replaceChild(bonzo.create(html)[0], el)
          })
        }
  
        // class management
      , addClass: function (c) {
          return this.each(function (el) {
            hasClass(el, setter(el, c)) || addClass(el, setter(el, c))
          })
        }
  
      , removeClass: function (c) {
          return this.each(function (el) {
            hasClass(el, setter(el, c)) && removeClass(el, setter(el, c))
          })
        }
  
      , hasClass: function (c) {
          return some(this, function (el) {
            return hasClass(el, c)
          })
        }
  
      , toggleClass: function (c, condition) {
          return this.each(function (el) {
            typeof condition !== 'undefined' ?
              condition ? addClass(el, c) : removeClass(el, c) :
              hasClass(el, c) ? removeClass(el, c) : addClass(el, c)
          })
        }
  
        // display togglers
      , show: function (type) {
          return this.each(function (el) {
            el.style.display = type || ''
          })
        }
  
      , hide: function () {
          return this.each(function (el) {
            el.style.display = 'none'
          })
        }
  
      , toggle: function (callback, type) {
          this.each(function (el) {
            el.style.display = (el.offsetWidth || el.offsetHeight) ? 'none' : type || ''
          })
          callback && callback()
          return this
        }
  
        // DOM Walkers & getters
      , first: function () {
          return bonzo(this.length ? this[0] : [])
        }
  
      , last: function () {
          return bonzo(this.length ? this[this.length - 1] : [])
        }
  
      , next: function () {
          return this.related('nextSibling')
        }
  
      , previous: function () {
          return this.related('previousSibling')
        }
  
      , parent: function() {
        return this.related('parentNode')
      }
  
      , related: function (method) {
          return this.map(
            function (el) {
              el = el[method]
              while (el && el.nodeType !== 1) {
                el = el[method]
              }
              return el || 0
            },
            function (el) {
              return el
            }
          )
        }
  
        // meh. use with care. the ones in Bean are better
      , focus: function () {
          return this.length > 0 ? this[0].focus() : null
        }
  
      , blur: function () {
          return this.each(function (el) {
            el.blur()
          })
        }
  
        // style getter setter & related methods
      , css: function (o, v, p) {
          // is this a request for just getting a style?
          if (v === undefined && typeof o == 'string') {
            // repurpose 'v'
            v = this[0]
            if (!v) {
              return null
            }
            if (v === doc || v === win) {
              p = (v === doc) ? bonzo.doc() : bonzo.viewport()
              return o == 'width' ? p.width : o == 'height' ? p.height : ''
            }
            return (o = styleProperty(o)) ? getStyle(v, o) : null
          }
          var iter = o
          if (typeof o == 'string') {
            iter = {}
            iter[o] = v
          }
  
          if (ie && iter.opacity) {
            // oh this 'ol gamut
            iter.filter = 'alpha(opacity=' + (iter.opacity * 100) + ')'
            // give it layout
            iter.zoom = o.zoom || 1;
            delete iter.opacity;
          }
  
          function fn(el, p, v) {
            for (var k in iter) {
              if (iter.hasOwnProperty(k)) {
                v = iter[k];
                // change "5" to "5px" - unless you're line-height, which is allowed
                (p = styleProperty(k)) && digit.test(v) && !(p in unitless) && (v += px)
                el.style[p] = setter(el, v)
              }
            }
          }
          return this.each(fn)
        }
  
      , offset: function (x, y) {
          if (typeof x == 'number' || typeof y == 'number') {
            return this.each(function (el) {
              xy(el, x, y)
            })
          }
          if (!this[0]) return {
              top: 0
            , left: 0
            , height: 0
            , width: 0
          }
          var el = this[0]
            , width = el.offsetWidth
            , height = el.offsetHeight
            , top = el.offsetTop
            , left = el.offsetLeft
          while (el = el.offsetParent) {
            top = top + el.offsetTop
            left = left + el.offsetLeft
          }
  
          return {
              top: top
            , left: left
            , height: height
            , width: width
          }
        }
  
      , dim: function () {
          var el = this[0]
            , orig = !el.offsetWidth && !el.offsetHeight ?
               // el isn't visible, can't be measured properly, so fix that
               function (t, s) {
                  s = {
                      position: el.style.position || ''
                    , visibility: el.style.visibility || ''
                    , display: el.style.display || ''
                  }
                  t.first().css({
                      position: 'absolute'
                    , visibility: 'hidden'
                    , display: 'block'
                  })
                  return s
                }(this) : null
            , width = el.offsetWidth
            , height = el.offsetHeight
  
          orig && this.first().css(orig)
          return {
              height: height
            , width: width
          }
        }
  
        // attributes are hard. go shopping
      , attr: function (k, v) {
          var el = this[0]
          if (typeof k != 'string' && !(k instanceof String)) {
            for (var n in k) {
              k.hasOwnProperty(n) && this.attr(n, k[n])
            }
            return this
          }
          return typeof v == 'undefined' ?
            specialAttributes.test(k) ?
              stateAttributes.test(k) && typeof el[k] == 'string' ?
                true : el[k] : (k == 'href' || k =='src') && features.hrefExtended ?
                  el[getAttribute](k, 2) : el[getAttribute](k) :
            this.each(function (el) {
              specialAttributes.test(k) ? (el[k] = setter(el, v)) : el[setAttribute](k, setter(el, v))
            })
        }
  
      , removeAttr: function (k) {
          return this.each(function (el) {
            stateAttributes.test(k) ? (el[k] = false) : el.removeAttribute(k)
          })
        }
  
      , val: function (s) {
          return (typeof s == 'string') ? this.attr('value', s) : this[0].value
        }
  
        // use with care and knowledge. this data() method uses data attributes on the DOM nodes
        // to do this differently costs a lot more code. c'est la vie
      , data: function (k, v) {
          var el = this[0], uid, o, m
          if (typeof v === 'undefined') {
            o = data(el)
            if (typeof k === 'undefined') {
              each(el.attributes, function(a) {
                (m = (''+a.name).match(dattr)) && (o[camelize(m[1])] = dataValue(a.value))
              })
              return o
            } else {
              return typeof o[k] === 'undefined' ?
                (o[k] = dataValue(this.attr('data-' + decamelize(k)))) : o[k]
            }
          } else {
            return this.each(function (el) { data(el)[k] = v })
          }
        }
  
        // DOM detachment & related
      , remove: function () {
          this.deepEach(clearData)
  
          return this.each(function (el) {
            el[parentNode] && el[parentNode].removeChild(el)
          })
        }
  
      , empty: function () {
          return this.each(function (el) {
            deepEach(el.childNodes, clearData)
  
            while (el.firstChild) {
              el.removeChild(el.firstChild)
            }
          })
        }
  
      , detach: function () {
          return this.map(function (el) {
            return el[parentNode].removeChild(el)
          })
        }
  
        // who uses a mouse anyway? oh right.
      , scrollTop: function (y) {
          return scroll.call(this, null, y, 'y')
        }
  
      , scrollLeft: function (x) {
          return scroll.call(this, x, null, 'x')
        }
  
    }
  
    function normalize(node) {
      return typeof node == 'string' ? bonzo.create(node) : isNode(node) ? [node] : node // assume [nodes]
    }
  
    function scroll(x, y, type) {
      var el = this[0]
      if (x == null && y == null) {
        return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type]
      }
      if (isBody(el)) {
        win.scrollTo(x, y)
      } else {
        x != null && (el.scrollLeft = x)
        y != null && (el.scrollTop = y)
      }
      return this
    }
  
    function isBody(element) {
      return element === win || (/^(?:body|html)$/i).test(element.tagName)
    }
  
    function getWindowScroll() {
      return { x: win.pageXOffset || html.scrollLeft, y: win.pageYOffset || html.scrollTop }
    }
  
    function bonzo(els, host) {
      return new Bonzo(els, host)
    }
  
    bonzo.setQueryEngine = function (q) {
      query = q;
      delete bonzo.setQueryEngine
    }
  
    bonzo.aug = function (o, target) {
      // for those standalone bonzo users. this love is for you.
      for (var k in o) {
        o.hasOwnProperty(k) && ((target || Bonzo.prototype)[k] = o[k])
      }
    }
  
    bonzo.create = function (node) {
      // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
      return typeof node == 'string' && node !== '' ?
        function () {
          var tag = /^\s*<([^\s>]+)/.exec(node)
            , el = doc.createElement('div')
            , els = []
            , p = tag ? tagMap[tag[1].toLowerCase()] : null
            , dep = p ? p[2] + 1 : 1
            , pn = parentNode
            , tb = features.autoTbody && p && p[0] == '<table>' && !(/<tbody/i).test(node)
  
          el.innerHTML = p ? (p[0] + node + p[1]) : node
          while (dep--) el = el.firstChild
          do {
            // tbody special case for IE<8, creates tbody on any empty table
            // we don't want it if we're just after a <thead>, <caption>, etc.
            if ((!tag || el.nodeType == 1) && (!tb || el.tagName.toLowerCase() != 'tbody')) {
              els.push(el)
            }
          } while (el = el.nextSibling)
          // IE < 9 gives us a parentNode which messes up insert() check for cloning
          // `dep` > 1 can also cause problems with the insert() check (must do this last)
          each(els, function(el) { el[pn] && el[pn].removeChild(el) })
          return els
  
        }() : isNode(node) ? [node.cloneNode(true)] : []
    }
  
    bonzo.doc = function () {
      var vp = bonzo.viewport()
      return {
          width: Math.max(doc.body.scrollWidth, html.scrollWidth, vp.width)
        , height: Math.max(doc.body.scrollHeight, html.scrollHeight, vp.height)
      }
    }
  
    bonzo.firstChild = function (el) {
      for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
        if (c[i].nodeType === 1) e = c[j = i]
      }
      return e
    }
  
    bonzo.viewport = function () {
      return {
          width: ie ? html.clientWidth : self.innerWidth
        , height: ie ? html.clientHeight : self.innerHeight
      }
    }
  
    bonzo.isAncestor = 'compareDocumentPosition' in html ?
      function (container, element) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (container, element) {
        return container !== element && container.contains(element);
      } :
      function (container, element) {
        while (element = element[parentNode]) {
          if (element === container) {
            return true
          }
        }
        return false
      }
  
    return bonzo
  })
  

  provide("bonzo", module.exports);

  !function ($) {
  
    var b = require('bonzo')
    b.setQueryEngine($)
    $.ender(b)
    $.ender(b(), true)
    $.ender({
      create: function (node) {
        return $(b.create(node))
      }
    })
  
    $.id = function (id) {
      return $([document.getElementById(id)])
    }
  
    function indexOf(ar, val) {
      for (var i = 0; i < ar.length; i++) if (ar[i] === val) return i
      return -1
    }
  
    function uniq(ar) {
      var r = [], i = 0, j = 0, k, item, inIt
      for (; item = ar[i]; ++i) {
        inIt = false
        for (k = 0; k < r.length; ++k) {
          if (r[k] === item) {
            inIt = true; break
          }
        }
        if (!inIt) r[j++] = item
      }
      return r
    }
  
    $.ender({
      parents: function (selector, closest) {
        var collection = $(selector), j, k, p, r = []
        for (j = 0, k = this.length; j < k; j++) {
          p = this[j]
          while (p = p.parentNode) {
            if (~indexOf(collection, p)) {
              r.push(p)
              if (closest) break;
            }
          }
        }
        return $(uniq(r))
      }
  
    , parent: function() {
        return $(uniq(b(this).parent()))
      }
  
    , closest: function (selector) {
        return this.parents(selector, true)
      }
  
    , first: function () {
        return $(this.length ? this[0] : this)
      }
  
    , last: function () {
        return $(this.length ? this[this.length - 1] : [])
      }
  
    , next: function () {
        return $(b(this).next())
      }
  
    , previous: function () {
        return $(b(this).previous())
      }
  
    , appendTo: function (t) {
        return b(this.selector).appendTo(t, this)
      }
  
    , prependTo: function (t) {
        return b(this.selector).prependTo(t, this)
      }
  
    , insertAfter: function (t) {
        return b(this.selector).insertAfter(t, this)
      }
  
    , insertBefore: function (t) {
        return b(this.selector).insertBefore(t, this)
      }
  
    , siblings: function () {
        var i, l, p, r = []
        for (i = 0, l = this.length; i < l; i++) {
          p = this[i]
          while (p = p.previousSibling) p.nodeType == 1 && r.push(p)
          p = this[i]
          while (p = p.nextSibling) p.nodeType == 1 && r.push(p)
        }
        return $(r)
      }
  
    , children: function () {
        var i, el, r = []
        for (i = 0, l = this.length; i < l; i++) {
          if (!(el = b.firstChild(this[i]))) continue;
          r.push(el)
          while (el = el.nextSibling) el.nodeType == 1 && r.push(el)
        }
        return $(uniq(r))
      }
  
    , height: function (v) {
        return dimension(v, this, 'height')
      }
  
    , width: function (v) {
        return dimension(v, this, 'width')
      }
    }, true)
  
    function dimension(v, self, which) {
      return v ?
        self.css(which, v) :
        function (r) {
          if (!self[0]) return 0
          r = parseInt(self.css(which), 10);
          return isNaN(r) ? self[0]['offset' + which.replace(/^\w/, function (m) {return m.toUpperCase()})] : r
        }()
    }
  
  }(ender);
  

}();

!function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Qwery - A Blazing Fast query selector engine
    * https://github.com/ded/qwery
    * copyright Dustin Diaz & Jacob Thornton 2011
    * MIT License
    */
  
  !function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition()
    else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
    else this[name] = definition()
  }('qwery', function () {
    var doc = document
      , html = doc.documentElement
      , byClass = 'getElementsByClassName'
      , byTag = 'getElementsByTagName'
      , qSA = 'querySelectorAll'
  
      // OOOOOOOOOOOOH HERE COME THE ESSSXXSSPRESSSIONSSSSSSSS!!!!!
      , id = /#([\w\-]+)/
      , clas = /\.[\w\-]+/g
      , idOnly = /^#([\w\-]+)$/
      , classOnly = /^\.([\w\-]+)$/
      , tagOnly = /^([\w\-]+)$/
      , tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/
      , splittable = /(^|,)\s*[>~+]/
      , normalizr = /^\s+|\s*([,\s\+\~>]|$)\s*/g
      , splitters = /[\s\>\+\~]/
      , splittersMore = /(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\]|[\s\w\+\-]*\))/
      , specialChars = /([.*+?\^=!:${}()|\[\]\/\\])/g
      , simple = /^(\*|[a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/
      , attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/
      , pseudo = /:([\w\-]+)(\(['"]?([\s\w\+\-]+)['"]?\))?/
        // check if we can pass a selector to a non-CSS3 compatible qSA.
        // *not* suitable for validating a selector, it's too lose; it's the users' responsibility to pass valid selectors
        // this regex must be kept in sync with the one in tests.js
      , css2 = /^(([\w\-]*[#\.]?[\w\-]+|\*)?(\[[\w\-]+([\~\|]?=['"][ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+["'])?\])?(\:(link|visited|active|hover))?([\s>+~\.,]|(?:$)))+$/
      , easy = new RegExp(idOnly.source + '|' + tagOnly.source + '|' + classOnly.source)
      , dividers = new RegExp('(' + splitters.source + ')' + splittersMore.source, 'g')
      , tokenizr = new RegExp(splitters.source + splittersMore.source)
      , chunker = new RegExp(simple.source + '(' + attr.source + ')?' + '(' + pseudo.source + ')?')
      , walker = {
          ' ': function (node) {
            return node && node !== html && node.parentNode
          }
        , '>': function (node, contestant) {
            return node && node.parentNode == contestant.parentNode && node.parentNode
          }
        , '~': function (node) {
            return node && node.previousSibling
          }
        , '+': function (node, contestant, p1, p2) {
            if (!node) return false
            return (p1 = previous(node)) && (p2 = previous(contestant)) && p1 == p2 && p1
          }
        }
  
    function cache() {
      this.c = {}
    }
    cache.prototype = {
      g: function (k) {
        return this.c[k] || undefined
      }
    , s: function (k, v, r) {
        v = r ? new RegExp(v) : v
        return (this.c[k] = v)
      }
    }
  
    var classCache = new cache()
      , cleanCache = new cache()
      , attrCache = new cache()
      , tokenCache = new cache()
  
    function classRegex(c) {
      return classCache.g(c) || classCache.s(c, '(^|\\s+)' + c + '(\\s+|$)', 1)
    }
  
    // not quite as fast as inline loops in older browsers so don't use liberally
    function each(a, fn) {
      var i = 0, l = a.length
      for (; i < l; i++) fn.call(null, a[i])
    }
  
    function flatten(ar) {
      for (var r = [], i = 0, l = ar.length; i < l; ++i) arrayLike(ar[i]) ? (r = r.concat(ar[i])) : (r[r.length] = ar[i])
      return r
    }
  
    function arrayify(ar) {
      var i = 0, l = ar.length, r = []
      for (; i < l; i++) r[i] = ar[i]
      return r
    }
  
    function previous(n) {
      while (n = n.previousSibling) if (n.nodeType == 1) break;
      return n
    }
  
    function q(query) {
      return query.match(chunker)
    }
  
    // called using `this` as element and arguments from regex group results.
    // given => div.hello[title="world"]:foo('bar')
    // div.hello[title="world"]:foo('bar'), div, .hello, [title="world"], title, =, world, :foo('bar'), foo, ('bar'), bar]
    function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value, wholePseudo, pseudo, wholePseudoVal, pseudoVal) {
      var i, m, k, o, classes
      if (this.nodeType !== 1) return false
      if (tag && tag !== '*' && this.tagName && this.tagName.toLowerCase() !== tag) return false
      if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) return false
      if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
        for (i = classes.length; i--;) {
          if (!classRegex(classes[i].slice(1)).test(this.className)) return false
        }
      }
      if (pseudo && qwery.pseudos[pseudo] && !qwery.pseudos[pseudo](this, pseudoVal)) {
        return false
      }
      if (wholeAttribute && !value) { // select is just for existance of attrib
        o = this.attributes
        for (k in o) {
          if (Object.prototype.hasOwnProperty.call(o, k) && (o[k].name || k) == attribute) {
            return this
          }
        }
      }
      if (wholeAttribute && !checkAttr(qualifier, getAttr(this, attribute) || '', value)) {
        // select is for attrib equality
        return false
      }
      return this
    }
  
    function clean(s) {
      return cleanCache.g(s) || cleanCache.s(s, s.replace(specialChars, '\\$1'))
    }
  
    function checkAttr(qualify, actual, val) {
      switch (qualify) {
      case '=':
        return actual == val
      case '^=':
        return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, '^' + clean(val), 1))
      case '$=':
        return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, clean(val) + '$', 1))
      case '*=':
        return actual.match(attrCache.g(val) || attrCache.s(val, clean(val), 1))
      case '~=':
        return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, '(?:^|\\s+)' + clean(val) + '(?:\\s+|$)', 1))
      case '|=':
        return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, '^' + clean(val) + '(-|$)', 1))
      }
      return 0
    }
  
    // given a selector, first check for simple cases then collect all base candidate matches and filter
    function _qwery(selector, _root) {
      var r = [], ret = [], i, l, m, token, tag, els, intr, item, root = _root
        , tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
        , dividedTokens = selector.match(dividers)
  
      if (!tokens.length) return r
  
      token = (tokens = tokens.slice(0)).pop() // copy cached tokens, take the last one
      if (tokens.length && (m = tokens[tokens.length - 1].match(idOnly))) root = byId(_root, m[1])
      if (!root) return r
  
      intr = q(token)
      // collect base candidates to filter
      els = root !== _root && root.nodeType !== 9 && dividedTokens && /^[+~]$/.test(dividedTokens[dividedTokens.length - 1]) ?
        function (r) {
          while (root = root.nextSibling) {
            root.nodeType == 1 && (intr[1] ? intr[1] == root.tagName.toLowerCase() : 1) && (r[r.length] = root)
          }
          return r
        }([]) :
        root[byTag](intr[1] || '*')
      // filter elements according to the right-most part of the selector
      for (i = 0, l = els.length; i < l; i++) {
        if (item = interpret.apply(els[i], intr)) r[r.length] = item
      }
      if (!tokens.length) return r
  
      // filter further according to the rest of the selector (the left side)
      each(r, function(e) { if (ancestorMatch(e, tokens, dividedTokens)) ret[ret.length] = e })
      return ret
    }
  
    // compare element to a selector
    function is(el, selector, root) {
      if (isNode(selector)) return el == selector
      if (arrayLike(selector)) return !!~flatten(selector).indexOf(el) // if selector is an array, is el a member?
  
      var selectors = selector.split(','), tokens, dividedTokens
      while (selector = selectors.pop()) {
        tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
        dividedTokens = selector.match(dividers)
        tokens = tokens.slice(0) // copy array
        if (interpret.apply(el, q(tokens.pop())) && (!tokens.length || ancestorMatch(el, tokens, dividedTokens, root))) {
          return true
        }
      }
      return false
    }
  
    // given elements matching the right-most part of a selector, filter out any that don't match the rest
    function ancestorMatch(el, tokens, dividedTokens, root) {
      var cand
      // recursively work backwards through the tokens and up the dom, covering all options
      function crawl(e, i, p) {
        while (p = walker[dividedTokens[i]](p, e)) {
          if (isNode(p) && (interpret.apply(p, q(tokens[i])))) {
            if (i) {
              if (cand = crawl(p, i - 1, p)) return cand
            } else return p
          }
        }
      }
      return (cand = crawl(el, tokens.length - 1, el)) && (!root || isAncestor(cand, root))
    }
  
    function isNode(el, t) {
      return el && typeof el === 'object' && (t = el.nodeType) && (t == 1 || t == 9)
    }
  
    function uniq(ar) {
      var a = [], i, j
      o: for (i = 0; i < ar.length; ++i) {
        for (j = 0; j < a.length; ++j) if (a[j] == ar[i]) continue o
        a[a.length] = ar[i]
      }
      return a
    }
  
    function arrayLike(o) {
      return (typeof o === 'object' && isFinite(o.length))
    }
  
    function normalizeRoot(root) {
      if (!root) return doc
      if (typeof root == 'string') return qwery(root)[0]
      if (!root.nodeType && arrayLike(root)) return root[0]
      return root
    }
  
    function byId(root, id, el) {
      // if doc, query on it, else query the parent doc or if a detached fragment rewrite the query and run on the fragment
      return root.nodeType === 9 ? root.getElementById(id) :
        root.ownerDocument &&
          (((el = root.ownerDocument.getElementById(id)) && isAncestor(el, root) && el) ||
            (!isAncestor(root, root.ownerDocument) && select('[id="' + id + '"]', root)[0]))
    }
  
    function qwery(selector, _root) {
      var m, el, root = normalizeRoot(_root)
  
      // easy, fast cases that we can dispatch with simple DOM calls
      if (!root || !selector) return []
      if (selector === window || isNode(selector)) {
        return !_root || (selector !== window && isNode(root) && isAncestor(selector, root)) ? [selector] : []
      }
      if (selector && arrayLike(selector)) return flatten(selector)
      if (m = selector.match(easy)) {
        if (m[1]) return (el = byId(root, m[1])) ? [el] : []
        if (m[2]) return arrayify(root[byTag](m[2]))
        if (supportsCSS3 && m[3]) return arrayify(root[byClass](m[3]))
      }
  
      return select(selector, root)
    }
  
    // where the root is not document and a relationship selector is first we have to
    // do some awkward adjustments to get it to work, even with qSA
    function collectSelector(root, collector) {
      return function(s) {
        var oid, nid
        if (splittable.test(s)) {
          if (root.nodeType !== 9) {
           // make sure the el has an id, rewrite the query, set root to doc and run it
           if (!(nid = oid = root.getAttribute('id'))) root.setAttribute('id', nid = '__qwerymeupscotty')
           s = '[id="' + nid + '"]' + s // avoid byId and allow us to match context element
           collector(root.parentNode || root, s, true)
           oid || root.removeAttribute('id')
          }
          return;
        }
        s.length && collector(root, s, false)
      }
    }
  
    var isAncestor = 'compareDocumentPosition' in html ?
      function (element, container) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (element, container) {
        container = container.nodeType === 9 || container == window ? html : container
        return container !== element && container.contains(element)
      } :
      function (element, container) {
        while (element = element.parentNode) if (element === container) return 1
        return 0
      }
    , getAttr = function() {
        // detect buggy IE src/href getAttribute() call
        var e = doc.createElement('p')
        return ((e.innerHTML = '<a href="#x">x</a>') && e.firstChild.getAttribute('href') != '#x') ?
          function(e, a) {
            return a === 'class' ? e.className : (a === 'href' || a === 'src') ?
              e.getAttribute(a, 2) : e.getAttribute(a)
          } :
          function(e, a) { return e.getAttribute(a) }
     }()
      // does native qSA support CSS3 level selectors
    , supportsCSS3 = function () {
        if (doc[byClass] && doc.querySelector && doc[qSA]) {
          try {
            var p = doc.createElement('p')
            p.innerHTML = '<a/>'
            return p[qSA](':nth-of-type(1)').length
          } catch (e) { }
        }
        return false
      }()
      // native support for CSS3 selectors
    , selectCSS3 = function (selector, root) {
        var result = [], ss, e
        try {
          if (root.nodeType === 9 || !splittable.test(selector)) {
            // most work is done right here, defer to qSA
            return arrayify(root[qSA](selector))
          }
          // special case where we need the services of `collectSelector()`
          each(ss = selector.split(','), collectSelector(root, function(ctx, s) {
            e = ctx[qSA](s)
            if (e.length == 1) result[result.length] = e.item(0)
            else if (e.length) result = result.concat(arrayify(e))
          }))
          return ss.length > 1 && result.length > 1 ? uniq(result) : result
        } catch(ex) { }
        return selectNonNative(selector, root)
      }
      // native support for CSS2 selectors only
    , selectCSS2qSA = function (selector, root) {
        var i, r, l, ss, result = []
        selector = selector.replace(normalizr, '$1')
        // safe to pass whole selector to qSA
        if (!splittable.test(selector) && css2.test(selector)) return arrayify(root[qSA](selector))
        each(ss = selector.split(','), collectSelector(root, function(ctx, s, rewrite) {
          // use native qSA if selector is compatile, otherwise use _qwery()
          r = css2.test(s) ? ctx[qSA](s) : _qwery(s, ctx)
          for (i = 0, l = r.length; i < l; i++) {
            if (ctx.nodeType === 9 || rewrite || isAncestor(r[i], root)) result[result.length] = r[i]
          }
        }))
        return ss.length > 1 && result.length > 1 ? uniq(result) : result
      }
      // no native selector support
    , selectNonNative = function (selector, root) {
        var result = [], items, m, i, l, r, ss
        selector = selector.replace(normalizr, '$1')
        if (m = selector.match(tagAndOrClass)) {
          r = classRegex(m[2])
          items = root[byTag](m[1] || '*')
          for (i = 0, l = items.length; i < l; i++) {
            if (r.test(items[i].className)) result[result.length] = items[i]
          }
          return result
        }
        // more complex selector, get `_qwery()` to do the work for us
        each(ss = selector.split(','), collectSelector(root, function(ctx, s, rewrite) {
          r = _qwery(s, ctx)
          for (i = 0, l = r.length; i < l; i++) {
            if (ctx.nodeType === 9 || rewrite || isAncestor(r[i], root)) result[result.length] = r[i]
          }
        }))
        return ss.length > 1 && result.length > 1 ? uniq(result) : result
      }
    , select = function () {
        var q = qwery.nonStandardEngine ? selectNonNative : supportsCSS3 ? selectCSS3 : doc[qSA] ? selectCSS2qSA : selectNonNative
        return q.apply(q, arguments)
      }
  
    qwery.uniq = uniq
    qwery.is = is
    qwery.pseudos = {}
    qwery.nonStandardEngine = false
  
    return qwery
  })
  

  provide("qwery", module.exports);

  !function (doc, $) {
    var q = require('qwery')
  
    $.pseudos = q.pseudos
  
    $._select = function (s, r) {
      // detect if sibling module 'bonzo' is available at run-time
      // rather than load-time since technically it's not a dependency and
      // can be loaded in any order
      // hence the lazy function re-definition
      return ($._select = (function(b) {
        try {
          b = require('bonzo')
          return function (s, r) {
            return /^\s*</.test(s) ? b.create(s, r) : q(s, r)
          }
        } catch (e) { }
        return q
      })())(s, r)
    }
  
    $.ender({
      find: function (s) {
        var r = [], i, l, j, k, els
        for (i = 0, l = this.length; i < l; i++) {
          els = q(s, this[i])
          for (j = 0, k = els.length; j < k; j++) r.push(els[j])
        }
        return $(q.uniq(r))
      }
      , and: function (s) {
        var plus = $(s)
        for (var i = this.length, j = 0, l = this.length + plus.length; i < l; i++, j++) {
          this[i] = plus[j]
        }
        return this
      }
      , is: function(s, r) {
        var i, l
        for (i = 0, l = this.length; i < l; i++) {
          if (q.is(this[i], s, r)) {
            return true
          }
        }
        return false
      }
    }, true)
  }(document, ender);
  

}();

!function () {

  var module = { exports: {} }, exports = module.exports;

  !function (name, definition) {
    if (typeof define == 'function') define(definition)
    else if (typeof module != 'undefined') module.exports = definition()
    else this[name] = this['domReady'] = definition()
  }('domready', function (ready) {
  
    var fns = [], fn, f = false
      , doc = document
      , testEl = doc.documentElement
      , hack = testEl.doScroll
      , domContentLoaded = 'DOMContentLoaded'
      , addEventListener = 'addEventListener'
      , onreadystatechange = 'onreadystatechange'
      , loaded = /^loade|c/.test(doc.readyState)
  
    function flush(f) {
      loaded = 1
      while (f = fns.shift()) f()
    }
  
    doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
      doc.removeEventListener(domContentLoaded, fn, f)
      flush()
    }, f)
  
  
    hack && doc.attachEvent(onreadystatechange, (fn = function () {
      if (/^c/.test(doc.readyState)) {
        doc.detachEvent(onreadystatechange, fn)
        flush()
      }
    }))
  
    return (ready = hack ?
      function (fn) {
        self != top ?
          loaded ? fn() : fns.push(fn) :
          function () {
            try {
              testEl.doScroll('left')
            } catch (e) {
              return setTimeout(function() { ready(fn) }, 50)
            }
            fn()
          }()
      } :
      function (fn) {
        loaded ? fn() : fns.push(fn)
      })
  })

  provide("domready", module.exports);

  !function ($) {
    var ready = require('domready')
    $.ender({domReady: ready})
    $.ender({
      ready: function (f) {
        ready(f)
        return this
      }
    }, true)
  }(ender);

}();/*
Syntax highlighting with language autodetection.
http://softwaremaniacs.org/soft/highlight/
*/

var hljs = new function() {

  /* Utility functions */

  function escape(value) {
    return value.replace(/&/gm, '&amp;').replace(/</gm, '&lt;');
  }

  function langRe(language, value, global) {
    return RegExp(
      value,
      'm' + (language.case_insensitive ? 'i' : '') + (global ? 'g' : '')
    );
  }

  function findCode(pre) {
    for (var i = 0; i < pre.childNodes.length; i++) {
      var node = pre.childNodes[i];
      if (node.nodeName == 'CODE')
        return node;
      if (!(node.nodeType == 3 && node.nodeValue.match(/\s+/)))
        break;
    }
  }

  function blockText(block, ignoreNewLines) {
    var result = '';
    for (var i = 0; i < block.childNodes.length; i++)
      if (block.childNodes[i].nodeType == 3) {
        var chunk = block.childNodes[i].nodeValue;
        if (ignoreNewLines)
          chunk = chunk.replace(/\n/g, '');
        result += chunk;
      } else if (block.childNodes[i].nodeName == 'BR')
        result += '\n';
      else
        result += blockText(block.childNodes[i]);
    // Thank you, MSIE...
    if (/MSIE [678]/.test(navigator.userAgent))
      result = result.replace(/\r/g, '\n');
    return result;
  }

  function blockLanguage(block) {
    var classes = block.className.split(/\s+/)
    classes = classes.concat(block.parentNode.className.split(/\s+/));
    for (var i = 0; i < classes.length; i++) {
      var class_ = classes[i].replace(/^language-/, '');
      if (languages[class_] || class_ == 'no-highlight') {
        return class_;
      }
    }
  }

  /* Stream merging */

  function nodeStream(node) {
    var result = [];
    (function (node, offset) {
      for (var i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].nodeType == 3)
          offset += node.childNodes[i].nodeValue.length;
        else if (node.childNodes[i].nodeName == 'BR')
          offset += 1
        else {
          result.push({
            event: 'start',
            offset: offset,
            node: node.childNodes[i]
          });
          offset = arguments.callee(node.childNodes[i], offset)
          result.push({
            event: 'stop',
            offset: offset,
            node: node.childNodes[i]
          });
        }
      }
      return offset;
    })(node, 0);
    return result;
  }

  function mergeStreams(stream1, stream2, value) {
    var processed = 0;
    var result = '';
    var nodeStack = [];

    function selectStream() {
      if (stream1.length && stream2.length) {
        if (stream1[0].offset != stream2[0].offset)
          return (stream1[0].offset < stream2[0].offset) ? stream1 : stream2;
        else {
          /*
          To avoid starting the stream just before it should stop the order is
          ensured that stream1 always starts first and closes last:

          if (event1 == 'start' && event2 == 'start')
            return stream1;
          if (event1 == 'start' && event2 == 'stop')
            return stream2;
          if (event1 == 'stop' && event2 == 'start')
            return stream1;
          if (event1 == 'stop' && event2 == 'stop')
            return stream2;

          ... which is collapsed to:
          */
          return stream2[0].event == 'start' ? stream1 : stream2;
        }
      } else {
        return stream1.length ? stream1 : stream2;
      }
    }

    function open(node) {
      var result = '<' + node.nodeName.toLowerCase();
      for (var i = 0; i < node.attributes.length; i++) {
        var attribute = node.attributes[i];
        result += ' ' + attribute.nodeName.toLowerCase();
        if (attribute.nodeValue != undefined && attribute.nodeValue != false && attribute.nodeValue != null) {
          result += '="' + escape(attribute.nodeValue) + '"';
        }
      }
      return result + '>';
    }

    while (stream1.length || stream2.length) {
      var current = selectStream().splice(0, 1)[0];
      result += escape(value.substr(processed, current.offset - processed));
      processed = current.offset;
      if ( current.event == 'start') {
        result += open(current.node);
        nodeStack.push(current.node);
      } else if (current.event == 'stop') {
        var i = nodeStack.length;
        do {
          i--;
          var node = nodeStack[i];
          result += ('</' + node.nodeName.toLowerCase() + '>');
        } while (node != current.node);
        nodeStack.splice(i, 1);
        while (i < nodeStack.length) {
          result += open(nodeStack[i]);
          i++;
        }
      }
    }
    result += value.substr(processed);
    return result;
  }

  /* Initialization */

  function compileModes() {

    function compileMode(mode, language, is_default) {
      if (mode.compiled)
        return;

      if (!is_default) {
        mode.beginRe = langRe(language, mode.begin ? mode.begin : '\\B|\\b');
        if (!mode.end && !mode.endsWithParent)
          mode.end = '\\B|\\b'
        if (mode.end)
          mode.endRe = langRe(language, mode.end);
      }
      if (mode.illegal)
        mode.illegalRe = langRe(language, mode.illegal);
      if (mode.relevance == undefined)
        mode.relevance = 1;
      if (mode.keywords)
        mode.lexemsRe = langRe(language, mode.lexems || hljs.IDENT_RE, true);
      for (var key in mode.keywords) {
        if (!mode.keywords.hasOwnProperty(key))
          continue;
        if (mode.keywords[key] instanceof Object)
          mode.keywordGroups = mode.keywords;
        else
          mode.keywordGroups = {'keyword': mode.keywords};
        break;
      }
      if (!mode.contains) {
        mode.contains = [];
      }
      // compiled flag is set before compiling submodes to avoid self-recursion
      // (see lisp where quoted_list contains quoted_list)
      mode.compiled = true;
      for (var i = 0; i < mode.contains.length; i++) {
        compileMode(mode.contains[i], language, false);
      }
      if (mode.starts) {
        compileMode(mode.starts, language, false);
      }
    }

    for (var i in languages) {
      if (!languages.hasOwnProperty(i))
        continue;
      compileMode(languages[i].defaultMode, languages[i], true);
    }
  }

  /*
  Core highlighting function. Accepts a language name and a string with the
  code to highlight. Returns an object with the following properties:

  - relevance (int)
  - keyword_count (int)
  - value (an HTML string with highlighting markup)

  */
  function highlight(language_name, value) {
    if (!compileModes.called) {
      compileModes();
      compileModes.called = true;
    }

    function subMode(lexem, mode) {
      for (var i = 0; i < mode.contains.length; i++) {
        if (mode.contains[i].beginRe.test(lexem)) {
          return mode.contains[i];
        }
      }
    }

    function endOfMode(mode_index, lexem) {
      if (modes[mode_index].end && modes[mode_index].endRe.test(lexem))
        return 1;
      if (modes[mode_index].endsWithParent) {
        var level = endOfMode(mode_index - 1, lexem);
        return level ? level + 1 : 0;
      }
      return 0;
    }

    function isIllegal(lexem, mode) {
      return mode.illegalRe && mode.illegalRe.test(lexem);
    }

    function compileTerminators(mode, language) {
      var terminators = [];

      for (var i = 0; i < mode.contains.length; i++) {
        terminators.push(mode.contains[i].begin);
      }

      var index = modes.length - 1;
      do {
        if (modes[index].end) {
          terminators.push(modes[index].end);
        }
        index--;
      } while (modes[index + 1].endsWithParent);

      if (mode.illegal) {
        terminators.push(mode.illegal);
      }

      return langRe(language, '(' + terminators.join('|') + ')', true);
    }

    function eatModeChunk(value, index) {
      var mode = modes[modes.length - 1];
      if (!mode.terminators) {
        mode.terminators = compileTerminators(mode, language);
      }
      mode.terminators.lastIndex = index;
      var match = mode.terminators.exec(value);
      if (match)
        return [value.substr(index, match.index - index), match[0], false];
      else
        return [value.substr(index), '', true];
    }

    function keywordMatch(mode, match) {
      var match_str = language.case_insensitive ? match[0].toLowerCase() : match[0]
      for (var className in mode.keywordGroups) {
        if (!mode.keywordGroups.hasOwnProperty(className))
          continue;
        var value = mode.keywordGroups[className].hasOwnProperty(match_str);
        if (value)
          return [className, value];
      }
      return false;
    }

    function processKeywords(buffer, mode) {
      if (!mode.keywords)
        return escape(buffer);
      var result = '';
      var last_index = 0;
      mode.lexemsRe.lastIndex = 0;
      var match = mode.lexemsRe.exec(buffer);
      while (match) {
        result += escape(buffer.substr(last_index, match.index - last_index));
        var keyword_match = keywordMatch(mode, match);
        if (keyword_match) {
          keyword_count += keyword_match[1];
          result += '<span class="'+ keyword_match[0] +'">' + escape(match[0]) + '</span>';
        } else {
          result += escape(match[0]);
        }
        last_index = mode.lexemsRe.lastIndex;
        match = mode.lexemsRe.exec(buffer);
      }
      result += escape(buffer.substr(last_index, buffer.length - last_index));
      return result;
    }

    function processBuffer(buffer, mode) {
      if (mode.subLanguage && languages[mode.subLanguage]) {
        var result = highlight(mode.subLanguage, buffer);
        keyword_count += result.keyword_count;
        return result.value;
      } else {
        return processKeywords(buffer, mode);
      }
    }

    function startNewMode(mode, lexem) {
      var markup = mode.className?'<span class="' + mode.className + '">':'';
      if (mode.returnBegin) {
        result += markup;
        mode.buffer = '';
      } else if (mode.excludeBegin) {
        result += escape(lexem) + markup;
        mode.buffer = '';
      } else {
        result += markup;
        mode.buffer = lexem;
      }
      modes.push(mode);
      relevance += mode.relevance;
    }

    function processModeInfo(buffer, lexem, end) {
      var current_mode = modes[modes.length - 1];
      if (end) {
        result += processBuffer(current_mode.buffer + buffer, current_mode);
        return false;
      }

      var new_mode = subMode(lexem, current_mode);
      if (new_mode) {
        result += processBuffer(current_mode.buffer + buffer, current_mode);
        startNewMode(new_mode, lexem);
        return new_mode.returnBegin;
      }

      var end_level = endOfMode(modes.length - 1, lexem);
      if (end_level) {
        var markup = current_mode.className?'</span>':'';
        if (current_mode.returnEnd) {
          result += processBuffer(current_mode.buffer + buffer, current_mode) + markup;
        } else if (current_mode.excludeEnd) {
          result += processBuffer(current_mode.buffer + buffer, current_mode) + markup + escape(lexem);
        } else {
          result += processBuffer(current_mode.buffer + buffer + lexem, current_mode) + markup;
        }
        while (end_level > 1) {
          markup = modes[modes.length - 2].className?'</span>':'';
          result += markup;
          end_level--;
          modes.length--;
        }
        var last_ended_mode = modes[modes.length - 1];
        modes.length--;
        modes[modes.length - 1].buffer = '';
        if (last_ended_mode.starts) {
          startNewMode(last_ended_mode.starts, '');
        }
        return current_mode.returnEnd;
      }

      if (isIllegal(lexem, current_mode))
        throw 'Illegal';
    }

    var language = languages[language_name];
    var modes = [language.defaultMode];
    var relevance = 0;
    var keyword_count = 0;
    var result = '';
    try {
      var index = 0;
      language.defaultMode.buffer = '';
      do {
        var mode_info = eatModeChunk(value, index);
        var return_lexem = processModeInfo(mode_info[0], mode_info[1], mode_info[2]);
        index += mode_info[0].length;
        if (!return_lexem) {
          index += mode_info[1].length;
        }
      } while (!mode_info[2]);
      if(modes.length > 1)
        throw 'Illegal';
      return {
        relevance: relevance,
        keyword_count: keyword_count,
        value: result
      }
    } catch (e) {
      if (e == 'Illegal') {
        return {
          relevance: 0,
          keyword_count: 0,
          value: escape(value)
        }
      } else {
        throw e;
      }
    }
  }

  /*
  Highlighting with language detection. Accepts a string with the code to
  highlight. Returns an object with the following properties:

  - language (detected language)
  - relevance (int)
  - keyword_count (int)
  - value (an HTML string with highlighting markup)
  - second_best (object with the same structure for second-best heuristically
    detected language, may be absent)

  */
  function highlightAuto(text) {
    var result = {
      keyword_count: 0,
      relevance: 0,
      value: escape(text)
    };
    var second_best = result;
    for (var key in languages) {
      if (!languages.hasOwnProperty(key))
        continue;
      var current = highlight(key, text);
      current.language = key;
      if (current.keyword_count + current.relevance > second_best.keyword_count + second_best.relevance) {
        second_best = current;
      }
      if (current.keyword_count + current.relevance > result.keyword_count + result.relevance) {
        second_best = result;
        result = current;
      }
    }
    if (second_best.language) {
      result.second_best = second_best;
    }
    return result;
  }

  /*
  Post-processing of the highlighted markup:

  - replace TABs with something more useful
  - replace real line-breaks with '<br>' for non-pre containers

  */
  function fixMarkup(value, tabReplace, useBR) {
    if (tabReplace) {
      value = value.replace(/^((<[^>]+>|\t)+)/gm, function(match, p1, offset, s) {
        return p1.replace(/\t/g, tabReplace);
      })
    }
    if (useBR) {
      value = value.replace(/\n/g, '<br>');
    }
    return value;
  }

  /*
  Applies highlighting to a DOM node containing code. Accepts a DOM node and
  two optional parameters for fixMarkup.
  */
  function highlightBlock(block, tabReplace, useBR) {
    var text = blockText(block, useBR);
    var language = blockLanguage(block);
    if (language == 'no-highlight')
        return;
    if (language) {
      var result = highlight(language, text);
    } else {
      var result = highlightAuto(text);
      language = result.language;
    }
    var original = nodeStream(block);
    if (original.length) {
      var pre = document.createElement('pre');
      pre.innerHTML = result.value;
      result.value = mergeStreams(original, nodeStream(pre), text);
    }
    result.value = fixMarkup(result.value, tabReplace, useBR);

    var class_name = block.className;
    if (!class_name.match('(\\s|^)(language-)?' + language + '(\\s|$)')) {
      class_name = class_name ? (class_name + ' ' + language) : language;
    }
    if (/MSIE [678]/.test(navigator.userAgent) && block.tagName == 'CODE' && block.parentNode.tagName == 'PRE') {
      // This is for backwards compatibility only. IE needs this strange
      // hack becasue it cannot just cleanly replace <code> block contents.
      var pre = block.parentNode;
      var container = document.createElement('div');
      container.innerHTML = '<pre><code>' + result.value + '</code></pre>';
      block = container.firstChild.firstChild;
      container.firstChild.className = pre.className;
      pre.parentNode.replaceChild(container.firstChild, pre);
    } else {
      block.innerHTML = result.value;
    }
    block.className = class_name;
    block.result = {
      language: language,
      kw: result.keyword_count,
      re: result.relevance
    };
    if (result.second_best) {
      block.second_best = {
        language: result.second_best.language,
        kw: result.second_best.keyword_count,
        re: result.second_best.relevance
      };
    }
  }

  /*
  Applies highlighting to all <pre><code>..</code></pre> blocks on a page.
  */
  function initHighlighting() {
    if (initHighlighting.called)
      return;
    initHighlighting.called = true;
    var pres = document.getElementsByTagName('pre');
    for (var i = 0; i < pres.length; i++) {
      var code = findCode(pres[i]);
      if (code)
        highlightBlock(code, hljs.tabReplace);
    }
  }

  /*
  Attaches highlighting to the page load event.
  */
  function initHighlightingOnLoad() {
    if (window.addEventListener) {
      window.addEventListener('DOMContentLoaded', initHighlighting, false);
      window.addEventListener('load', initHighlighting, false);
    } else if (window.attachEvent)
      window.attachEvent('onload', initHighlighting);
    else
      window.onload = initHighlighting;
  }

  var languages = {}; // a shortcut to avoid writing "this." everywhere

  /* Interface definition */

  this.LANGUAGES = languages;
  this.highlight = highlight;
  this.highlightAuto = highlightAuto;
  this.fixMarkup = fixMarkup;
  this.highlightBlock = highlightBlock;
  this.initHighlighting = initHighlighting;
  this.initHighlightingOnLoad = initHighlightingOnLoad;

  // Common regexps
  this.IDENT_RE = '[a-zA-Z][a-zA-Z0-9_]*';
  this.UNDERSCORE_IDENT_RE = '[a-zA-Z_][a-zA-Z0-9_]*';
  this.NUMBER_RE = '\\b\\d+(\\.\\d+)?';
  this.C_NUMBER_RE = '\\b(0x[A-Za-z0-9]+|\\d+(\\.\\d+)?)';
  this.RE_STARTERS_RE = '!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|\\.|-|-=|/|/=|:|;|<|<<|<<=|<=|=|==|===|>|>=|>>|>>=|>>>|>>>=|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~';

  // Common modes
  this.BACKSLASH_ESCAPE = {
    begin: '\\\\.', relevance: 0
  };
  this.APOS_STRING_MODE = {
    className: 'string',
    begin: '\'', end: '\'',
    illegal: '\\n',
    contains: [this.BACKSLASH_ESCAPE],
    relevance: 0
  };
  this.QUOTE_STRING_MODE = {
    className: 'string',
    begin: '"', end: '"',
    illegal: '\\n',
    contains: [this.BACKSLASH_ESCAPE],
    relevance: 0
  };
  this.C_LINE_COMMENT_MODE = {
    className: 'comment',
    begin: '//', end: '$'
  };
  this.C_BLOCK_COMMENT_MODE = {
    className: 'comment',
    begin: '/\\*', end: '\\*/'
  };
  this.HASH_COMMENT_MODE = {
    className: 'comment',
    begin: '#', end: '$'
  };
  this.NUMBER_MODE = {
    className: 'number',
    begin: this.NUMBER_RE,
    relevance: 0
  };
  this.C_NUMBER_MODE = {
    className: 'number',
    begin: this.C_NUMBER_RE,
    relevance: 0
  };

  // Utility functions
  this.inherit = function(parent, obj) {
    var result = {}
    for (var key in parent)
      result[key] = parent[key];
    if (obj)
      for (var key in obj)
        result[key] = obj[key];
    return result;
  }
}();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hljs;
}/*
Language: HTML, XML
*/

hljs.LANGUAGES.xml = function(){
  var XML_IDENT_RE = '[A-Za-z0-9\\._:-]+';
  var TAG_INTERNALS = {
    endsWithParent: true,
    contains: [
      {
        className: 'attribute',
        begin: XML_IDENT_RE,
        relevance: 0
      },
      {
        begin: '="', returnBegin: true, end: '"',
        contains: [{
            className: 'value',
            begin: '"', endsWithParent: true
        }]
      },
      {
        begin: '=\'', returnBegin: true, end: '\'',
        contains: [{
          className: 'value',
          begin: '\'', endsWithParent: true
        }]
      },
      {
        begin: '=',
        contains: [{
          className: 'value',
          begin: '[^\\s/>]+'
        }]
      }
    ]
  };
  return {
    case_insensitive: true,
    defaultMode: {
      contains: [
        {
          className: 'pi',
          begin: '<\\?', end: '\\?>',
          relevance: 10
        },
        {
          className: 'doctype',
          begin: '<!DOCTYPE', end: '>',
          relevance: 10,
          contains: [{begin: '\\[', end: '\\]'}]
        },
        {
          className: 'comment',
          begin: '<!--', end: '-->',
          relevance: 10
        },
        {
          className: 'cdata',
          begin: '<\\!\\[CDATA\\[', end: '\\]\\]>',
          relevance: 10
        },
        {
          className: 'tag',
          begin: '<style', end: '>',
          keywords: {'title': {'style': 1}},
          contains: [TAG_INTERNALS],
          starts: {
            className: 'css',
            end: '</style>', returnEnd: true,
            subLanguage: 'css'
          }
        },
        {
          className: 'tag',
          begin: '<script', end: '>',
          keywords: {'title': {'script': 1}},
          contains: [TAG_INTERNALS],
          starts: {
            className: 'javascript',
            end: '</script>', returnEnd: true,
            subLanguage: 'javascript'
          }
        },
        {
          className: 'vbscript',
          begin: '<%', end: '%>',
          subLanguage: 'vbscript'
        },
        {
          className: 'tag',
          begin: '</?', end: '/?>',
          contains: [
            {
              className: 'title', begin: '[^ />]+'
            },
            TAG_INTERNALS
          ]
        }
      ]
    }
  };
}();
/*
Language: Apache
Author: Ruslan Keba <rukeba@gmail.com>
Website: http://rukeba.com/
Description: language definition for Apache configuration files (httpd.conf & .htaccess)
Version: 1.1
Date: 2008-12-27
*/

hljs.LANGUAGES.apache = function(){
  var NUMBER = {className: 'number', begin: '[\\$%]\\d+'};
  var CBRACKET = {
    className: 'cbracket',
    begin: '[\\$%]\\{', end: '\\}'
  };
  CBRACKET.contains = [CBRACKET, NUMBER];
  return {
    case_insensitive: true,
    defaultMode: {
      keywords: {
        'keyword': {
          'acceptfilter': 1,
          'acceptmutex': 1,
          'acceptpathinfo': 1,
          'accessfilename': 1,
          'action': 1,
          'addalt': 1,
          'addaltbyencoding': 1,
          'addaltbytype': 1,
          'addcharset': 1,
          'adddefaultcharset': 1,
          'adddescription': 1,
          'addencoding': 1,
          'addhandler': 1,
          'addicon': 1,
          'addiconbyencoding': 1,
          'addiconbytype': 1,
          'addinputfilter': 1,
          'addlanguage': 1,
          'addmoduleinfo': 1,
          'addoutputfilter': 1,
          'addoutputfilterbytype': 1,
          'addtype': 1,
          'alias': 1,
          'aliasmatch': 1,
          'allow': 1,
          'allowconnect': 1,
          'allowencodedslashes': 1,
          'allowoverride': 1,
          'anonymous': 1,
          'anonymous_logemail': 1,
          'anonymous_mustgiveemail': 1,
          'anonymous_nouserid': 1,
          'anonymous_verifyemail': 1,
          'authbasicauthoritative': 1,
          'authbasicprovider': 1,
          'authdbduserpwquery': 1,
          'authdbduserrealmquery': 1,
          'authdbmgroupfile': 1,
          'authdbmtype': 1,
          'authdbmuserfile': 1,
          'authdefaultauthoritative': 1,
          'authdigestalgorithm': 1,
          'authdigestdomain': 1,
          'authdigestnccheck': 1,
          'authdigestnonceformat': 1,
          'authdigestnoncelifetime': 1,
          'authdigestprovider': 1,
          'authdigestqop': 1,
          'authdigestshmemsize': 1,
          'authgroupfile': 1,
          'authldapbinddn': 1,
          'authldapbindpassword': 1,
          'authldapcharsetconfig': 1,
          'authldapcomparednonserver': 1,
          'authldapdereferencealiases': 1,
          'authldapgroupattribute': 1,
          'authldapgroupattributeisdn': 1,
          'authldapremoteuserattribute': 1,
          'authldapremoteuserisdn': 1,
          'authldapurl': 1,
          'authname': 1,
          'authnprovideralias': 1,
          'authtype': 1,
          'authuserfile': 1,
          'authzdbmauthoritative': 1,
          'authzdbmtype': 1,
          'authzdefaultauthoritative': 1,
          'authzgroupfileauthoritative': 1,
          'authzldapauthoritative': 1,
          'authzownerauthoritative': 1,
          'authzuserauthoritative': 1,
          'balancermember': 1,
          'browsermatch': 1,
          'browsermatchnocase': 1,
          'bufferedlogs': 1,
          'cachedefaultexpire': 1,
          'cachedirlength': 1,
          'cachedirlevels': 1,
          'cachedisable': 1,
          'cacheenable': 1,
          'cachefile': 1,
          'cacheignorecachecontrol': 1,
          'cacheignoreheaders': 1,
          'cacheignorenolastmod': 1,
          'cacheignorequerystring': 1,
          'cachelastmodifiedfactor': 1,
          'cachemaxexpire': 1,
          'cachemaxfilesize': 1,
          'cacheminfilesize': 1,
          'cachenegotiateddocs': 1,
          'cacheroot': 1,
          'cachestorenostore': 1,
          'cachestoreprivate': 1,
          'cgimapextension': 1,
          'charsetdefault': 1,
          'charsetoptions': 1,
          'charsetsourceenc': 1,
          'checkcaseonly': 1,
          'checkspelling': 1,
          'chrootdir': 1,
          'contentdigest': 1,
          'cookiedomain': 1,
          'cookieexpires': 1,
          'cookielog': 1,
          'cookiename': 1,
          'cookiestyle': 1,
          'cookietracking': 1,
          'coredumpdirectory': 1,
          'customlog': 1,
          'dav': 1,
          'davdepthinfinity': 1,
          'davgenericlockdb': 1,
          'davlockdb': 1,
          'davmintimeout': 1,
          'dbdexptime': 1,
          'dbdkeep': 1,
          'dbdmax': 1,
          'dbdmin': 1,
          'dbdparams': 1,
          'dbdpersist': 1,
          'dbdpreparesql': 1,
          'dbdriver': 1,
          'defaulticon': 1,
          'defaultlanguage': 1,
          'defaulttype': 1,
          'deflatebuffersize': 1,
          'deflatecompressionlevel': 1,
          'deflatefilternote': 1,
          'deflatememlevel': 1,
          'deflatewindowsize': 1,
          'deny': 1,
          'directoryindex': 1,
          'directorymatch': 1,
          'directoryslash': 1,
          'documentroot': 1,
          'dumpioinput': 1,
          'dumpiologlevel': 1,
          'dumpiooutput': 1,
          'enableexceptionhook': 1,
          'enablemmap': 1,
          'enablesendfile': 1,
          'errordocument': 1,
          'errorlog': 1,
          'example': 1,
          'expiresactive': 1,
          'expiresbytype': 1,
          'expiresdefault': 1,
          'extendedstatus': 1,
          'extfilterdefine': 1,
          'extfilteroptions': 1,
          'fileetag': 1,
          'filterchain': 1,
          'filterdeclare': 1,
          'filterprotocol': 1,
          'filterprovider': 1,
          'filtertrace': 1,
          'forcelanguagepriority': 1,
          'forcetype': 1,
          'forensiclog': 1,
          'gracefulshutdowntimeout': 1,
          'group': 1,
          'header': 1,
          'headername': 1,
          'hostnamelookups': 1,
          'identitycheck': 1,
          'identitychecktimeout': 1,
          'imapbase': 1,
          'imapdefault': 1,
          'imapmenu': 1,
          'include': 1,
          'indexheadinsert': 1,
          'indexignore': 1,
          'indexoptions': 1,
          'indexorderdefault': 1,
          'indexstylesheet': 1,
          'isapiappendlogtoerrors': 1,
          'isapiappendlogtoquery': 1,
          'isapicachefile': 1,
          'isapifakeasync': 1,
          'isapilognotsupported': 1,
          'isapireadaheadbuffer': 1,
          'keepalive': 1,
          'keepalivetimeout': 1,
          'languagepriority': 1,
          'ldapcacheentries': 1,
          'ldapcachettl': 1,
          'ldapconnectiontimeout': 1,
          'ldapopcacheentries': 1,
          'ldapopcachettl': 1,
          'ldapsharedcachefile': 1,
          'ldapsharedcachesize': 1,
          'ldaptrustedclientcert': 1,
          'ldaptrustedglobalcert': 1,
          'ldaptrustedmode': 1,
          'ldapverifyservercert': 1,
          'limitinternalrecursion': 1,
          'limitrequestbody': 1,
          'limitrequestfields': 1,
          'limitrequestfieldsize': 1,
          'limitrequestline': 1,
          'limitxmlrequestbody': 1,
          'listen': 1,
          'listenbacklog': 1,
          'loadfile': 1,
          'loadmodule': 1,
          'lockfile': 1,
          'logformat': 1,
          'loglevel': 1,
          'maxclients': 1,
          'maxkeepaliverequests': 1,
          'maxmemfree': 1,
          'maxrequestsperchild': 1,
          'maxrequestsperthread': 1,
          'maxspareservers': 1,
          'maxsparethreads': 1,
          'maxthreads': 1,
          'mcachemaxobjectcount': 1,
          'mcachemaxobjectsize': 1,
          'mcachemaxstreamingbuffer': 1,
          'mcacheminobjectsize': 1,
          'mcacheremovalalgorithm': 1,
          'mcachesize': 1,
          'metadir': 1,
          'metafiles': 1,
          'metasuffix': 1,
          'mimemagicfile': 1,
          'minspareservers': 1,
          'minsparethreads': 1,
          'mmapfile': 1,
          'mod_gzip_on': 1,
          'mod_gzip_add_header_count': 1,
          'mod_gzip_keep_workfiles': 1,
          'mod_gzip_dechunk': 1,
          'mod_gzip_min_http': 1,
          'mod_gzip_minimum_file_size': 1,
          'mod_gzip_maximum_file_size': 1,
          'mod_gzip_maximum_inmem_size': 1,
          'mod_gzip_temp_dir': 1,
          'mod_gzip_item_include': 1,
          'mod_gzip_item_exclude': 1,
          'mod_gzip_command_version': 1,
          'mod_gzip_can_negotiate': 1,
          'mod_gzip_handle_methods': 1,
          'mod_gzip_static_suffix': 1,
          'mod_gzip_send_vary': 1,
          'mod_gzip_update_static': 1,
          'modmimeusepathinfo': 1,
          'multiviewsmatch': 1,
          'namevirtualhost': 1,
          'noproxy': 1,
          'nwssltrustedcerts': 1,
          'nwsslupgradeable': 1,
          'options': 1,
          'order': 1,
          'passenv': 1,
          'pidfile': 1,
          'protocolecho': 1,
          'proxybadheader': 1,
          'proxyblock': 1,
          'proxydomain': 1,
          'proxyerroroverride': 1,
          'proxyftpdircharset': 1,
          'proxyiobuffersize': 1,
          'proxymaxforwards': 1,
          'proxypass': 1,
          'proxypassinterpolateenv': 1,
          'proxypassmatch': 1,
          'proxypassreverse': 1,
          'proxypassreversecookiedomain': 1,
          'proxypassreversecookiepath': 1,
          'proxypreservehost': 1,
          'proxyreceivebuffersize': 1,
          'proxyremote': 1,
          'proxyremotematch': 1,
          'proxyrequests': 1,
          'proxyset': 1,
          'proxystatus': 1,
          'proxytimeout': 1,
          'proxyvia': 1,
          'readmename': 1,
          'receivebuffersize': 1,
          'redirect': 1,
          'redirectmatch': 1,
          'redirectpermanent': 1,
          'redirecttemp': 1,
          'removecharset': 1,
          'removeencoding': 1,
          'removehandler': 1,
          'removeinputfilter': 1,
          'removelanguage': 1,
          'removeoutputfilter': 1,
          'removetype': 1,
          'requestheader': 1,
          'require': 2,
          'rewritebase': 1,
          'rewritecond': 10,
          'rewriteengine': 1,
          'rewritelock': 1,
          'rewritelog': 1,
          'rewriteloglevel': 1,
          'rewritemap': 1,
          'rewriteoptions': 1,
          'rewriterule': 10,
          'rlimitcpu': 1,
          'rlimitmem': 1,
          'rlimitnproc': 1,
          'satisfy': 1,
          'scoreboardfile': 1,
          'script': 1,
          'scriptalias': 1,
          'scriptaliasmatch': 1,
          'scriptinterpretersource': 1,
          'scriptlog': 1,
          'scriptlogbuffer': 1,
          'scriptloglength': 1,
          'scriptsock': 1,
          'securelisten': 1,
          'seerequesttail': 1,
          'sendbuffersize': 1,
          'serveradmin': 1,
          'serveralias': 1,
          'serverlimit': 1,
          'servername': 1,
          'serverpath': 1,
          'serverroot': 1,
          'serversignature': 1,
          'servertokens': 1,
          'setenv': 1,
          'setenvif': 1,
          'setenvifnocase': 1,
          'sethandler': 1,
          'setinputfilter': 1,
          'setoutputfilter': 1,
          'ssienableaccess': 1,
          'ssiendtag': 1,
          'ssierrormsg': 1,
          'ssistarttag': 1,
          'ssitimeformat': 1,
          'ssiundefinedecho': 1,
          'sslcacertificatefile': 1,
          'sslcacertificatepath': 1,
          'sslcadnrequestfile': 1,
          'sslcadnrequestpath': 1,
          'sslcarevocationfile': 1,
          'sslcarevocationpath': 1,
          'sslcertificatechainfile': 1,
          'sslcertificatefile': 1,
          'sslcertificatekeyfile': 1,
          'sslciphersuite': 1,
          'sslcryptodevice': 1,
          'sslengine': 1,
          'sslhonorciperorder': 1,
          'sslmutex': 1,
          'ssloptions': 1,
          'sslpassphrasedialog': 1,
          'sslprotocol': 1,
          'sslproxycacertificatefile': 1,
          'sslproxycacertificatepath': 1,
          'sslproxycarevocationfile': 1,
          'sslproxycarevocationpath': 1,
          'sslproxyciphersuite': 1,
          'sslproxyengine': 1,
          'sslproxymachinecertificatefile': 1,
          'sslproxymachinecertificatepath': 1,
          'sslproxyprotocol': 1,
          'sslproxyverify': 1,
          'sslproxyverifydepth': 1,
          'sslrandomseed': 1,
          'sslrequire': 1,
          'sslrequiressl': 1,
          'sslsessioncache': 1,
          'sslsessioncachetimeout': 1,
          'sslusername': 1,
          'sslverifyclient': 1,
          'sslverifydepth': 1,
          'startservers': 1,
          'startthreads': 1,
          'substitute': 1,
          'suexecusergroup': 1,
          'threadlimit': 1,
          'threadsperchild': 1,
          'threadstacksize': 1,
          'timeout': 1,
          'traceenable': 1,
          'transferlog': 1,
          'typesconfig': 1,
          'unsetenv': 1,
          'usecanonicalname': 1,
          'usecanonicalphysicalport': 1,
          'user': 1,
          'userdir': 1,
          'virtualdocumentroot': 1,
          'virtualdocumentrootip': 1,
          'virtualscriptalias': 1,
          'virtualscriptaliasip': 1,
          'win32disableacceptex': 1,
          'xbithack': 1
        },
        'literal': {'on': 1, 'off': 1}
      },
      contains: [
        hljs.HASH_COMMENT_MODE,
        {className: 'sqbracket', begin: '\\s\\[', end: '\\]$'},
        CBRACKET,
        NUMBER,
        {className: 'tag', begin: '</?', end: '>'},
        hljs.QUOTE_STRING_MODE
      ]
    }
  };
}();
/*
Language: Bash
Author: vah <vahtenberg@gmail.com>
*/

hljs.LANGUAGES.bash = function(){
  var BASH_LITERAL = {'true' : 1, 'false' : 1};
  var VAR1 = {
    className: 'variable',
    begin: '\\$([a-zA-Z0-9_]+)\\b'
  };
  var VAR2 = {
    className: 'variable',
    begin: '\\$\\{(([^}])|(\\\\}))+\\}',
    contains: [hljs.C_NUMBER_MODE]
  };
  var STRING = {
    className: 'string',
    begin: '"', end: '"',
    illegal: '\\n',
    contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2],
    relevance: 0
  };
  var TEST_CONDITION = {
    className: 'test_condition',
    begin: '', end: '',
    contains: [STRING, VAR1, VAR2, hljs.C_NUMBER_MODE],
    keywords: {
      'literal': BASH_LITERAL
    },
    relevance: 0
  };

  return {
    defaultMode: {
      keywords: {
        'keyword': {'if' : 1, 'then' : 1, 'else' : 1, 'fi' : 1, 'for' : 1, 'break' : 1, 'continue' : 1, 'while' : 1, 'in' : 1, 'do' : 1, 'done' : 1, 'echo' : 1, 'exit' : 1, 'return' : 1, 'set' : 1, 'declare' : 1},
        'literal': BASH_LITERAL
      },
      contains: [
        {
          className: 'shebang',
          begin: '(#!\\/bin\\/bash)|(#!\\/bin\\/sh)',
          relevance: 10
        },
        hljs.HASH_COMMENT_MODE,
        hljs.C_NUMBER_MODE,
        STRING,
        VAR1,
        VAR2,
        hljs.inherit(TEST_CONDITION, {begin: '\\[ ', end: ' \\]', relevance: 0}),
        hljs.inherit(TEST_CONDITION, {begin: '\\[\\[ ', end: ' \\]\\]'})
      ]
    }
  };
}();
/*
Language: CMake
Description: CMake is an open-source cross-platform system for build automation.
Author: Igor Kalnitsky <igor.kalnitsky@gmail.com>
Website: http://kalnitsky.org.ua/
*/

hljs.LANGUAGES.cmake = {
  case_insensitive: true,
  defaultMode: {
    keywords: {
    'add_custom_command': 2, 'add_custom_target': 2, 'add_definitions': 2, 'add_dependencies': 2, 'add_executable': 2, 'add_library': 2, 'add_subdirectory': 2, 'add_executable': 2, 'add_library': 2, 'add_subdirectory': 2, 'add_test': 2, 'aux_source_directory': 2, 'break': 1, 'build_command': 2, 'cmake_minimum_required': 3, 'cmake_policy': 3, 'configure_file': 1, 'create_test_sourcelist': 1, 'define_property': 1, 'else': 1, 'elseif': 1, 'enable_language': 2, 'enable_testing': 2, 'endforeach': 1, 'endfunction': 1, 'endif': 1, 'endmacro': 1, 'endwhile': 1, 'execute_process': 2, 'export': 1, 'find_file': 1, 'find_library': 2, 'find_package': 2, 'find_path': 1, 'find_program': 1, 'fltk_wrap_ui': 2, 'foreach': 1, 'function': 1, 'get_cmake_property': 3, 'get_directory_property': 1, 'get_filename_component': 1, 'get_property': 1, 'get_source_file_property': 1, 'get_target_property': 1, 'get_test_property': 1, 'if': 1, 'include': 1, 'include_directories': 2, 'include_external_msproject': 1, 'include_regular_expression': 2, 'install': 1, 'link_directories': 1, 'load_cache': 1, 'load_command': 1, 'macro': 1, 'mark_as_advanced': 1, 'message': 1, 'option': 1, 'output_required_files': 1, 'project': 1, 'qt_wrap_cpp': 2, 'qt_wrap_ui': 2, 'remove_definitions': 2, 'return': 1, 'separate_arguments': 1, 'set': 1, 'set_directory_properties': 1, 'set_property': 1, 'set_source_files_properties': 1, 'set_target_properties': 1, 'set_tests_properties': 1, 'site_name': 1, 'source_group': 1, 'string': 1, 'target_link_libraries': 2, 'try_compile': 2, 'try_run': 2, 'unset': 1, 'variable_watch': 2, 'while': 1, 'build_name': 1, 'exec_program': 1, 'export_library_dependencies': 1, 'install_files': 1, 'install_programs': 1, 'install_targets': 1, 'link_libraries': 1, 'make_directory': 1, 'remove': 1, 'subdir_depends': 1, 'subdirs': 1, 'use_mangled_mesa': 1, 'utility_source': 1, 'variable_requires': 1, 'write_file': 1 },

    contains: [
      {
        className: 'envvar',
        begin: '\\${', end: '}'
      },
      hljs.HASH_COMMENT_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.NUMBER_MODE
    ]
  }
};
/*
Language: CoffeeScript
Author: Dmytrii Nagirniak (@dnagir)
*/

hljs.LANGUAGES.coffee = function() {
  var keywords = {
    'keyword': {
      // JS keywords
      'in': 1, 'if': 1, 'for': 1, 'while': 1, 'finally': 1,
      'new': 1, 'do': 1, 'return': 1, 'else': 1, 
      'break': 1, 'catch': 1, 'instanceof': 1, 'throw': 1, 
      'try': 1, 'this': 1, 'switch': 1, 'continue': 1, 'typeof': 1, 
      'delete': 1, 'return': 1, 'debugger': 1,
      'class': 1, 'extends': 1, 'super': 1,
      // Coffee
      'then': 1, 'unless': 1, 'until': 1, 'loop': 2, 'of': 2, 'by': 1, 'when': 2,
      'and': 1, 'or': 1, 'is': 1, 'isnt': 2, 'not': 1
    },
    'literal': {
      // JS
      'true': 1, 'false': 1, 'null': 1, 'undefined': 1,
      // Coffee
      'yes': 1, 'no': 1, 'on': 1, 'off': 1
    },
    'reserved': {
      'case': 1, 'default': 1, 'function': 1, 'var': 1, 'void': 1, 'with': 1,
      'const': 1, 'let': 1, 'enum': 1, 'export': 1, 'import': 1, 'native': 1,
      '__hasProp': 1 , '__extends': 1 , '__slice': 1 , '__bind': 1 , '__indexOf': 1
    }
  };

  var String1 = {
    className: 'string',
    begin: "'", end: "'",
    relevance: 0
  };


  var SUBST = {
    className: 'subst',
    begin: '#\\{', end: '}',
    keywords: keywords,
    contains: [hljs.C_NUMBER_MODE ]
  };

  var String2 = {
    className: 'string',
    begin: '"', end: '"',
    relevance: 0,
    contains: [hljs.BACKSLASH_ESCAPE, SUBST]
  };

  var Arrow = {
    className: 'function',
    begin: '(->|=>)', end: hljs.IMMEIDATE_RE,
    relevance: 10
  };
  var FormalArgs = {
    className: 'params',
    begin: "\\(",
    end: '\\)',
    // TODO: Do not use recursive keywords and contains here as it should be on formal args ONLY
    keywords: keywords,
    contains: [hljs.C_NUMBER_MODE, String1, String2]
  };
  var CommentSharpMultiline = {
    className: 'comment',
    begin: '###',
    end: '###',
    relevance: 5
  };
  
  return {
    defaultMode: {
      keywords: keywords,
      contains: [
        CommentSharpMultiline,
        hljs.C_NUMBER_MODE,
        hljs.HASH_COMMENT_MODE,
        String1, String2,
        FormalArgs,
        Arrow
      ]
    }
  };
}();/*
Language: C++
*/

hljs.LANGUAGES.cpp = function(){
  var CPP_KEYWORDS = {
    'keyword': {
      'false': 1, 'int': 1, 'float': 1, 'while': 1, 'private': 1, 'char': 1,
      'catch': 1, 'export': 1, 'virtual': 1, 'operator': 2, 'sizeof': 2,
      'dynamic_cast': 2, 'typedef': 2, 'const_cast': 2, 'const': 1,
      'struct': 1, 'for': 1, 'static_cast': 2, 'union': 1, 'namespace': 1,
      'unsigned': 1, 'long': 1, 'throw': 1, 'volatile': 2, 'static': 1,
      'protected': 1, 'bool': 1, 'template': 1, 'mutable': 1, 'if': 1,
      'public': 1, 'friend': 2, 'do': 1, 'return': 1, 'goto': 1, 'auto': 1,
      'void': 2, 'enum': 1, 'else': 1, 'break': 1, 'new': 1, 'extern': 1,
      'using': 1, 'true': 1, 'class': 1, 'asm': 1, 'case': 1, 'typeid': 1,
      'short': 1, 'reinterpret_cast': 2, 'default': 1, 'double': 1,
      'register': 1, 'explicit': 1, 'signed': 1, 'typename': 1, 'try': 1,
      'this': 1, 'switch': 1, 'continue': 1, 'wchar_t': 1, 'inline': 1,
      'delete': 1, 'alignof': 1, 'char16_t': 1, 'char32_t': 1, 'constexpr': 1,
      'decltype': 1, 'noexcept': 1, 'nullptr': 1, 'static_assert': 1,
      'thread_local': 1
    },
    'built_in': {
      'std': 1, 'string': 1, 'cin': 1, 'cout': 1, 'cerr': 1, 'clog': 1,
      'stringstream': 1, 'istringstream': 1, 'ostringstream': 1, 'auto_ptr': 1,
      'deque': 1, 'list': 1, 'queue': 1, 'stack': 1, 'vector': 1, 'map': 1,
      'set': 1, 'bitset': 1, 'multiset': 1, 'multimap': 1, 'unordered_set': 1,
      'unordered_map': 1, 'unordered_multiset': 1, 'unordered_multimap': 1,
      'array': 1, 'shared_ptr': 1
    }
  };
  var STL_CONTAINER = {
    className: 'stl_container',
    begin: '\\b(deque|list|queue|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array)\\s*<', end: '>',
    keywords: CPP_KEYWORDS,
    relevance: 10
  };
  STL_CONTAINER.contains = [STL_CONTAINER];
  return {
    defaultMode: {
      keywords: CPP_KEYWORDS,
      illegal: '</',
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.QUOTE_STRING_MODE,
        {
          className: 'string',
          begin: '\'', end: '[^\\\\]\'',
          illegal: '[^\\\\][^\']'
        },
        hljs.C_NUMBER_MODE,
        {
          className: 'preprocessor',
          begin: '#', end: '$'
        },
        STL_CONTAINER
      ]
    }
  };
}();
/*
Language: C#
Author: Jason Diamond <jason@diamond.name>
*/

hljs.LANGUAGES.cs  = {
  defaultMode: {
    keywords: {
        // Normal keywords.
        'abstract': 1, 'as': 1, 'base': 1, 'bool': 1, 'break': 1, 'byte': 1, 'case': 1, 'catch': 1, 'char': 1, 'checked': 1, 'class': 1, 'const': 1, 'continue': 1, 'decimal': 1, 'default': 1, 'delegate': 1, 'do': 1, 'do': 1, 'double': 1, 'else': 1, 'enum': 1, 'event': 1, 'explicit': 1, 'extern': 1, 'false': 1, 'finally': 1, 'fixed': 1, 'float': 1, 'for': 1, 'foreach': 1, 'goto': 1, 'if': 1, 'implicit': 1, 'in': 1, 'int': 1, 'interface': 1, 'internal': 1, 'is': 1, 'lock': 1, 'long': 1, 'namespace': 1, 'new': 1, 'null': 1, 'object': 1, 'operator': 1, 'out': 1, 'override': 1, 'params': 1, 'private': 1, 'protected': 1, 'public': 1, 'readonly': 1, 'ref': 1, 'return': 1, 'sbyte': 1, 'sealed': 1, 'short': 1, 'sizeof': 1, 'stackalloc': 1, 'static': 1, 'string': 1, 'struct': 1, 'switch': 1, 'this': 1, 'throw': 1, 'true': 1, 'try': 1, 'typeof': 1, 'uint': 1, 'ulong': 1, 'unchecked': 1, 'unsafe': 1, 'ushort': 1, 'using': 1, 'virtual': 1, 'volatile': 1, 'void': 1, 'while': 1,
        // Contextual keywords.
        'ascending': 1, 'descending': 1, 'from': 1, 'get': 1, 'group': 1, 'into': 1, 'join': 1, 'let': 1, 'orderby': 1, 'partial': 1, 'select': 1, 'set': 1, 'value': 1, 'var': 1, 'where': 1, 'yield': 1
    },
    contains: [
      {
        className: 'comment',
        begin: '///', end: '$', returnBegin: true,
        contains: [
          {
            className: 'xmlDocTag',
            begin: '///|<!--|-->'
          },
          {
            className: 'xmlDocTag',
            begin: '</?', end: '>'
          }
        ]
      },
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: 'string',
        begin: '@"', end: '"',
        contains: [{begin: '""'}]
      },
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.C_NUMBER_MODE
    ]
  }
};
/*
Language: CSS
*/

hljs.LANGUAGES.css = function() {
  var FUNCTION = {
    className: 'function',
    begin: hljs.IDENT_RE + '\\(', end: '\\)',
    contains: [{
        endsWithParent: true, excludeEnd: true,
        contains: [hljs.NUMBER_MODE, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE]
    }]
  };
  return {
    case_insensitive: true,
    defaultMode: {
      illegal: '[=/|\']',
      contains: [
        hljs.C_BLOCK_COMMENT_MODE,
        {
          className: 'id', begin: '\\#[A-Za-z0-9_-]+'
        },
        {
          className: 'class', begin: '\\.[A-Za-z0-9_-]+',
          relevance: 0
        },
        {
          className: 'attr_selector',
          begin: '\\[', end: '\\]',
          illegal: '$'
        },
        {
          className: 'pseudo',
          begin: ':(:)?[a-zA-Z0-9\\_\\-\\+\\(\\)\\"\\\']+'
        },
        {
          className: 'at_rule',
          begin: '@(font-face|page)',
          lexems: '[a-z-]+',
          keywords: {'font-face': 1, 'page': 1}
        },
        {
          className: 'at_rule',
          begin: '@', end: '[{;]', // at_rule eating first "{" is a good thing
                                   // because it doesn't let it to be parsed as
                                   // a rule set but instead drops parser into
                                   // the defaultMode which is how it should be.
          excludeEnd: true,
          keywords: {'import': 1, 'page': 1, 'media': 1, 'charset': 1},
          contains: [
            FUNCTION,
            hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE,
            hljs.NUMBER_MODE
          ]
        },
        {
          className: 'tag', begin: hljs.IDENT_RE,
          relevance: 0
        },
        {
          className: 'rules',
          begin: '{', end: '}',
          illegal: '[^\\s]',
          relevance: 0,
          contains: [
            hljs.C_BLOCK_COMMENT_MODE,
            {
              className: 'rule',
              begin: '[^\\s]', returnBegin: true, end: ';', endsWithParent: true,
              contains: [
                {
                  className: 'attribute',
                  begin: '[A-Z\\_\\.\\-]+', end: ':',
                  excludeEnd: true,
                  illegal: '[^\\s]',
                  starts: {
                    className: 'value',
                    endsWithParent: true, excludeEnd: true,
                    contains: [
                      FUNCTION,
                      hljs.NUMBER_MODE,
                      hljs.QUOTE_STRING_MODE,
                      hljs.APOS_STRING_MODE,
                      hljs.C_BLOCK_COMMENT_MODE,
                      {
                        className: 'hexcolor', begin: '\\#[0-9A-F]+'
                      },
                      {
                        className: 'important', begin: '!important'
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  };
}();
/*
Language: Diff
Description: Unified and context diff
Author: Vasily Polovnyov <vast@whiteants.net>
*/

hljs.LANGUAGES.diff = {
  case_insensitive: true,
  defaultMode: {
    contains: [
      {
        className: 'chunk',
        begin: '^\\@\\@ +\\-\\d+,\\d+ +\\+\\d+,\\d+ +\\@\\@$',
        relevance: 10
      },
      {
        className: 'chunk',
        begin: '^\\*\\*\\* +\\d+,\\d+ +\\*\\*\\*\\*$',
        relevance: 10
      },
      {
        className: 'chunk',
        begin: '^\\-\\-\\- +\\d+,\\d+ +\\-\\-\\-\\-$',
        relevance: 10
      },
      {
        className: 'header',
        begin: 'Index: ', end: '$'
      },
      {
        className: 'header',
        begin: '=====', end: '=====$'
      },
      {
        className: 'header',
        begin: '^\\-\\-\\-', end: '$'
      },
      {
        className: 'header',
        begin: '^\\*{3} ', end: '$'
      },
      {
        className: 'header',
        begin: '^\\+\\+\\+', end: '$'
      },
      {
        className: 'header',
        begin: '\\*{5}', end: '\\*{5}$'
      },
      {
        className: 'addition',
        begin: '^\\+', end: '$'
      },
      {
        className: 'deletion',
        begin: '^\\-', end: '$'
      },
      {
        className: 'change',
        begin: '^\\!', end: '$'
      }
    ]
  }
};
/*
Language: Django
Requires: xml.js
*/

hljs.LANGUAGES.django = function() {

  function allowsDjangoSyntax(mode, parent) {
    return (
      parent == undefined || // defaultMode
      (!mode.className && parent.className == 'tag') || // tag_internal
      mode.className == 'value' // value
    );
  }

  function copy(mode, parent) {
    var result = {};
    for (var key in mode) {
      if (key != 'contains') {
        result[key] = mode[key];
      };
      var contains = [];
      for (var i = 0; mode.contains && i < mode.contains.length; i++) {
        contains.push(copy(mode.contains[i], mode));
      }
      if (allowsDjangoSyntax(mode, parent)) {
        contains = DJANGO_CONTAINS.concat(contains);
      }
      if (contains.length) {
        result.contains = contains;
      }
    }
    return result;
  }

  var FILTER = {
    className: 'filter',
    begin: '\\|[A-Za-z]+\\:?', excludeEnd: true,
    keywords: {'truncatewords': 1, 'removetags': 1, 'linebreaksbr': 1, 'yesno': 1, 'get_digit': 1, 'timesince': 1, 'random': 1, 'striptags': 1, 'filesizeformat': 1, 'escape': 1, 'linebreaks': 1, 'length_is': 1, 'ljust': 1, 'rjust': 1, 'cut': 1, 'urlize': 1, 'fix_ampersands': 1, 'title': 1, 'floatformat': 1, 'capfirst': 1, 'pprint': 1, 'divisibleby': 1, 'add': 1, 'make_list': 1, 'unordered_list': 1, 'urlencode': 1, 'timeuntil': 1, 'urlizetrunc': 1, 'wordcount': 1, 'stringformat': 1, 'linenumbers': 1, 'slice': 1, 'date': 1, 'dictsort': 1, 'dictsortreversed': 1, 'default_if_none': 1, 'pluralize': 1, 'lower': 1, 'join': 1, 'center': 1, 'default': 1, 'truncatewords_html': 1, 'upper': 1, 'length': 1, 'phone2numeric': 1, 'wordwrap': 1, 'time': 1, 'addslashes': 1, 'slugify': 1, 'first': 1},
    contains: [
      {className: 'argument', begin: '"', end: '"'}
    ]
  };

  var DJANGO_CONTAINS = [
    {
      className: 'template_comment',
      begin: '{%\\s*comment\\s*%}', end: '{%\\s*endcomment\\s*%}'
    },
    {
      className: 'template_comment',
      begin: '{#', end: '#}'
    },
    {
      className: 'template_tag',
      begin: '{%', end: '%}',
      keywords: {'comment': 1, 'endcomment': 1, 'load': 1, 'templatetag': 1, 'ifchanged': 1, 'endifchanged': 1, 'if': 1, 'endif': 1, 'firstof': 1, 'for': 1, 'endfor': 1, 'in': 1, 'ifnotequal': 1, 'endifnotequal': 1, 'widthratio': 1, 'extends': 1, 'include': 1, 'spaceless': 1, 'endspaceless': 1, 'regroup': 1, 'by': 1, 'as': 1, 'ifequal': 1, 'endifequal': 1, 'ssi': 1, 'now': 1, 'with': 1, 'cycle': 1, 'url': 1, 'filter': 1, 'endfilter': 1, 'debug': 1, 'block': 1, 'endblock': 1, 'else': 1},
      contains: [FILTER]
    },
    {
      className: 'variable',
      begin: '{{', end: '}}',
      contains: [FILTER]
    }
  ];

  return {
    case_insensitive: true,
    defaultMode: copy(hljs.LANGUAGES.xml.defaultMode)
  };

}();
/*
Language: DOS .bat
Author: Alexander Makarov (http://rmcreative.ru/)
*/

hljs.LANGUAGES.dos = {
  case_insensitive: true,
  defaultMode: {
    keywords: {
      'flow': {'if':1, 'else':1, 'goto':1, 'for':1, 'in':1, 'do':1, 'call':1, 'exit':1, 'not':1, 'exist':1, 'errorlevel':1, 'defined':1, 'equ':1, 'neq':1, 'lss':1, 'leq':1, 'gtr':1, 'geq':1},
      'keyword':{'shift':1, 'cd':1, 'dir':1, 'echo':1, 'setlocal':1, 'endlocal':1, 'set':1, 'pause':1, 'copy':1},
      'stream':{'prn':1, 'nul':1, 'lpt3':1, 'lpt2':1, 'lpt1':1, 'con':1, 'com4':1, 'com3':1, 'com2':1, 'com1':1, 'aux':1},
      'winutils':{'ping':1, 'net':1, 'ipconfig':1, 'taskkill':1, 'xcopy':1, 'ren':1, 'del':1}
    },
    contains: [
      {
        className: 'envvar', begin: '%[^ ]+?%'
      },
      {
        className: 'number', begin: '\\b\\d+',
        relevance: 0
      },
      {
        className: 'comment',
        begin: '@?rem', end: '$'
      }
    ]
  }
};
/*
 Language: Erlang REPL
 Author: Sergey Ignatov <sergey@ignatov.spb.su>
 */

hljs.LANGUAGES.erlang_repl = {
  defaultMode: {
    keywords: {
      'special_functions':{
        'spawn':10,
        'spawn_link':10,
        'self':2
      },
      'reserved':{
        'after':1,
        'and':1,
        'andalso':5,
        'band':1,
        'begin':1,
        'bnot':1,
        'bor':1,
        'bsl':1,
        'bsr':1,
        'bxor':1,
        'case':1,
        'catch':0,
        'cond':1,
        'div':1,
        'end':1,
        'fun':0,
        'if':0,
        'let':1,
        'not':0,
        'of':1,
        'or':1,
        'orelse':5,
        'query':1,
        'receive':0,
        'rem':1,
        'try':0,
        'when':1,
        'xor':1
      }
    },
    contains: [
      {
        className: 'input_number', begin: '^[0-9]+> ',
        relevance: 10
      },
      {
        className: 'comment',
        begin: '%', end: '$'
      },
      hljs.NUMBER_MODE,
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      {
        className: 'constant', begin: '\\?(::)?([A-Z]\\w*(::)?)+'
      },
      {
        className: 'arrow', begin: '->'
      },
      {
        className: 'ok', begin: 'ok'
      },
      {
        className: 'exclamation_mark', begin: '!'
      },
      {
        className: 'function_or_atom',
        begin: '(\\b[a-z\'][a-zA-Z0-9_\']*:[a-z\'][a-zA-Z0-9_\']*)|(\\b[a-z\'][a-zA-Z0-9_\']*)',
        relevance: 0
      },
      {
        className: 'variable',
        begin: '[A-Z][a-zA-Z0-9_\']*',
        relevance: 0
      }
    ]
  }
};
/*
Language: Erlang
Description: Erlang is a general-purpose functional language, with strict evaluation, single assignment, and dynamic typing.
Author: Nikolay Zakharov <nikolay.desh@gmail.com>, Dmitry Kovega <arhibot@gmail.com>
*/

hljs.LANGUAGES.erlang = function(){
  var BASIC_ATOM_RE = '[a-z\'][a-zA-Z0-9_\']*';
  var FUNCTION_NAME_RE = '(' + BASIC_ATOM_RE + ':' + BASIC_ATOM_RE + '|' + BASIC_ATOM_RE + ')';
  var ERLANG_RESERVED = {
    'keyword': {
        'after': 1,
        'and': 1,
        'andalso': 10,
        'band': 1,
        'begin': 1,
        'bnot': 1,
        'bor': 1,
        'bsl': 1,
        'bzr': 1,
        'bxor': 1,
        'case': 1,
        'catch': 1,
        'cond': 1,
        'div': 1,
        'end': 1,
        'fun': 1,
        'let': 1,
        'not': 1,
        'of': 1,
        'orelse': 10,
        'query': 1,
        'receive': 1,
        'rem': 1,
        'try': 1,
        'when': 1,
        'xor': 1
    },
    'literal': {'false': 1, 'true': 1}
  };

  var COMMENT = {
    className: 'comment',
    begin: '%', end: '$',
    relevance: 0
  };
  var NAMED_FUN = {
    begin: 'fun\\s+' + BASIC_ATOM_RE + '/\\d+'
  };
  var FUNCTION_CALL = {
    begin: FUNCTION_NAME_RE + '\\(', end: '\\)',
    returnBegin: true,
    relevance: 0,
    contains: [
      {
        className: 'function_name', begin: FUNCTION_NAME_RE,
        relevance: 0
      },
      {
        begin: '\\(', end: '\\)', endsWithParent: true,
        returnEnd: true,
        relevance: 0
        // "contains" defined later
      }
    ]
  };
  var TUPLE = {
    className: 'tuple',
    begin: '{', end: '}',
    relevance: 0
    // "contains" defined later
  };
  var VAR1 = {
    className: 'variable',
    begin: '\\b_([A-Z][A-Za-z0-9_]*)?',
    relevance: 0
  };
  var VAR2 = {
    className: 'variable',
    begin: '[A-Z][a-zA-Z0-9_]*',
    relevance: 0
  };
  var RECORD_ACCESS = {
    begin: '#', end: '}',
    illegal: '.',
    relevance: 0,
    returnBegin: true,
    contains: [
      {
        className: 'record_name',
        begin: '#' + hljs.UNDERSCORE_IDENT_RE,
        relevance: 0
      },
      {
        begin: '{', endsWithParent: true,
        relevance: 0
        // "contains" defined later
      }
    ]
  };

  var BLOCK_STATEMENTS = {
    keywords: ERLANG_RESERVED,
    begin: '(fun|receive|if|try|case)', end: 'end'
  };
  BLOCK_STATEMENTS.contains = [
    COMMENT,
    NAMED_FUN,
    hljs.inherit(hljs.APOS_STRING_MODE, {className: ''}),
    BLOCK_STATEMENTS,
    FUNCTION_CALL,
    hljs.QUOTE_STRING_MODE,
    hljs.C_NUMBER_MODE,
    TUPLE,
    VAR1, VAR2,
    RECORD_ACCESS
  ];

  var BASIC_MODES = [
    COMMENT,
    NAMED_FUN,
    BLOCK_STATEMENTS,
    FUNCTION_CALL,
    hljs.QUOTE_STRING_MODE,
    hljs.C_NUMBER_MODE,
    TUPLE,
    VAR1, VAR2,
    RECORD_ACCESS
  ];
  FUNCTION_CALL.contains[1].contains = BASIC_MODES;
  TUPLE.contains = BASIC_MODES;
  RECORD_ACCESS.contains[1].contains = BASIC_MODES;

  var PARAMS = {
    className: 'params',
    begin: '\\(', end: '\\)',
    endsWithParent: true,
    contains: BASIC_MODES
  };
  return {
    defaultMode: {
      keywords: ERLANG_RESERVED,
      illegal: '(</|\\*=|\\+=|-=|/=|/\\*|\\*/|\\(\\*|\\*\\))',
      contains: [
        {
          className: 'function',
          begin: '^' + BASIC_ATOM_RE + '\\(', end: ';|\\.',
          returnBegin: true,
          contains: [
            PARAMS,
            {
              className: 'title', begin: BASIC_ATOM_RE
            },
            {
              keywords: ERLANG_RESERVED,
              begin: '->', endsWithParent: true,
              contains: BASIC_MODES
            }
          ]
        },
        COMMENT,
        {
          className: 'pp',
          begin: '^-', end: '\\.',
          relevance: 0,
          excludeEnd: true,
          returnBegin: true,
          lexems: '-' + hljs.IDENT_RE,
          keywords: {
            '-module':1,
            '-record':1,
            '-undef':1,
            '-export':1,
            '-ifdef':1,
            '-ifndef':1,
            '-author':1,
            '-copyright':1,
            '-doc':1,
            '-vsn':1,
            '-import': 1,
            '-include': 1,
            '-include_lib': 1,
            '-compile': 1,
            '-define': 1,
            '-else': 1,
            '-endif': 1,
            '-file': 1,
            '-behaviour': 1,
            '-behavior': 1
          },
          contains: [PARAMS]
        },
        hljs.C_NUMBER_MODE,
        hljs.QUOTE_STRING_MODE,
        RECORD_ACCESS,
        VAR1, VAR2,
        TUPLE
      ]
    }
  };
}();
/*
Language: Go
Author: Stephan Kountso aka StepLg <steplg@gmail.com>
Description: Google go language (golang). For info about language see http://golang.org/
*/

hljs.LANGUAGES.go = function(){
  var GO_KEYWORDS = {
    'keyword': {
       'break' : 1, 'default' : 1, 'func' : 1, 'interface' : 1, 'select' : 1,
       'case' : 1, 'map' : 1, 'struct' : 1, 'chan' : 1,
       'else' : 1, 'goto' : 1, 'package' : 1, 'switch' : 1, 'const' : 1,
       'fallthrough' : 1, 'if' : 1, 'range' : 1, 'type' : 1, 'continue' : 1,
       'for' : 1, 'import' : 1, 'return' : 1, 'var' : 1, 'go': 1, 'defer' : 1
    },
    'constant': {
       'true': 1, 'false': 1, 'iota': 1, 'nil': 1
    },
    'typename': {
       'bool': 1, 'byte': 1, 'complex64': 1, 'complex128': 1, 'float32': 1,
       'float64': 1, 'int8': 1, 'int16': 1, 'int32': 1, 'int64': 1, 'string': 1,
       'uint8': 1, 'uint16': 1, 'uint32': 1, 'uint64': 1, 'int': 1, 'uint': 1,
       'uintptr': 1
   },
    'built_in': {
       'append': 1, 'cap': 1, 'close': 1, 'complex': 1, 'copy': 1, 'imag': 1,
       'len': 1, 'make': 1, 'new': 1, 'panic': 1, 'print': 1, 'println': 1,
       'real': 1, 'recover': 1
    }
  };
  return {
    defaultMode: {
      keywords: GO_KEYWORDS,
      illegal: '</',
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.QUOTE_STRING_MODE,
        {
          className: 'string',
          begin: '\'', end: '[^\\\\]\'',
          relevance: 0
        },
        {
          className: 'string',
          begin: '`', end: '[^\\\\]`'
        },
        {
          className: 'number',
          begin: '[^a-zA-Z_0-9](\\-|\\+)?\\d+(\\.\\d+|\\/\\d+)?((d|e|f|l|s)(\\+|\\-)?\\d+)?',
          relevance: 0
        },
        hljs.C_NUMBER_MODE
      ]
    }
  };
}();

/*
Language: Haskell
Author: Jeremy Hull <sourdrums@gmail.com>
*/

hljs.LANGUAGES.haskell = function(){
  var LABEL = {
    className: 'label',
    begin: '\\b[A-Z][\\w\']*',
    relevance: 0
  };
  var CONTAINER = {
    className: 'container',
    begin: '\\(', end: '\\)',
    contains: [
      {className: 'label', begin: '\\b[A-Z][\\w\\(\\)\\.\']*'},
      {className: 'title', begin: '[_a-z][\\w\']*'}
    ]
  };

  return {
    defaultMode: {
      keywords: {
        'keyword': {
          'let': 1, 'in': 1, 'if': 1, 'then': 1, 'else': 1, 'case': 1, 'of': 1,
          'where': 1, 'do': 1, 'module': 1, 'import': 1, 'hiding': 1,
          'qualified': 1, 'type': 1, 'data': 1, 'newtype': 1, 'deriving': 1,
          'class': 1, 'instance': 1, 'null': 1, 'not': 1, 'as': 1
        }
      },
      contains: [
        {
          className: 'comment',
          begin: '--', end: '$'
        },
        {
          className: 'comment',
          begin: '{-', end: '-}'
        },
        {
          className: 'string',
          begin: '\\s+\'', end: '\'',
          contains: [hljs.BACKSLASH_ESCAPE],
          relevance: 0
        },
        hljs.QUOTE_STRING_MODE,
        {
          className: 'import',
          begin: '\\bimport', end: '$',
          keywords: {'import': 1, 'qualified': 1, 'as': 1, 'hiding': 1},
          contains: [CONTAINER]
        },
        {
          className: 'module',
          begin: '\\bmodule', end: 'where',
          keywords: {'module': 1, 'where': 1},
          contains: [CONTAINER]
        },
        {
          className: 'class',
          begin: '\\b(class|instance|data|(new)?type)', end: '(where|$)',
          keywords: {'class': 1, 'where': 1, 'instance': 1,'data': 1,'type': 1,'newtype': 1, 'deriving': 1},
          contains: [LABEL]
        },
        hljs.C_NUMBER_MODE,
        {
          className: 'shebang',
          begin: '#!\\/usr\\/bin\\/env\ runhaskell', end: '$'
        },
        LABEL,
        {
          className: 'title', begin: '^[_a-z][\\w\']*'
        }
      ]
    }
  };
}();
/*
Language: Ini
*/

hljs.LANGUAGES.ini = {
  case_insensitive: true,
  defaultMode: {
    illegal: '[^\\s]',
    contains: [
      {
        className: 'comment',
        begin: ';', end: '$'
      },
      {
        className: 'title',
        begin: '^\\[', end: '\\]'
      },
      {
        className: 'setting',
        begin: '^[a-z0-9_\\[\\]]+[ \\t]*=[ \\t]*', end: '$',
        contains: [
          {
            className: 'value',
            endsWithParent: true,
            keywords: {'on': 1, 'off': 1, 'true': 1, 'false': 1, 'yes': 1, 'no': 1},
            contains: [hljs.QUOTE_STRING_MODE, hljs.NUMBER_MODE]
          }
        ]
      }
    ]
  }
};
/*
Language: Java
Author: Vsevolod Solovyov <vsevolod.solovyov@gmail.com>
*/

hljs.LANGUAGES.java  = {
  defaultMode: {
    keywords: {'false': 1, 'synchronized': 1, 'int': 1, 'abstract': 1, 'float': 1, 'private': 1, 'char': 1, 'interface': 1, 'boolean': 1, 'static': 1, 'null': 1, 'if': 1, 'const': 1, 'for': 1, 'true': 1, 'while': 1, 'long': 1, 'throw': 1, 'strictfp': 1, 'finally': 1, 'protected': 1, 'extends': 1, 'import': 1, 'native': 1, 'final': 1, 'implements': 1, 'return': 1, 'void': 1, 'enum': 1, 'else': 1, 'break': 1, 'transient': 1, 'new': 1, 'catch': 1, 'instanceof': 1, 'byte': 1, 'super': 1, 'class': 1, 'volatile': 1, 'case': 1, 'assert': 1, 'short': 1, 'package': 1, 'default': 1, 'double': 1, 'public': 1, 'try': 1, 'this': 1, 'switch': 1, 'continue': 1, 'throws': 1},
    contains: [
      {
        className: 'javadoc',
        begin: '/\\*\\*', end: '\\*/',
        contains: [{
          className: 'javadoctag', begin: '@[A-Za-z]+'
        }],
        relevance: 10
      },
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      {
        className: 'class',
        begin: '(class |interface )', end: '{',
        keywords: {'class': 1, 'interface': 1},
        illegal: ':',
        contains: [
          {
            begin: '(implements|extends)',
            keywords: {'extends': 1, 'implements': 1},
            relevance: 10
          },
          {
            className: 'title',
            begin: hljs.UNDERSCORE_IDENT_RE
          }
        ]
      },
      hljs.C_NUMBER_MODE,
      {
        className: 'annotation', begin: '@[A-Za-z]+'
      }
    ]
  }
};
/*
Language: Javascript
*/

hljs.LANGUAGES.javascript = {
  defaultMode: {
    keywords: {
      'keyword': {'in': 1, 'if': 1, 'for': 1, 'while': 1, 'finally': 1, 'var': 1, 'new': 1, 'function': 1, 'do': 1, 'return': 1, 'void': 1, 'else': 1, 'break': 1, 'catch': 1, 'instanceof': 1, 'with': 1, 'throw': 1, 'case': 1, 'default': 1, 'try': 1, 'this': 1, 'switch': 1, 'continue': 1, 'typeof': 1, 'delete': 1},
      'literal': {'true': 1, 'false': 1, 'null': 1}
    },
    contains: [
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.C_NUMBER_MODE,
      { // regexp container
        begin: '(' + hljs.RE_STARTERS_RE + '|case|return|throw)\\s*',
        keywords: {'return': 1, 'throw': 1, 'case': 1},
        contains: [
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          {
            className: 'regexp',
            begin: '/', end: '/[gim]*',
            contains: [{begin: '\\\\/'}]
          }
        ],
        relevance: 0
      },
      {
        className: 'function',
        begin: '\\bfunction\\b', end: '{',
        keywords: {'function': 1},
        contains: [
          {
            className: 'title', begin: '[A-Za-z$_][0-9A-Za-z$_]*'
          },
          {
            className: 'params',
            begin: '\\(', end: '\\)',
            contains: [
              hljs.APOS_STRING_MODE,
              hljs.QUOTE_STRING_MODE,
              hljs.C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE
            ]
          }
        ]
      }
    ]
  }
};
/*
Language: Lisp
Description: Generic lisp syntax
Author: Vasily Polovnyov <vast@whiteants.net>
*/

hljs.LANGUAGES.lisp = function(){
  var LISP_IDENT_RE = '[a-zA-Z_\\-\\+\\*\\/\\<\\=\\>\\&\\#][a-zA-Z0-9_\\-\\+\\*\\/\\<\\=\\>\\&\\#]*';
  var LISP_SIMPLE_NUMBER_RE = '(\\-|\\+)?\\d+(\\.\\d+|\\/\\d+)?((d|e|f|l|s)(\\+|\\-)?\\d+)?';
  var LITERAL = {
    className: 'literal',
    begin: '\\b(t{1}|nil)\\b'
  };
  var NUMBER1 = {
    className: 'number', begin: LISP_SIMPLE_NUMBER_RE
  };
  var NUMBER2 = {
    className: 'number', begin: '#b[0-1]+(/[0-1]+)?'
  };
  var NUMBER3 = {
    className: 'number', begin: '#o[0-7]+(/[0-7]+)?'
  };
  var NUMBER4 = {
    className: 'number', begin: '#x[0-9a-f]+(/[0-9a-f]+)?'
  };
  var NUMBER5 = {
    className: 'number', begin: '#c\\(' + LISP_SIMPLE_NUMBER_RE + ' +' + LISP_SIMPLE_NUMBER_RE, end: '\\)'
  };
  var STRING = {
    className: 'string',
    begin: '"', end: '"',
    contains: [hljs.BACKSLASH_ESCAPE],
    relevance: 0
  };
  var COMMENT = {
    className: 'comment',
    begin: ';', end: '$'
  };
  var VARIABLE = {
    className: 'variable',
    begin: '\\*', end: '\\*'
  };
  var KEYWORD = {
    className: 'keyword',
    begin: '[:&]' + LISP_IDENT_RE
  };
  var QUOTED_LIST = {
    begin: '\\(', end: '\\)'
  };
  QUOTED_LIST.contains = [QUOTED_LIST, LITERAL, NUMBER1, NUMBER2, NUMBER3, NUMBER4, NUMBER5, STRING];
  var QUOTED1 = {
    className: 'quoted',
    begin: '[\'`]\\(', end: '\\)',
    contains: [NUMBER1, NUMBER2, NUMBER3, NUMBER4, NUMBER5, STRING, VARIABLE, KEYWORD, QUOTED_LIST]
  };
  var QUOTED2 = {
    className: 'quoted',
    begin: '\\(quote ', end: '\\)',
    keywords: {'title': {'quote': 1}},
    contains: [NUMBER1, NUMBER2, NUMBER3, NUMBER4, NUMBER5, STRING, VARIABLE, KEYWORD, QUOTED_LIST]
  };
  var LIST = {
    className: 'list',
    begin: '\\(', end: '\\)'
  };
  var BODY = {
    className: 'body',
    endsWithParent: true, excludeEnd: true
  };
  LIST.contains = [{className: 'title', begin: LISP_IDENT_RE}, BODY];
  BODY.contains = [QUOTED1, QUOTED2, LIST, LITERAL, NUMBER1, NUMBER2, NUMBER3, NUMBER4, NUMBER5, STRING, COMMENT, VARIABLE, KEYWORD];

  return {
    case_insensitive: true,
    defaultMode: {
      illegal: '[^\\s]',
      contains: [
        LITERAL,
        NUMBER1, NUMBER2, NUMBER3, NUMBER4, NUMBER5,
        STRING,
        COMMENT,
        QUOTED1, QUOTED2,
        LIST
      ]
    }
  };
}();
/*
Language: Lua
Author: Andrew Fedorov <dmmdrs@mail.ru>
*/

hljs.LANGUAGES.lua = function() {
  var OPENING_LONG_BRACKET = '\\[=*\\[';
  var CLOSING_LONG_BRACKET = '\\]=*\\]';
  var LONG_BRACKETS = {
    begin: OPENING_LONG_BRACKET, end: CLOSING_LONG_BRACKET
  };
  LONG_BRACKETS.contains = [LONG_BRACKETS];
  var COMMENT1 = {
    className: 'comment',
    begin: '--(?!' + OPENING_LONG_BRACKET + ')', end: '$'
  };
  var COMMENT2 = {
    className: 'comment',
    begin: '--' + OPENING_LONG_BRACKET, end: CLOSING_LONG_BRACKET,
    contains: [LONG_BRACKETS],
    relevance: 10
  };
  return {
    defaultMode: {
      lexems: hljs.UNDERSCORE_IDENT_RE,
      keywords: {
        'keyword': {
          'and': 1, 'break': 1, 'do': 1, 'else': 1, 'elseif': 1, 'end': 1,
          'false': 1, 'for': 1, 'if': 1, 'in': 1, 'local': 1, 'nil': 1,
          'not': 1, 'or': 1, 'repeat': 1, 'return': 1, 'then': 1, 'true': 1,
          'until': 1, 'while': 1
        },
        'built_in': {
          '_G': 1, '_VERSION': 1, 'assert': 1, 'collectgarbage': 1, 'dofile': 1,
          'error': 1, 'getfenv': 1, 'getmetatable': 1, 'ipairs': 1, 'load': 1,
          'loadfile': 1, 'loadstring': 1, 'module': 1, 'next': 1, 'pairs': 1,
          'pcall': 1, 'print': 1, 'rawequal': 1, 'rawget': 1, 'rawset': 1,
          'require': 1, 'select': 1, 'setfenv': 1, 'setmetatable': 1,
          'tonumber': 1, 'tostring': 1, 'type': 1, 'unpack': 1, 'xpcall': 1,
          'coroutine': 1, 'debug': 1, 'io': 1, 'math': 1, 'os': 1, 'package': 1,
          'string': 1, 'table': 1
        }
      },
      contains: [
        COMMENT1, COMMENT2,
        {
          className: 'function',
          begin: '\\bfunction\\b', end: '\\)',
          keywords: {'function': 1},
          contains: [
            {
              className: 'title',
              begin: '([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*'
            },
            {
              className: 'params',
              begin: '\\(', endsWithParent: true,
              contains: [COMMENT1, COMMENT2]
            },
            COMMENT1, COMMENT2
          ]
        },
        hljs.C_NUMBER_MODE,
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        {
          className: 'string',
          begin: OPENING_LONG_BRACKET, end: CLOSING_LONG_BRACKET,
          contains: [LONG_BRACKETS],
          relevance: 10
        }
      ]
    }
  };
}();
/*
Language: Nginx
Author: Peter Leonov <gojpeg@yandex.ru>
*/

hljs.LANGUAGES.nginx = function() {
  var VAR1 = {
    className: 'variable',
    begin: '\\$\\d+'
  };
  var VAR2 = {
    className: 'variable',
    begin: '\\${', end: '}'
  };
  var VAR3 = {
    className: 'variable',
    begin: '[\\$\\@]' + hljs.UNDERSCORE_IDENT_RE
  };

  return {
    defaultMode: {
      contains: [
        hljs.HASH_COMMENT_MODE,
        { // directive
          begin: hljs.UNDERSCORE_IDENT_RE, end: ';|{', returnEnd: true,
          keywords: {
            accept_mutex: 1, accept_mutex_delay: 1, access_log: 1,
            add_after_body: 1, add_before_body: 1, add_header: 1,
            addition_types: 1, alias: 1, allow: 1, ancient_browser: 1,
            ancient_browser: 1, ancient_browser_value: 1, ancient_browser_value: 1,
            auth_basic: 1, auth_basic_user_file: 1, autoindex: 1,
            autoindex_exact_size: 1, autoindex_localtime: 1, 'break': 1,
            charset: 1, charset: 1, charset_map: 1, charset_map: 1,
            charset_types: 1, charset_types: 1, client_body_buffer_size: 1,
            client_body_in_file_only: 1, client_body_in_single_buffer: 1,
            client_body_temp_path: 1, client_body_timeout: 1,
            client_header_buffer_size: 1, client_header_timeout: 1,
            client_max_body_size: 1, connection_pool_size: 1, connections: 1,
            create_full_put_path: 1, daemon: 1, dav_access: 1, dav_methods: 1,
            debug_connection: 1, debug_points: 1, default_type: 1, deny: 1,
            directio: 1, directio_alignment: 1, echo: 1, echo_after_body: 1,
            echo_before_body: 1, echo_blocking_sleep: 1, echo_duplicate: 1,
            echo_end: 1, echo_exec: 1, echo_flush: 1, echo_foreach_split: 1,
            echo_location: 1, echo_location_async: 1, echo_read_request_body: 1,
            echo_request_body: 1, echo_reset_timer: 1, echo_sleep: 1,
            echo_subrequest: 1, echo_subrequest_async: 1, empty_gif: 1,
            empty_gif: 1, env: 1, error_log: 1, error_log: 1, error_page: 1,
            events: 1, expires: 1, fastcgi_bind: 1, fastcgi_buffer_size: 1,
            fastcgi_buffers: 1, fastcgi_busy_buffers_size: 1, fastcgi_cache: 1,
            fastcgi_cache_key: 1, fastcgi_cache_methods: 1,
            fastcgi_cache_min_uses: 1, fastcgi_cache_path: 1,
            fastcgi_cache_use_stale: 1, fastcgi_cache_valid: 1,
            fastcgi_catch_stderr: 1, fastcgi_connect_timeout: 1,
            fastcgi_hide_header: 1, fastcgi_ignore_client_abort: 1,
            fastcgi_ignore_headers: 1, fastcgi_index: 1,
            fastcgi_intercept_errors: 1, fastcgi_max_temp_file_size: 1,
            fastcgi_next_upstream: 1, fastcgi_param: 1, fastcgi_pass: 1,
            fastcgi_pass_header: 1, fastcgi_pass_request_body: 1,
            fastcgi_pass_request_headers: 1, fastcgi_read_timeout: 1,
            fastcgi_send_lowat: 1, fastcgi_send_timeout: 1,
            fastcgi_split_path_info: 1, fastcgi_store: 1, fastcgi_store_access: 1,
            fastcgi_temp_file_write_size: 1, fastcgi_temp_path: 1,
            fastcgi_upstream_fail_timeout: 1, fastcgi_upstream_max_fails: 1,
            flv: 1, geo: 1, geo: 1, geoip_city: 1, geoip_country: 1, gzip: 1,
            gzip_buffers: 1, gzip_comp_level: 1, gzip_disable: 1, gzip_hash: 1,
            gzip_http_version: 1, gzip_min_length: 1, gzip_no_buffer: 1,
            gzip_proxied: 1, gzip_static: 1, gzip_types: 1, gzip_vary: 1,
            gzip_window: 1, http: 1, 'if': 1, if_modified_since: 1,
            ignore_invalid_headers: 1, image_filter: 1, image_filter_buffer: 1,
            image_filter_jpeg_quality: 1, image_filter_transparency: 1, include: 1,
            index: 1, internal: 1, ip_hash: 1, js: 1, js_load: 1, js_require: 1,
            js_utf8: 1, keepalive_requests: 1, keepalive_timeout: 1,
            kqueue_changes: 1, kqueue_events: 1, large_client_header_buffers: 1,
            limit_conn: 1, limit_conn_log_level: 1, limit_except: 1, limit_rate: 1,
            limit_rate_after: 1, limit_req: 1, limit_req_log_level: 1,
            limit_req_zone: 1, limit_zone: 1, lingering_time: 1,
            lingering_timeout: 1, listen: 1, location: 1, lock_file: 1,
            log_format: 1, log_not_found: 1, log_subrequest: 1, map: 1,
            map_hash_bucket_size: 1, map_hash_max_size: 1, master_process: 1,
            memcached_bind: 1, memcached_buffer_size: 1,
            memcached_connect_timeout: 1, memcached_next_upstream: 1,
            memcached_pass: 1, memcached_read_timeout: 1,
            memcached_send_timeout: 1, memcached_upstream_fail_timeout: 1,
            memcached_upstream_max_fails: 1, merge_slashes: 1, min_delete_depth: 1,
            modern_browser: 1, modern_browser: 1, modern_browser_value: 1,
            modern_browser_value: 1, more_clear_headers: 1,
            more_clear_input_headers: 1, more_set_headers: 1,
            more_set_input_headers: 1, msie_padding: 1, msie_refresh: 1,
            multi_accept: 1, open_file_cache: 1, open_file_cache_errors: 1,
            open_file_cache_events: 1, open_file_cache_min_uses: 1,
            open_file_cache_retest: 1, open_file_cache_valid: 1,
            open_log_file_cache: 1, optimize_server_names: 1, output_buffers: 1,
            override_charset: 1, override_charset: 1, perl: 1, perl_modules: 1,
            perl_require: 1, perl_set: 1, pid: 1, port_in_redirect: 1,
            post_action: 1, postpone_gzipping: 1, postpone_output: 1,
            proxy_bind: 1, proxy_buffer_size: 1, proxy_buffering: 1,
            proxy_buffers: 1, proxy_busy_buffers_size: 1, proxy_cache: 1,
            proxy_cache_key: 1, proxy_cache_methods: 1, proxy_cache_min_uses: 1,
            proxy_cache_path: 1, proxy_cache_use_stale: 1, proxy_cache_valid: 1,
            proxy_connect_timeout: 1, proxy_headers_hash_bucket_size: 1,
            proxy_headers_hash_max_size: 1, proxy_hide_header: 1,
            proxy_ignore_client_abort: 1, proxy_ignore_headers: 1,
            proxy_intercept_errors: 1, proxy_max_temp_file_size: 1,
            proxy_method: 1, proxy_next_upstream: 1, proxy_pass: 1,
            proxy_pass_header: 1, proxy_pass_request_body: 1,
            proxy_pass_request_headers: 1, proxy_read_timeout: 1,
            proxy_redirect: 1, proxy_send_lowat: 1, proxy_send_timeout: 1,
            proxy_set_body: 1, proxy_set_header: 1, proxy_store: 1,
            proxy_store_access: 1, proxy_temp_file_write_size: 1,
            proxy_temp_path: 1, proxy_upstream_fail_timeout: 1,
            proxy_upstream_max_fails: 1, push_authorized_channels_only: 1,
            push_channel_group: 1, push_max_channel_id_length: 1,
            push_max_channel_subscribers: 1, push_max_message_buffer_length: 1,
            push_max_reserved_memory: 1, push_message_buffer_length: 1,
            push_message_timeout: 1, push_min_message_buffer_length: 1,
            push_min_message_recipients: 1, push_publisher: 1,
            push_store_messages: 1, push_subscriber: 1,
            push_subscriber_concurrency: 1, random_index: 1, read_ahead: 1,
            real_ip_header: 1, recursive_error_pages: 1, request_pool_size: 1,
            reset_timedout_connection: 1, resolver: 1, resolver_timeout: 1,
            'return': 1, rewrite: 1, rewrite_log: 1, root: 1, satisfy: 1,
            satisfy_any: 1, send_lowat: 1, send_timeout: 1, sendfile: 1,
            sendfile_max_chunk: 1, server: 1, server: 1, server_name: 1,
            server_name_in_redirect: 1, server_names_hash_bucket_size: 1,
            server_names_hash_max_size: 1, server_tokens: 1, 'set': 1,
            set_real_ip_from: 1, source_charset: 1, source_charset: 1, ssi: 1,
            ssi_ignore_recycled_buffers: 1, ssi_min_file_chunk: 1,
            ssi_silent_errors: 1, ssi_types: 1, ssi_value_length: 1, ssl: 1,
            ssl_certificate: 1, ssl_certificate_key: 1, ssl_ciphers: 1,
            ssl_client_certificate: 1, ssl_crl: 1, ssl_dhparam: 1,
            ssl_prefer_server_ciphers: 1, ssl_protocols: 1, ssl_session_cache: 1,
            ssl_session_timeout: 1, ssl_verify_client: 1, ssl_verify_depth: 1,
            sub_filter: 1, sub_filter_once: 1, sub_filter_types: 1, tcp_nodelay: 1,
            tcp_nopush: 1, timer_resolution: 1, try_files: 1, types: 1,
            types_hash_bucket_size: 1, types_hash_max_size: 1,
            underscores_in_headers: 1, uninitialized_variable_warn: 1, upstream: 1,
            use: 1, user: 1, userid: 1, userid: 1, userid_domain: 1,
            userid_domain: 1, userid_expires: 1, userid_expires: 1, userid_mark: 1,
            userid_name: 1, userid_name: 1, userid_p3p: 1, userid_p3p: 1,
            userid_path: 1, userid_path: 1, userid_service: 1, userid_service: 1,
            valid_referers: 1, variables_hash_bucket_size: 1,
            variables_hash_max_size: 1, worker_connections: 1,
            worker_cpu_affinity: 1, worker_priority: 1, worker_processes: 1,
            worker_rlimit_core: 1, worker_rlimit_nofile: 1,
            worker_rlimit_sigpending: 1, working_directory: 1, xml_entities: 1,
            xslt_stylesheet: 1, xslt_types: 1
          },
          relevance: 0,
          contains: [
            hljs.HASH_COMMENT_MODE,
            {
              begin: '\\s', end: '[;{]', returnBegin: true, returnEnd: true,
              lexems: '[a-z/]+',
              keywords: {
                'built_in': {
                  'on': 1, 'off': 1, 'yes': 1, 'no': 1, 'true': 1, 'false': 1,
                  'none': 1, 'blocked': 1, 'debug': 1, 'info': 1, 'notice': 1,
                  'warn': 1, 'error': 1, 'crit': 1, 'select': 1, 'permanent': 1,
                  'redirect': 1, 'kqueue': 1, 'rtsig': 1, 'epoll': 1, 'poll': 1,
                  '/dev/poll': 1
                }
              },
              relevance: 0,
              contains: [
                hljs.HASH_COMMENT_MODE,
                {
                  className: 'string',
                  begin: '"', end: '"',
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3],
                  relevance: 0
                },
                {
                  className: 'string',
                  begin: "'", end: "'",
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3],
                  relevance: 0
                },
                {
                  className: 'string',
                  begin: '([a-z]+):/', end: '[;\\s]', returnEnd: true
                },
                {
                  className: 'regexp',
                  begin: "\\s\\^", end: "\\s|{|;", returnEnd: true,
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3]
                },
                // regexp locations (~, ~*)
                {
                  className: 'regexp',
                  begin: "~\\*?\\s+", end: "\\s|{|;", returnEnd: true,
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3]
                },
                // *.example.com
                {
                  className: 'regexp',
                  begin: "\\*(\\.[a-z\\-]+)+",
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3]
                },
                // sub.example.*
                {
                  className: 'regexp',
                  begin: "([a-z\\-]+\\.)+\\*",
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3]
                },
                // IP
                {
                  className: 'number',
                  begin: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b'
                },
                // units
                {
                  className: 'number',
                  begin: '\\s\\d+[kKmMgGdshdwy]*\\b',
                  relevance: 0
                },
                VAR1, VAR2, VAR3
              ]
            }
          ]
        }
      ]
    }
  }
}();
/*
Language: Objective C
Author: Valerii Hiora <valerii.hiora@gmail.com>
*/

hljs.LANGUAGES.objectivec = function(){
  var OBJC_KEYWORDS = {
    'keyword': {
      'false': 1, 'int': 1, 'float': 1, 'while': 1, 'private': 1, 'char': 1,
      'catch': 1, 'export': 1, 'sizeof': 2, 'typedef': 2, 'const': 1,
      'struct': 1, 'for': 1, 'union': 1, 'unsigned': 1, 'long': 1,
      'volatile': 2, 'static': 1, 'protected': 1, 'bool': 1, 'mutable': 1,
      'if': 1, 'public': 1, 'do': 1, 'return': 1, 'goto': 1, 'void': 2,
      'enum': 1, 'else': 1, 'break': 1, 'extern': 1, 'true': 1, 'class': 1,
      'asm': 1, 'case': 1, 'short': 1, 'default': 1, 'double': 1, 'throw': 1,
      'register': 1, 'explicit': 1, 'signed': 1, 'typename': 1, 'try': 1,
      'this': 1, 'switch': 1, 'continue': 1, 'wchar_t': 1, 'inline': 1,
      'readonly': 1, 'assign': 1, 'property': 1, 'protocol': 10, 'self': 1,
      'synchronized': 1, 'end': 1, 'synthesize': 50, 'id': 1, 'optional': 1,
      'required': 1, 'implementation': 10, 'nonatomic': 1,'interface': 1,
      'super': 1, 'unichar': 1, 'finally': 2, 'dynamic': 2, 'nil': 1
    },
    'built_in': {
      'YES': 5, 'NO': 5, 'NULL': 1, 'IBOutlet': 50, 'IBAction': 50,
      'NSString': 50, 'NSDictionary': 50, 'CGRect': 50, 'CGPoint': 50,
      'NSRange': 50, 'release': 1, 'retain': 1, 'autorelease': 50,
      'UIButton': 50, 'UILabel': 50, 'UITextView': 50, 'UIWebView': 50,
      'MKMapView': 50, 'UISegmentedControl': 50, 'NSObject': 50,
      'UITableViewDelegate': 50, 'UITableViewDataSource': 50, 'NSThread': 50,
      'UIActivityIndicator': 50, 'UITabbar': 50, 'UIToolBar': 50,
      'UIBarButtonItem': 50, 'UIImageView': 50, 'NSAutoreleasePool': 50,
      'UITableView': 50, 'BOOL': 1, 'NSInteger': 20, 'CGFloat': 20,
      'NSException': 50, 'NSLog': 50, 'NSMutableString': 50,
      'NSMutableArray': 50, 'NSMutableDictionary': 50, 'NSURL': 50
    }
  };
  return {
    defaultMode: {
      keywords: OBJC_KEYWORDS,
      illegal: '</',
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.C_NUMBER_MODE,
        hljs.QUOTE_STRING_MODE,
        {
          className: 'string',
          begin: '\'',
          end: '[^\\\\]\'',
          illegal: '[^\\\\][^\']'
        },

        {
          className: 'preprocessor',
          begin: '#import',
          end: '$',
          contains: [
          {
            className: 'title',
            begin: '\"',
            end: '\"'
          },
          {
            className: 'title',
            begin: '<',
            end: '>'
          }
          ]
        },
        {
          className: 'preprocessor',
          begin: '#',
          end: '$'
        },
        {
          className: 'class',
          begin: 'interface|class|protocol|implementation',
          end: '({|$)',
          keywords: {
            'interface': 1,
            'class': 1,
            'protocol': 5,
            'implementation': 5
          },
          contains: [{
            className: 'id',
            begin: hljs.UNDERSCORE_IDENT_RE
          }
          ]
        }
      ]
    }
  };
}();
/*
Language: Perl
Author: Peter Leonov <gojpeg@yandex.ru>
*/

hljs.LANGUAGES.perl = function(){
  var PERL_KEYWORDS = {'getpwent': 1, 'getservent': 1, 'quotemeta': 1, 'msgrcv': 1, 'scalar': 1, 'kill': 1, 'dbmclose': 1, 'undef': 1, 'lc': 1, 'ma': 1, 'syswrite': 1, 'tr': 1, 'send': 1, 'umask': 1, 'sysopen': 1, 'shmwrite': 1, 'vec': 1, 'qx': 1, 'utime': 1, 'local': 1, 'oct': 1, 'semctl': 1, 'localtime': 1, 'readpipe': 1, 'do': 1, 'return': 1, 'format': 1, 'read': 1, 'sprintf': 1, 'dbmopen': 1, 'pop': 1, 'getpgrp': 1, 'not': 1, 'getpwnam': 1, 'rewinddir': 1, 'qq': 1, 'fileno': 1, 'qw': 1, 'endprotoent': 1, 'wait': 1, 'sethostent': 1, 'bless': 1, 's': 1, 'opendir': 1, 'continue': 1, 'each': 1, 'sleep': 1, 'endgrent': 1, 'shutdown': 1, 'dump': 1, 'chomp': 1, 'connect': 1, 'getsockname': 1, 'die': 1, 'socketpair': 1, 'close': 1, 'flock': 1, 'exists': 1, 'index': 1, 'shmget': 1, 'sub': 1, 'for': 1, 'endpwent': 1, 'redo': 1, 'lstat': 1, 'msgctl': 1, 'setpgrp': 1, 'abs': 1, 'exit': 1, 'select': 1, 'print': 1, 'ref': 1, 'gethostbyaddr': 1, 'unshift': 1, 'fcntl': 1, 'syscall': 1, 'goto': 1, 'getnetbyaddr': 1, 'join': 1, 'gmtime': 1, 'symlink': 1, 'semget': 1, 'splice': 1, 'x': 1, 'getpeername': 1, 'recv': 1, 'log': 1, 'setsockopt': 1, 'cos': 1, 'last': 1, 'reverse': 1, 'gethostbyname': 1, 'getgrnam': 1, 'study': 1, 'formline': 1, 'endhostent': 1, 'times': 1, 'chop': 1, 'length': 1, 'gethostent': 1, 'getnetent': 1, 'pack': 1, 'getprotoent': 1, 'getservbyname': 1, 'rand': 1, 'mkdir': 1, 'pos': 1, 'chmod': 1, 'y': 1, 'substr': 1, 'endnetent': 1, 'printf': 1, 'next': 1, 'open': 1, 'msgsnd': 1, 'readdir': 1, 'use': 1, 'unlink': 1, 'getsockopt': 1, 'getpriority': 1, 'rindex': 1, 'wantarray': 1, 'hex': 1, 'system': 1, 'getservbyport': 1, 'endservent': 1, 'int': 1, 'chr': 1, 'untie': 1, 'rmdir': 1, 'prototype': 1, 'tell': 1, 'listen': 1, 'fork': 1, 'shmread': 1, 'ucfirst': 1, 'setprotoent': 1, 'else': 1, 'sysseek': 1, 'link': 1, 'getgrgid': 1, 'shmctl': 1, 'waitpid': 1, 'unpack': 1, 'getnetbyname': 1, 'reset': 1, 'chdir': 1, 'grep': 1, 'split': 1, 'require': 1, 'caller': 1, 'lcfirst': 1, 'until': 1, 'warn': 1, 'while': 1, 'values': 1, 'shift': 1, 'telldir': 1, 'getpwuid': 1, 'my': 1, 'getprotobynumber': 1, 'delete': 1, 'and': 1, 'sort': 1, 'uc': 1, 'defined': 1, 'srand': 1, 'accept': 1, 'package': 1, 'seekdir': 1, 'getprotobyname': 1, 'semop': 1, 'our': 1, 'rename': 1, 'seek': 1, 'if': 1, 'q': 1, 'chroot': 1, 'sysread': 1, 'setpwent': 1, 'no': 1, 'crypt': 1, 'getc': 1, 'chown': 1, 'sqrt': 1, 'write': 1, 'setnetent': 1, 'setpriority': 1, 'foreach': 1, 'tie': 1, 'sin': 1, 'msgget': 1, 'map': 1, 'stat': 1, 'getlogin': 1, 'unless': 1, 'elsif': 1, 'truncate': 1, 'exec': 1, 'keys': 1, 'glob': 1, 'tied': 1, 'closedir': 1, 'ioctl': 1, 'socket': 1, 'readlink': 1, 'eval': 1, 'xor': 1, 'readline': 1, 'binmode': 1, 'setservent': 1, 'eof': 1, 'ord': 1, 'bind': 1, 'alarm': 1, 'pipe': 1, 'atan2': 1, 'getgrent': 1, 'exp': 1, 'time': 1, 'push': 1, 'setgrent': 1, 'gt': 1, 'lt': 1, 'or': 1, 'ne': 1, 'm': 1};
  var SUBST = {
    className: 'subst',
    begin: '[$@]\\{', end: '\}',
    keywords: PERL_KEYWORDS,
    relevance: 10
  };
  var VAR1 = {
    className: 'variable',
    begin: '\\$\\d'
  };
  var VAR2 = {
    className: 'variable',
    begin: '[\\$\\%\\@\\*](\\^\\w\\b|#\\w+(\\:\\:\\w+)*|[^\\s\\w{]|{\\w+}|\\w+(\\:\\:\\w*)*)'
  };
  var STRING_CONTAINS = [hljs.BACKSLASH_ESCAPE, SUBST, VAR1, VAR2];
  var METHOD = {
    begin: '->',
    contains: [
      {begin: hljs.IDENT_RE},
      {begin: '{', end: '}'}
    ]
  };
  var PERL_DEFAULT_CONTAINS = [
    VAR1, VAR2,
    hljs.HASH_COMMENT_MODE,
    {
      className: 'comment',
      begin: '^(__END__|__DATA__)', end: '\\n$',
      relevance: 5
    },
    METHOD,
    {
      className: 'string',
      begin: 'q[qwxr]?\\s*\\(', end: '\\)',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: 'q[qwxr]?\\s*\\[', end: '\\]',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: 'q[qwxr]?\\s*\\{', end: '\\}',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: 'q[qwxr]?\\s*\\|', end: '\\|',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: 'q[qwxr]?\\s*\\<', end: '\\>',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: 'qw\\s+q', end: 'q',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: '\'', end: '\'',
      contains: [hljs.BACKSLASH_ESCAPE],
      relevance: 0
    },
    {
      className: 'string',
      begin: '"', end: '"',
      contains: STRING_CONTAINS,
      relevance: 0
    },
    {
      className: 'string',
      begin: '`', end: '`',
      contains: [hljs.BACKSLASH_ESCAPE]
    },
    {
      className: 'string',
      begin: '{\\w+}',
      relevance: 0
    },
    {
      className: 'string',
      begin: '\-?\\w+\\s*\\=\\>',
      relevance: 0
    },
    {
      className: 'number',
      begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
      relevance: 0
    },
    {
      className: 'regexp',
      begin: '(s|tr|y)/(\\\\.|[^/])*/(\\\\.|[^/])*/[a-z]*',
      relevance: 10
    },
    {
      className: 'regexp',
      begin: '(m|qr)?/', end: '/[a-z]*',
      contains: [hljs.BACKSLASH_ESCAPE],
      relevance: 0 // allows empty "//" which is a common comment delimiter in other languages
    },
    {
      className: 'sub',
      begin: '\\bsub\\b', end: '(\\s*\\(.*?\\))?[;{]',
      keywords: {'sub':1},
      relevance: 5
    },
    {
      className: 'operator',
      begin: '-\\w\\b',
      relevance: 0
    },
    {
      className: 'pod',
      begin: '\\=\\w', end: '\\=cut'
    }
  ];
  SUBST.contains = PERL_DEFAULT_CONTAINS;
  METHOD.contains[1].contains = PERL_DEFAULT_CONTAINS;

  return {
    defaultMode: {
      keywords: PERL_KEYWORDS,
      contains: PERL_DEFAULT_CONTAINS
    }
  };
}();
/*
Language: PHP
Author: Victor Karamzin <Victor.Karamzin@enterra-inc.com>
*/

hljs.LANGUAGES.php = {
  case_insensitive: true,
  defaultMode: {
    keywords: {
      'and': 1, 'include_once': 1, 'list': 1, 'abstract': 1, 'global': 1,
      'private': 1, 'echo': 1, 'interface': 1, 'as': 1, 'static': 1,
      'endswitch': 1, 'array': 1, 'null': 1, 'if': 1, 'endwhile': 1, 'or': 1,
      'const': 1, 'for': 1, 'endforeach': 1, 'self': 1, 'var': 1, 'while': 1,
      'isset': 1, 'public': 1, 'protected': 1, 'exit': 1, 'foreach': 1,
      'throw': 1, 'elseif': 1, 'extends': 1, 'include': 1, '__FILE__': 1,
      'empty': 1, 'require_once': 1, 'function': 1, 'do': 1, 'xor': 1,
      'return': 1, 'implements': 1, 'parent': 1, 'clone': 1, 'use': 1,
      '__CLASS__': 1, '__LINE__': 1, 'else': 1, 'break': 1, 'print': 1,
      'eval': 1, 'new': 1, 'catch': 1, '__METHOD__': 1, 'class': 1, 'case': 1,
      'exception': 1, 'php_user_filter': 1, 'default': 1, 'die': 1,
      'require': 1, '__FUNCTION__': 1, 'enddeclare': 1, 'final': 1, 'try': 1,
      'this': 1, 'switch': 1, 'continue': 1, 'endfor': 1, 'endif': 1,
      'declare': 1, 'unset': 1, 'true': 1, 'false': 1, 'namespace': 1
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.HASH_COMMENT_MODE,
      {
        className: 'comment',
        begin: '/\\*', end: '\\*/',
        contains: [{
            className: 'phpdoc',
            begin: '\\s@[A-Za-z]+',
            relevance: 10
        }]
      },
      hljs.C_NUMBER_MODE,
      hljs.inherit(hljs.APOS_STRING_MODE, {illegal: null}),
      hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null}),
      {
        className: 'variable',
        begin: '\\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*'
      },
      {
        className: 'preprocessor',
        begin: '<\\?php',
        relevance: 10
      },
      {
        className: 'preprocessor',
        begin: '\\?>'
      }
    ]
  }
};
/*
Language: Python
*/

hljs.LANGUAGES.python = function() {
  var STR1 = {
    className: 'string',
    begin: '(u|b)?r?\'\'\'', end: '\'\'\'',
    relevance: 10
  };
  var STR2 = {
    className: 'string',
    begin: '(u|b)?r?"""', end: '"""',
    relevance: 10
  };
  var STR3 = {
    className: 'string',
    begin: '(u|r|ur|b|br)\'', end: '\'',
    contains: [hljs.BACKSLASH_ESCAPE],
    relevance: 10
  };
  var STR4 = {
    className: 'string',
    begin: '(u|r|ur|b|br)"', end: '"',
    contains: [hljs.BACKSLASH_ESCAPE],
    relevance: 10
  };
  var TITLE = {
    className: 'title', begin: hljs.UNDERSCORE_IDENT_RE
  };
  var PARAMS = {
    className: 'params',
    begin: '\\(', end: '\\)',
    contains: [STR1, STR2, STR3, STR4, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE]
  };

  return {
    defaultMode: {
      keywords: {
        'keyword': {'and': 1, 'elif': 1, 'is': 1, 'global': 1, 'as': 1, 'in': 1, 'if': 1, 'from': 1, 'raise': 1, 'for': 1, 'except': 1, 'finally': 1, 'print': 1, 'import': 1, 'pass': 1, 'return': 1, 'exec': 1, 'else': 1, 'break': 1, 'not': 1, 'with': 1, 'class': 1, 'assert': 1, 'yield': 1, 'try': 1, 'while': 1, 'continue': 1, 'del': 1, 'or': 1, 'def': 1, 'lambda': 1, 'nonlocal': 10},
        'built_in': {'None': 1, 'True': 1, 'False': 1, 'Ellipsis': 1, 'NotImplemented': 1}
      },
      illegal: '(</|->|\\?)',
      contains: [
        hljs.HASH_COMMENT_MODE,
        STR1, STR2, STR3, STR4, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE,
        {
          className: 'function',
          begin: '\\bdef ', end: ':',
          illegal: '$',
          keywords: {'def': 1},
          contains: [TITLE, PARAMS],
          relevance: 10
        },
        {
          className: 'class',
          begin: '\\bclass ', end: ':',
          illegal: '[${]',
          keywords: {'class': 1},
          contains: [TITLE, PARAMS],
          relevance: 10
        },
        hljs.C_NUMBER_MODE,
        {
          className: 'decorator',
          begin: '@', end: '$'
        }
      ]
    }
  };
}();
/*
Language: Ruby
Author: Anton Kovalyov <anton@kovalyov.net>
Contributors: Peter Leonov <gojpeg@yandex.ru>, Vasily Polovnyov <vast@whiteants.net>, Loren Segal <lsegal@soen.ca>
*/

hljs.LANGUAGES.ruby = function(){
  var RUBY_IDENT_RE = '[a-zA-Z_][a-zA-Z0-9_]*(\\!|\\?)?';
  var RUBY_METHOD_RE = '[a-zA-Z_]\\w*[!?=]?|[-+~]\\@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?';
  var RUBY_KEYWORDS = {
    'keyword': {'and': 1, 'false': 1, 'then': 1, 'defined': 1, 'module': 1, 'in': 1, 'return': 1, 'redo': 1, 'if': 1, 'BEGIN': 1, 'retry': 1, 'end': 1, 'for': 1, 'true': 1, 'self': 1, 'when': 1, 'next': 1, 'until': 1, 'do': 1, 'begin': 1, 'unless': 1, 'END': 1, 'rescue': 1, 'nil': 1, 'else': 1, 'break': 1, 'undef': 1, 'not': 1, 'super': 1, 'class': 1, 'case': 1, 'require': 1, 'yield': 1, 'alias': 1, 'while': 1, 'ensure': 1, 'elsif': 1, 'or': 1, 'def': 1},
    'keymethods': {'__id__': 1, '__send__': 1, 'abort': 1, 'abs': 1, 'all?': 1, 'allocate': 1, 'ancestors': 1, 'any?': 1, 'arity': 1, 'assoc': 1, 'at': 1, 'at_exit': 1, 'autoload': 1, 'autoload?': 1, 'between?': 1, 'binding': 1, 'binmode': 1, 'block_given?': 1, 'call': 1, 'callcc': 1, 'caller': 1, 'capitalize': 1, 'capitalize!': 1, 'casecmp': 1, 'catch': 1, 'ceil': 1, 'center': 1, 'chomp': 1, 'chomp!': 1, 'chop': 1, 'chop!': 1, 'chr': 1, 'class': 1, 'class_eval': 1, 'class_variable_defined?': 1, 'class_variables': 1, 'clear': 1, 'clone': 1, 'close': 1, 'close_read': 1, 'close_write': 1, 'closed?': 1, 'coerce': 1, 'collect': 1, 'collect!': 1, 'compact': 1, 'compact!': 1, 'concat': 1, 'const_defined?': 1, 'const_get': 1, 'const_missing': 1, 'const_set': 1, 'constants': 1, 'count': 1, 'crypt': 1, 'default': 1, 'default_proc': 1, 'delete': 1, 'delete!': 1, 'delete_at': 1, 'delete_if': 1, 'detect': 1, 'display': 1, 'div': 1, 'divmod': 1, 'downcase': 1, 'downcase!': 1, 'downto': 1, 'dump': 1, 'dup': 1, 'each': 1, 'each_byte': 1, 'each_index': 1, 'each_key': 1, 'each_line': 1, 'each_pair': 1, 'each_value': 1, 'each_with_index': 1, 'empty?': 1, 'entries': 1, 'eof': 1, 'eof?': 1, 'eql?': 1, 'equal?': 1, 'eval': 1, 'exec': 1, 'exit': 1, 'exit!': 1, 'extend': 1, 'fail': 1, 'fcntl': 1, 'fetch': 1, 'fileno': 1, 'fill': 1, 'find': 1, 'find_all': 1, 'first': 1, 'flatten': 1, 'flatten!': 1, 'floor': 1, 'flush': 1, 'for_fd': 1, 'foreach': 1, 'fork': 1, 'format': 1, 'freeze': 1, 'frozen?': 1, 'fsync': 1, 'getc': 1, 'gets': 1, 'global_variables': 1, 'grep': 1, 'gsub': 1, 'gsub!': 1, 'has_key?': 1, 'has_value?': 1, 'hash': 1, 'hex': 1, 'id': 1, 'include': 1, 'include?': 1, 'included_modules': 1, 'index': 1, 'indexes': 1, 'indices': 1, 'induced_from': 1, 'inject': 1, 'insert': 1, 'inspect': 1, 'instance_eval': 1, 'instance_method': 1, 'instance_methods': 1, 'instance_of?': 1, 'instance_variable_defined?': 1, 'instance_variable_get': 1, 'instance_variable_set': 1, 'instance_variables': 1, 'integer?': 1, 'intern': 1, 'invert': 1, 'ioctl': 1, 'is_a?': 1, 'isatty': 1, 'iterator?': 1, 'join': 1, 'key?': 1, 'keys': 1, 'kind_of?': 1, 'lambda': 1, 'last': 1, 'length': 1, 'lineno': 1, 'ljust': 1, 'load': 1, 'local_variables': 1, 'loop': 1, 'lstrip': 1, 'lstrip!': 1, 'map': 1, 'map!': 1, 'match': 1, 'max': 1, 'member?': 1, 'merge': 1, 'merge!': 1, 'method': 1, 'method_defined?': 1, 'method_missing': 1, 'methods': 1, 'min': 1, 'module_eval': 1, 'modulo': 1, 'name': 1, 'nesting': 1, 'new': 1, 'next': 1, 'next!': 1, 'nil?': 1, 'nitems': 1, 'nonzero?': 1, 'object_id': 1, 'oct': 1, 'open': 1, 'pack': 1, 'partition': 1, 'pid': 1, 'pipe': 1, 'pop': 1, 'popen': 1, 'pos': 1, 'prec': 1, 'prec_f': 1, 'prec_i': 1, 'print': 1, 'printf': 1, 'private_class_method': 1, 'private_instance_methods': 1, 'private_method_defined?': 1, 'private_methods': 1, 'proc': 1, 'protected_instance_methods': 1, 'protected_method_defined?': 1, 'protected_methods': 1, 'public_class_method': 1, 'public_instance_methods': 1, 'public_method_defined?': 1, 'public_methods': 1, 'push': 1, 'putc': 1, 'puts': 1, 'quo': 1, 'raise': 1, 'rand': 1, 'rassoc': 1, 'read': 1, 'read_nonblock': 1, 'readchar': 1, 'readline': 1, 'readlines': 1, 'readpartial': 1, 'rehash': 1, 'reject': 1, 'reject!': 1, 'remainder': 1, 'reopen': 1, 'replace': 1, 'require': 1, 'respond_to?': 1, 'reverse': 1, 'reverse!': 1, 'reverse_each': 1, 'rewind': 1, 'rindex': 1, 'rjust': 1, 'round': 1, 'rstrip': 1, 'rstrip!': 1, 'scan': 1, 'seek': 1, 'select': 1, 'send': 1, 'set_trace_func': 1, 'shift': 1, 'singleton_method_added': 1, 'singleton_methods': 1, 'size': 1, 'sleep': 1, 'slice': 1, 'slice!': 1, 'sort': 1, 'sort!': 1, 'sort_by': 1, 'split': 1, 'sprintf': 1, 'squeeze': 1, 'squeeze!': 1, 'srand': 1, 'stat': 1, 'step': 1, 'store': 1, 'strip': 1, 'strip!': 1, 'sub': 1, 'sub!': 1, 'succ': 1, 'succ!': 1, 'sum': 1, 'superclass': 1, 'swapcase': 1, 'swapcase!': 1, 'sync': 1, 'syscall': 1, 'sysopen': 1, 'sysread': 1, 'sysseek': 1, 'system': 1, 'syswrite': 1, 'taint': 1, 'tainted?': 1, 'tell': 1, 'test': 1, 'throw': 1, 'times': 1, 'to_a': 1, 'to_ary': 1, 'to_f': 1, 'to_hash': 1, 'to_i': 1, 'to_int': 1, 'to_io': 1, 'to_proc': 1, 'to_s': 1, 'to_str': 1, 'to_sym': 1, 'tr': 1, 'tr!': 1, 'tr_s': 1, 'tr_s!': 1, 'trace_var': 1, 'transpose': 1, 'trap': 1, 'truncate': 1, 'tty?': 1, 'type': 1, 'ungetc': 1, 'uniq': 1, 'uniq!': 1, 'unpack': 1, 'unshift': 1, 'untaint': 1, 'untrace_var': 1, 'upcase': 1, 'upcase!': 1, 'update': 1, 'upto': 1, 'value?': 1, 'values': 1, 'values_at': 1, 'warn': 1, 'write': 1, 'write_nonblock': 1, 'zero?': 1, 'zip': 1}
  };
  var YARDOCTAG = {
    className: 'yardoctag',
    begin: '@[A-Za-z]+'
  };
  var COMMENT1 = {
    className: 'comment',
    begin: '#', end: '$',
    contains: [YARDOCTAG]
  };
  var COMMENT2 = {
    className: 'comment',
    begin: '^\\=begin', end: '^\\=end',
    contains: [YARDOCTAG],
    relevance: 10
  };
  var COMMENT3 = {
    className: 'comment',
    begin: '^__END__', end: '\\n$'
  };
  var SUBST = {
    className: 'subst',
    begin: '#\\{', end: '}',
    lexems: RUBY_IDENT_RE,
    keywords: RUBY_KEYWORDS
  };
  var STR_CONTAINS = [hljs.BACKSLASH_ESCAPE, SUBST];
  var STR1 = {
    className: 'string',
    begin: '\'', end: '\'',
    contains: STR_CONTAINS,
    relevance: 0
  };
  var STR2 = {
    className: 'string',
    begin: '"', end: '"',
    contains: STR_CONTAINS,
    relevance: 0
  };
  var STR3 = {
    className: 'string',
    begin: '%[qw]?\\(', end: '\\)',
    contains: STR_CONTAINS,
    relevance: 10
  };
  var STR4 = {
    className: 'string',
    begin: '%[qw]?\\[', end: '\\]',
    contains: STR_CONTAINS,
    relevance: 10
  };
  var STR5 = {
    className: 'string',
    begin: '%[qw]?{', end: '}',
    contains: STR_CONTAINS,
    relevance: 10
  };
  var STR6 = {
    className: 'string',
    begin: '%[qw]?<', end: '>',
    contains: STR_CONTAINS,
    relevance: 10
  };
  var STR7 = {
    className: 'string',
    begin: '%[qw]?/', end: '/',
    contains: STR_CONTAINS,
    relevance: 10
  };
  var STR8 = {
    className: 'string',
    begin: '%[qw]?%', end: '%',
    contains: STR_CONTAINS,
    relevance: 10
  };
  var STR9 = {
    className: 'string',
    begin: '%[qw]?-', end: '-',
    contains: STR_CONTAINS,
    relevance: 10
  };
  var STR10 = {
    className: 'string',
    begin: '%[qw]?\\|', end: '\\|',
    contains: STR_CONTAINS,
    relevance: 10
  };
  var FUNCTION = {
    className: 'function',
    begin: '\\bdef\\s+', end: ' |$|;',
    lexems: RUBY_IDENT_RE,
    keywords: RUBY_KEYWORDS,
    contains: [
      {
        className: 'title',
        begin: RUBY_METHOD_RE,
        lexems: RUBY_IDENT_RE,
        keywords: RUBY_KEYWORDS
      },
      {
        className: 'params',
        begin: '\\(', end: '\\)',
        lexems: RUBY_IDENT_RE,
        keywords: RUBY_KEYWORDS
      },
      COMMENT1, COMMENT2, COMMENT3
    ]
  };
  var IDENTIFIER = {
    className: 'identifier',
    begin: RUBY_IDENT_RE,
    lexems: RUBY_IDENT_RE,
    keywords: RUBY_KEYWORDS,
    relevance: 0
  };

  var RUBY_DEFAULT_CONTAINS = [
    COMMENT1, COMMENT2, COMMENT3,
    STR1, STR2, STR3, STR4, STR5, STR6, STR7, STR8, STR9, STR10,
    {
      className: 'class',
      begin: '\\b(class|module)\\b', end: '$|;',
      keywords: {'class': 1, 'module': 1},
      contains: [
        {
          className: 'title',
          begin: '[A-Za-z_]\\w*(::\\w+)*(\\?|\\!)?',
          relevance: 0
        },
        {
          className: 'inheritance',
          begin: '<\\s*',
          contains: [{
            className: 'parent',
            begin: '(' + hljs.IDENT_RE + '::)?' + hljs.IDENT_RE
          }]
        },
        COMMENT1, COMMENT2, COMMENT3
      ]
    },
    FUNCTION,
    {
      className: 'constant',
      begin: '(::)?([A-Z]\\w*(::)?)+',
      relevance: 0
    },
    {
      className: 'symbol',
      begin: ':',
      contains: [STR1, STR2, STR3, STR4, STR5, STR6, STR7, STR8, STR9, STR10, IDENTIFIER],
      relevance: 0
    },
    {
      className: 'number',
      begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
      relevance: 0
    },
    {
      className: 'number',
      begin: '\\?\\w'
    },
    {
      className: 'variable',
      begin: '(\\$\\W)|((\\$|\\@\\@?)(\\w+))'
    },
    IDENTIFIER,
    { // regexp container
      begin: '(' + hljs.RE_STARTERS_RE + ')\\s*',
      contains: [
        COMMENT1, COMMENT2, COMMENT3,
        {
          className: 'regexp',
          begin: '/', end: '/[a-z]*',
          illegal: '\\n',
          contains: [hljs.BACKSLASH_ESCAPE]
        }
      ],
      relevance: 0
    }
  ];
  SUBST.contains = RUBY_DEFAULT_CONTAINS;
  FUNCTION.contains[1].contains = RUBY_DEFAULT_CONTAINS;

  return {
    defaultMode: {
      lexems: RUBY_IDENT_RE,
      keywords: RUBY_KEYWORDS,
      contains: RUBY_DEFAULT_CONTAINS
    }
  };
}();
/*
Language: Scala
Author: Jan Berkel <jan.berkel@gmail.com>
*/

hljs.LANGUAGES.scala = function() {
  var ANNOTATION = {
    className: 'annotation', begin: '@[A-Za-z]+'
  };
  var STRING = {
    className: 'string',
    begin: 'u?r?"""', end: '"""',
    relevance: 10
  };
  return {
    defaultMode: {
      keywords: { 'type': 1, 'yield': 1, 'lazy': 1, 'override': 1, 'def': 1, 'with': 1, 'val':1, 'var': 1, 'false': 1, 'true': 1, 'sealed': 1, 'abstract': 1, 'private': 1, 'trait': 1,  'object': 1, 'null': 1, 'if': 1, 'for': 1, 'while': 1, 'throw': 1, 'finally': 1, 'protected': 1, 'extends': 1, 'import': 1, 'final': 1, 'return': 1, 'else': 1, 'break': 1, 'new': 1, 'catch': 1, 'super': 1, 'class': 1, 'case': 1,'package': 1, 'default': 1, 'try': 1, 'this': 1, 'match': 1, 'continue': 1, 'throws': 1},
      contains: [
        {
          className: 'javadoc',
          begin: '/\\*\\*', end: '\\*/',
          contains: [{
            className: 'javadoctag',
            begin: '@[A-Za-z]+'
          }],
          relevance: 10
        },
        hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE,
        hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, STRING,
        {
          className: 'class',
          begin: '((case )?class |object |trait )', end: '({|$)',
          illegal: ':',
          keywords: {'case' : 1, 'class': 1, 'trait': 1, 'object': 1},
          contains: [
            {
              begin: '(extends|with)',
              keywords: {'extends': 1, 'with': 1},
              relevance: 10
            },
            {
              className: 'title',
              begin: hljs.UNDERSCORE_IDENT_RE
            },
            {
              className: 'params',
              begin: '\\(', end: '\\)',
              contains: [
                hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, STRING,
                ANNOTATION
              ]
            }
          ]
        },
        hljs.C_NUMBER_MODE,
        ANNOTATION
      ]
    }
  };
}();
/*
Language: Smalltalk
Author: Vladimir Gubarkov <xonixx@gmail.com>
*/

hljs.LANGUAGES.smalltalk = function() {
  var VAR_IDENT_RE = '[a-z][a-zA-Z0-9_]*';
  var CHAR = {
    className: 'char',
    begin: '\\$.{1}'
  };
  var SYMBOL = {
    className: 'symbol',
    begin: '#' + hljs.UNDERSCORE_IDENT_RE
  };
  return {
    defaultMode: {
      keywords: {'self': 1, 'super': 1, 'nil': 1, 'true': 1, 'false': 1, 'thisContext': 1}, // only 6
      contains: [
        {
          className: 'comment',
          begin: '"', end: '"',
          relevance: 0
        },
        hljs.APOS_STRING_MODE,
        {
          className: 'class',
          begin: '\\b[A-Z][A-Za-z0-9_]*',
          relevance: 0
        },
        {
          className: 'method',
          begin: VAR_IDENT_RE + ':'
        },
        hljs.C_NUMBER_MODE,
        SYMBOL,
        CHAR,
        {
          className: 'localvars',
          begin: '\\|\\s*((' + VAR_IDENT_RE + ')\\s*)+\\|'
        },
        {
          className: 'array',
          begin: '\\#\\(', end: '\\)',
          contains: [
            hljs.APOS_STRING_MODE,
            CHAR,
            hljs.C_NUMBER_MODE,
            SYMBOL
          ]
        }
      ]
    }
  };
}();
/*
Language: SQL
*/

hljs.LANGUAGES.sql = {
  case_insensitive: true,
  defaultMode: {
    illegal: '[^\\s]',
    contains: [
      {
        className: 'operator',
        begin: '(begin|start|commit|rollback|savepoint|lock|alter|create|drop|rename|call|delete|do|handler|insert|load|replace|select|truncate|update|set|show|pragma)\\b', end: ';|$',
        keywords: {
          'keyword': {
            'all': 1, 'partial': 1, 'global': 1, 'month': 1,
            'current_timestamp': 1, 'using': 1, 'go': 1, 'revoke': 1,
            'smallint': 1, 'indicator': 1, 'end-exec': 1, 'disconnect': 1,
            'zone': 1, 'with': 1, 'character': 1, 'assertion': 1, 'to': 1,
            'add': 1, 'current_user': 1, 'usage': 1, 'input': 1, 'local': 1,
            'alter': 1, 'match': 1, 'collate': 1, 'real': 1, 'then': 1,
            'rollback': 1, 'get': 1, 'read': 1, 'timestamp': 1,
            'session_user': 1, 'not': 1, 'integer': 1, 'bit': 1, 'unique': 1,
            'day': 1, 'minute': 1, 'desc': 1, 'insert': 1, 'execute': 1,
            'like': 1, 'ilike': 2, 'level': 1, 'decimal': 1, 'drop': 1,
            'continue': 1, 'isolation': 1, 'found': 1, 'where': 1,
            'constraints': 1, 'domain': 1, 'right': 1, 'national': 1, 'some': 1,
            'module': 1, 'transaction': 1, 'relative': 1, 'second': 1,
            'connect': 1, 'escape': 1, 'close': 1, 'system_user': 1, 'for': 1,
            'deferred': 1, 'section': 1, 'cast': 1, 'current': 1, 'sqlstate': 1,
            'allocate': 1, 'intersect': 1, 'deallocate': 1, 'numeric': 1,
            'public': 1, 'preserve': 1, 'full': 1, 'goto': 1, 'initially': 1,
            'asc': 1, 'no': 1, 'key': 1, 'output': 1, 'collation': 1, 'group': 1,
            'by': 1, 'union': 1, 'session': 1, 'both': 1, 'last': 1,
            'language': 1, 'constraint': 1, 'column': 1, 'of': 1, 'space': 1,
            'foreign': 1, 'deferrable': 1, 'prior': 1, 'connection': 1,
            'unknown': 1, 'action': 1, 'commit': 1, 'view': 1, 'or': 1,
            'first': 1, 'into': 1, 'float': 1, 'year': 1, 'primary': 1,
            'cascaded': 1, 'except': 1, 'restrict': 1, 'set': 1, 'references': 1,
            'names': 1, 'table': 1, 'outer': 1, 'open': 1, 'select': 1,
            'size': 1, 'are': 1, 'rows': 1, 'from': 1, 'prepare': 1,
            'distinct': 1, 'leading': 1, 'create': 1, 'only': 1, 'next': 1,
            'inner': 1, 'authorization': 1, 'schema': 1, 'corresponding': 1,
            'option': 1, 'declare': 1, 'precision': 1, 'immediate': 1, 'else': 1,
            'timezone_minute': 1, 'external': 1, 'varying': 1, 'translation': 1,
            'true': 1, 'case': 1, 'exception': 1, 'join': 1, 'hour': 1,
            'default': 1, 'double': 1, 'scroll': 1, 'value': 1, 'cursor': 1,
            'descriptor': 1, 'values': 1, 'dec': 1, 'fetch': 1, 'procedure': 1,
            'delete': 1, 'and': 1, 'false': 1, 'int': 1, 'is': 1, 'describe': 1,
            'char': 1, 'as': 1, 'at': 1, 'in': 1, 'varchar': 1, 'null': 1,
            'trailing': 1, 'any': 1, 'absolute': 1, 'current_time': 1, 'end': 1,
            'grant': 1, 'privileges': 1, 'when': 1, 'cross': 1, 'check': 1,
            'write': 1, 'current_date': 1, 'pad': 1, 'begin': 1, 'temporary': 1,
            'exec': 1, 'time': 1, 'update': 1, 'catalog': 1, 'user': 1, 'sql': 1,
            'date': 1, 'on': 1, 'identity': 1, 'timezone_hour': 1, 'natural': 1,
            'whenever': 1, 'interval': 1, 'work': 1, 'order': 1, 'cascade': 1,
            'diagnostics': 1, 'nchar': 1, 'having': 1, 'left': 1, 'call': 1,
            'do': 1, 'handler': 1, 'load': 1, 'replace': 1, 'truncate': 1,
            'start': 1, 'lock': 1, 'show': 1, 'pragma': 1},
          'aggregate': {'count': 1, 'sum': 1, 'min': 1, 'max': 1, 'avg': 1}
        },
        contains: [
          {
            className: 'string',
            begin: '\'', end: '\'',
            contains: [hljs.BACKSLASH_ESCAPE, {begin: '\'\''}],
            relevance: 0
          },
          {
            className: 'string',
            begin: '"', end: '"',
            contains: [hljs.BACKSLASH_ESCAPE, {begin: '""'}],
            relevance: 0
          },
          {
            className: 'string',
            begin: '`', end: '`',
            contains: [hljs.BACKSLASH_ESCAPE]
          },
          hljs.C_NUMBER_MODE,
          {begin: '\\n'}
        ]
      },
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: 'comment',
        begin: '--', end: '$'
      }
    ]
  }
};
/*
   A A L        Source code at:
   T C A   <http://www.attacklab.net/>
   T K B
*/

var Showdown={};
Showdown.converter=function(){
var _1;
var _2;
var _3;
var _4=0;
this.makeHtml=function(_5){
_1=new Array();
_2=new Array();
_3=new Array();
_5=_5.replace(/~/g,"~T");
_5=_5.replace(/\$/g,"~D");
_5=_5.replace(/\r\n/g,"\n");
_5=_5.replace(/\r/g,"\n");
_5="\n\n"+_5+"\n\n";
_5=_6(_5);
_5=_5.replace(/^[ \t]+$/mg,"");
_5=_7(_5);
_5=_8(_5);
_5=_9(_5);
_5=_a(_5);
_5=_5.replace(/~D/g,"$$");
_5=_5.replace(/~T/g,"~");
return _5;
};
var _8=function(_b){
var _b=_b.replace(/^[ ]{0,3}\[(.+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|\Z)/gm,function(_c,m1,m2,m3,m4){
m1=m1.toLowerCase();
_1[m1]=_11(m2);
if(m3){
return m3+m4;
}else{
if(m4){
_2[m1]=m4.replace(/"/g,"&quot;");
}
}
return "";
});
return _b;
};
var _7=function(_12){
_12=_12.replace(/\n/g,"\n\n");
var _13="p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del";
var _14="p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math";
_12=_12.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)\b[^\r]*?\n<\/\2>[ \t]*(?=\n+))/gm,_15);
_12=_12.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math)\b[^\r]*?.*<\/\2>[ \t]*(?=\n+)\n)/gm,_15);
_12=_12.replace(/(\n[ ]{0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g,_15);
_12=_12.replace(/(\n\n[ ]{0,3}<!(--[^\r]*?--\s*)+>[ \t]*(?=\n{2,}))/g,_15);
_12=_12.replace(/(?:\n\n)([ ]{0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g,_15);
_12=_12.replace(/\n\n/g,"\n");
return _12;
};
var _15=function(_16,m1){
var _18=m1;
_18=_18.replace(/\n\n/g,"\n");
_18=_18.replace(/^\n/,"");
_18=_18.replace(/\n+$/g,"");
_18="\n\n~K"+(_3.push(_18)-1)+"K\n\n";
return _18;
};
var _9=function(_19){
_19=_1a(_19);
var key=_1c("<hr />");
_19=_19.replace(/^[ ]{0,2}([ ]?\*[ ]?){3,}[ \t]*$/gm,key);
_19=_19.replace(/^[ ]{0,2}([ ]?\-[ ]?){3,}[ \t]*$/gm,key);
_19=_19.replace(/^[ ]{0,2}([ ]?\_[ ]?){3,}[ \t]*$/gm,key);
_19=_1d(_19);
_19=_1e(_19);
_19=_1f(_19);
_19=_7(_19);
_19=_20(_19);
return _19;
};
var _21=function(_22){
_22=_23(_22);
_22=_24(_22);
_22=_25(_22);
_22=_26(_22);
_22=_27(_22);
_22=_28(_22);
_22=_11(_22);
_22=_29(_22);
_22=_22.replace(/  +\n/g," <br />\n");
return _22;
};
var _24=function(_2a){
var _2b=/(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--.*?--\s*)+>)/gi;
_2a=_2a.replace(_2b,function(_2c){
var tag=_2c.replace(/(.)<\/?code>(?=.)/g,"$1`");
tag=_2e(tag,"\\`*_");
return tag;
});
return _2a;
};
var _27=function(_2f){
_2f=_2f.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,_30);
_2f=_2f.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([ \t]*()<?(.*?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,_30);
_2f=_2f.replace(/(\[([^\[\]]+)\])()()()()()/g,_30);
return _2f;
};
var _30=function(_31,m1,m2,m3,m4,m5,m6,m7){
if(m7==undefined){
m7="";
}
var _39=m1;
var _3a=m2;
var _3b=m3.toLowerCase();
var url=m4;
var _3d=m7;
if(url==""){
if(_3b==""){
_3b=_3a.toLowerCase().replace(/ ?\n/g," ");
}
url="#"+_3b;
if(_1[_3b]!=undefined){
url=_1[_3b];
if(_2[_3b]!=undefined){
_3d=_2[_3b];
}
}else{
if(_39.search(/\(\s*\)$/m)>-1){
url="";
}else{
return _39;
}
}
}
url=_2e(url,"*_");
var _3e="<a href=\""+url+"\"";
if(_3d!=""){
_3d=_3d.replace(/"/g,"&quot;");
_3d=_2e(_3d,"*_");
_3e+=" title=\""+_3d+"\"";
}
_3e+=">"+_3a+"</a>";
return _3e;
};
var _26=function(_3f){
_3f=_3f.replace(/(!\[(.*?)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,_40);
_3f=_3f.replace(/(!\[(.*?)\]\s?\([ \t]*()<?(\S+?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,_40);
return _3f;
};
var _40=function(_41,m1,m2,m3,m4,m5,m6,m7){
var _49=m1;
var _4a=m2;
var _4b=m3.toLowerCase();
var url=m4;
var _4d=m7;
if(!_4d){
_4d="";
}
if(url==""){
if(_4b==""){
_4b=_4a.toLowerCase().replace(/ ?\n/g," ");
}
url="#"+_4b;
if(_1[_4b]!=undefined){
url=_1[_4b];
if(_2[_4b]!=undefined){
_4d=_2[_4b];
}
}else{
return _49;
}
}
_4a=_4a.replace(/"/g,"&quot;");
url=_2e(url,"*_");
var _4e="<img src=\""+url+"\" alt=\""+_4a+"\"";
_4d=_4d.replace(/"/g,"&quot;");
_4d=_2e(_4d,"*_");
_4e+=" title=\""+_4d+"\"";
_4e+=" />";
return _4e;
};
var _1a=function(_4f){
_4f=_4f.replace(/^(.+)[ \t]*\n=+[ \t]*\n+/gm,function(_50,m1){
return _1c("<h1>"+_21(m1)+"</h1>");
});
_4f=_4f.replace(/^(.+)[ \t]*\n-+[ \t]*\n+/gm,function(_52,m1){
return _1c("<h2>"+_21(m1)+"</h2>");
});
_4f=_4f.replace(/^(\#{1,6})[ \t]*(.+?)[ \t]*\#*\n+/gm,function(_54,m1,m2){
var _57=m1.length;
return _1c("<h"+_57+">"+_21(m2)+"</h"+_57+">");
});
return _4f;
};
var _58;
var _1d=function(_59){
_59+="~0";
var _5a=/^(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;
if(_4){
_59=_59.replace(_5a,function(_5b,m1,m2){
var _5e=m1;
var _5f=(m2.search(/[*+-]/g)>-1)?"ul":"ol";
_5e=_5e.replace(/\n{2,}/g,"\n\n\n");
var _60=_58(_5e);
_60=_60.replace(/\s+$/,"");
_60="<"+_5f+">"+_60+"</"+_5f+">\n";
return _60;
});
}else{
_5a=/(\n\n|^\n?)(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/g;
_59=_59.replace(_5a,function(_61,m1,m2,m3){
var _65=m1;
var _66=m2;
var _67=(m3.search(/[*+-]/g)>-1)?"ul":"ol";
var _66=_66.replace(/\n{2,}/g,"\n\n\n");
var _68=_58(_66);
_68=_65+"<"+_67+">\n"+_68+"</"+_67+">\n";
return _68;
});
}
_59=_59.replace(/~0/,"");
return _59;
};
_58=function(_69){
_4++;
_69=_69.replace(/\n{2,}$/,"\n");
_69+="~0";
_69=_69.replace(/(\n)?(^[ \t]*)([*+-]|\d+[.])[ \t]+([^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[ \t]+))/gm,function(_6a,m1,m2,m3,m4){
var _6f=m4;
var _70=m1;
var _71=m2;
if(_70||(_6f.search(/\n{2,}/)>-1)){
_6f=_9(_72(_6f));
}else{
_6f=_1d(_72(_6f));
_6f=_6f.replace(/\n$/,"");
_6f=_21(_6f);
}
return "<li>"+_6f+"</li>\n";
});
_69=_69.replace(/~0/g,"");
_4--;
return _69;
};
var _1e=function(_73){
_73+="~0";
_73=_73.replace(/(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g,function(_74,m1,m2){
var _77=m1;
var _78=m2;
_77=_79(_72(_77));
_77=_6(_77);
_77=_77.replace(/^\n+/g,"");
_77=_77.replace(/\n+$/g,"");
_77="<pre><code>"+_77+"\n</code></pre>";
return _1c(_77)+_78;
});
_73=_73.replace(/~0/,"");
return _73;
};
var _1c=function(_7a){
_7a=_7a.replace(/(^\n+|\n+$)/g,"");
return "\n\n~K"+(_3.push(_7a)-1)+"K\n\n";
};
var _23=function(_7b){
_7b=_7b.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,function(_7c,m1,m2,m3,m4){
var c=m3;
c=c.replace(/^([ \t]*)/g,"");
c=c.replace(/[ \t]*$/g,"");
c=_79(c);
return m1+"<code>"+c+"</code>";
});
return _7b;
};
var _79=function(_82){
_82=_82.replace(/&/g,"&amp;");
_82=_82.replace(/</g,"&lt;");
_82=_82.replace(/>/g,"&gt;");
_82=_2e(_82,"*_{}[]\\",false);
return _82;
};
var _29=function(_83){
_83=_83.replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g,"<strong>$2</strong>");
_83=_83.replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g,"<em>$2</em>");
return _83;
};
var _1f=function(_84){
_84=_84.replace(/((^[ \t]*>[ \t]?.+\n(.+\n)*\n*)+)/gm,function(_85,m1){
var bq=m1;
bq=bq.replace(/^[ \t]*>[ \t]?/gm,"~0");
bq=bq.replace(/~0/g,"");
bq=bq.replace(/^[ \t]+$/gm,"");
bq=_9(bq);
bq=bq.replace(/(^|\n)/g,"$1  ");
bq=bq.replace(/(\s*<pre>[^\r]+?<\/pre>)/gm,function(_88,m1){
var pre=m1;
pre=pre.replace(/^  /mg,"~0");
pre=pre.replace(/~0/g,"");
return pre;
});
return _1c("<blockquote>\n"+bq+"\n</blockquote>");
});
return _84;
};
var _20=function(_8b){
_8b=_8b.replace(/^\n+/g,"");
_8b=_8b.replace(/\n+$/g,"");
var _8c=_8b.split(/\n{2,}/g);
var _8d=new Array();
var end=_8c.length;
for(var i=0;i<end;i++){
var str=_8c[i];
if(str.search(/~K(\d+)K/g)>=0){
_8d.push(str);
}else{
if(str.search(/\S/)>=0){
str=_21(str);
str=str.replace(/^([ \t]*)/g,"<p>");
str+="</p>";
_8d.push(str);
}
}
}
end=_8d.length;
for(var i=0;i<end;i++){
while(_8d[i].search(/~K(\d+)K/)>=0){
var _91=_3[RegExp.$1];
_91=_91.replace(/\$/g,"$$$$");
_8d[i]=_8d[i].replace(/~K\d+K/,_91);
}
}
return _8d.join("\n\n");
};
var _11=function(_92){
_92=_92.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g,"&amp;");
_92=_92.replace(/<(?![a-z\/?\$!])/gi,"&lt;");
return _92;
};
var _25=function(_93){
_93=_93.replace(/\\(\\)/g,_94);
_93=_93.replace(/\\([`*_{}\[\]()>#+-.!])/g,_94);
return _93;
};
var _28=function(_95){
_95=_95.replace(/<((https?|ftp|dict):[^'">\s]+)>/gi,"<a href=\"$1\">$1</a>");
_95=_95.replace(/<(?:mailto:)?([-.\w]+\@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi,function(_96,m1){
return _98(_a(m1));
});
return _95;
};
var _98=function(_99){
function char2hex(ch){
var _9b="0123456789ABCDEF";
var dec=ch.charCodeAt(0);
return (_9b.charAt(dec>>4)+_9b.charAt(dec&15));
}
var _9d=[function(ch){
return "&#"+ch.charCodeAt(0)+";";
},function(ch){
return "&#x"+char2hex(ch)+";";
},function(ch){
return ch;
}];
_99="mailto:"+_99;
_99=_99.replace(/./g,function(ch){
if(ch=="@"){
ch=_9d[Math.floor(Math.random()*2)](ch);
}else{
if(ch!=":"){
var r=Math.random();
ch=(r>0.9?_9d[2](ch):r>0.45?_9d[1](ch):_9d[0](ch));
}
}
return ch;
});
_99="<a href=\""+_99+"\">"+_99+"</a>";
_99=_99.replace(/">.+:/g,"\">");
return _99;
};
var _a=function(_a3){
_a3=_a3.replace(/~E(\d+)E/g,function(_a4,m1){
var _a6=parseInt(m1);
return String.fromCharCode(_a6);
});
return _a3;
};
var _72=function(_a7){
_a7=_a7.replace(/^(\t|[ ]{1,4})/gm,"~0");
_a7=_a7.replace(/~0/g,"");
return _a7;
};
var _6=function(_a8){
_a8=_a8.replace(/\t(?=\t)/g,"    ");
_a8=_a8.replace(/\t/g,"~A~B");
_a8=_a8.replace(/~B(.+?)~A/g,function(_a9,m1,m2){
var _ac=m1;
var _ad=4-_ac.length%4;
for(var i=0;i<_ad;i++){
_ac+=" ";
}
return _ac;
});
_a8=_a8.replace(/~A/g,"    ");
_a8=_a8.replace(/~B/g,"");
return _a8;
};
var _2e=function(_af,_b0,_b1){
var _b2="(["+_b0.replace(/([\[\]\\])/g,"\\$1")+"])";
if(_b1){
_b2="\\\\"+_b2;
}
var _b3=new RegExp(_b2,"g");
_af=_af.replace(_b3,_94);
return _af;
};
var _94=function(_b4,m1){
var _b6=m1.charCodeAt(0);
return "~E"+_b6+"E";
};
};
if(typeof exports!='undefined')exports.Showdown=Showdown;(function() {
  var Base64;

  window.DocumentUp = (function() {

    function DocumentUp() {}

    DocumentUp.template = function(locals) {
      return "<div id=\"nav\">\n  <div id=\"header\">\n    <a href=\"#\" id=\"logo\">" + locals.name + "</a>\n  </div>\n  <ul id=\"sections\">\n  </ul>\n</div>\n<div id=\"content\">\n  <div id=\"loader\">\n    Loading documentation...\n  </div>\n</div>";
    };

    DocumentUp.defaults = {
      color: "#369",
      twitter: null,
      issues: true,
      travis: false,
      ribbon: true
    };

    DocumentUp.document = function(options) {
      var key, repo, value, _base, _ref,
        _this = this;
      this.options = options;
      if ("string" === typeof this.options) {
        repo = this.options;
        this.options = {
          repo: repo
        };
      }
      if (!this.options || !this.options.repo || !/\//.test(this.options.repo)) {
        throw new Error("Repository required with format: username/repository");
      }
      _ref = this.defaults;
      for (key in _ref) {
        value = _ref[key];
        if (this.options[key] === void 0) this.options[key] = value;
      }
      (_base = this.options).name || (_base.name = this.options.repo.replace(/.+\//, ""));
      $.domReady(function() {
        var $nav, append_to_head, extra, head_node, iframe, twitter, _i, _len, _ref2, _results;
        if (window.navigator && /(iphone|ipad)/i.test(window.navigator.userAgent)) {
          window.scrollTo(0, 1);
        }
        head_node = document.getElementsByTagName("head")[0];
        append_to_head = function(options) {
          var el, option, subOption, val, value, _results;
          el = document.createElement(options.tagName);
          head_node.appendChild(el);
          if (options.tagName === "style" && el.styleSheet) {
            options.styleSheet = {};
            options.styleSheet.cssText = options.innerHTML;
            delete options.innerHTML;
          }
          delete options.tagName;
          _results = [];
          for (option in options) {
            value = options[option];
            if (typeof value !== "string") {
              _results.push((function() {
                var _results2;
                _results2 = [];
                for (subOption in value) {
                  val = value[subOption];
                  _results2.push(el[option][subOption] = val);
                }
                return _results2;
              })());
            } else {
              _results.push(el[option] = value);
            }
          }
          return _results;
        };
        if (window.navigator && /MSIE (6|7|8)/i.test(window.navigator.userAgent)) {
          append_to_head({
            tagName: "style",
            type: "text/css",
            innerHTML: "#nav {border-right: 1px solid #ccc};"
          });
        }
        append_to_head({
          tagName: "style",
          type: "text/css",
          innerHTML: "a {color: " + _this.options.color + "}"
        });
        document.title = _this.options.name;
        $("body").html(_this.template(_this.options));
        $nav = $("#nav");
        $nav.append("<div id=\"github\" class=\"extra\">\n  <a href=\"https://github.com/" + _this.options.repo + "\">Source on Github</a>\n</div>");
        if (_this.options.issues) {
          $nav.append("<div id=\"github-issues\" class=\"extra\">\n  <a href=\"https://github.com/" + _this.options.repo + "/issues\">Issues</a>\n</div>");
        }
        if (_this.options.travis) {
          $nav.append("<div id=\"travis\" class=\"extra\">\n  <a href=\"http://travis-ci.org/" + _this.options.repo + "\">\n    <img src=\"https://secure.travis-ci.org/" + _this.options.repo + ".png\">\n  </a>\n</div>");
        }
        if (_this.options.twitter) {
          if (!(_this.options.twitter instanceof Array)) {
            _this.options.twitter = [_this.options.twitter];
          }
          _ref2 = _this.options.twitter;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            twitter = _ref2[_i];
            twitter = twitter.replace("@", "");
            extra = $("<div class='extra twitter'>");
            iframe = $('<iframe allowtransparency="true" frameborder="0" scrolling="no" style="width:162px; height:20px;">');
            iframe.attr("src", "https://platform.twitter.com/widgets/follow_button.html?screen_name=" + twitter + "&show_count=false");
            extra.append(iframe);
            _results.push($nav.append(extra));
          }
          return _results;
        }
      });
      return this.getReadme(function(err, html) {
        _this.html = html;
        if (err) throw err;
        return $.domReady(function() {
          return _this.renderContent();
        });
      });
    };

    DocumentUp.getReadme = function(callback) {
      var html, using_cache,
        _this = this;
      using_cache = false;
      if (html = localStorage.getItem(this.options.repo + ":cached_content")) {
        callback(null, html);
        this.usingCache = true;
      }
      return $.ajax({
        url: "https://api.github.com/repos/" + this.options.repo + "/git/trees/master?callback=?",
        type: "jsonp",
        success: function(resp) {
          var last_sha, obj, readme_sha, _i, _len, _ref;
          _ref = resp.data.tree;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            obj = _ref[_i];
            if (/readme/i.test(obj.path)) readme_sha = obj.sha;
          }
          last_sha = localStorage.getItem(_this.options.repo + ":readme_sha");
          if (readme_sha !== last_sha) {
            return $.ajax({
              url: "https://api.github.com/repos/" + _this.options.repo + "/git/blobs/" + readme_sha + "?callback=?",
              type: "jsonp",
              success: function(resp) {
                var converter;
                converter = new Showdown.converter();
                html = converter.makeHtml(Base64.decode(resp.data.content));
                localStorage.setItem(_this.options.repo + ":cached_content", html);
                localStorage.setItem(_this.options.repo + ":readme_sha", readme_sha);
                if (!_this.usingCache) return callback(null, html);
                return $.domReady(function() {
                  var refresh_link,
                    _this = this;
                  refresh_link = $("<a id='refresh' href='#'>There's a new version of the documentation<br>Click here or refresh to see it.</a>");
                  $("body").append(refresh_link);
                  return refresh_link.bind("click", function(event) {
                    event.preventDefault();
                    callback(null, html);
                    return refresh_link.remove();
                  });
                });
              }
            });
          }
        }
      });
    };

    DocumentUp.renderContent = function() {
      var $content, $sections, current_section, current_subsection;
      $content = $("#content");
      $content.html(this.html);
      if (this.options.ribbon) {
        $("#content").prepend("<a href=\"http://github.com/" + this.options.repo + "\" id=\"github-ribbon\"><img src=\"https://a248.e.akamai.net/assets.github.com/img/7afbc8b248c68eb468279e8c17986ad46549fb71/687474703a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f6461726b626c75655f3132313632312e706e67\" alt=\"Fork me on GitHub\"></a>");
      }
      current_section = 0;
      current_subsection = 0;
      $sections = $("#sections");
      $sections.empty();
      $("h2, h3").each(function(el) {
        var $subsection, section_id;
        if (el.tagName === "H2") {
          current_subsection = 0;
          current_section++;
          el.id = section_id = "section-" + current_section;
          return $sections.append("<li id=\"for-" + section_id + "\">\n  <a href=\"#" + section_id + "\">" + (el.innerText || el.textContent) + "</a>\n</li>");
        } else if (el.tagName === "H3") {
          current_subsection++;
          el.id = section_id = "section-" + current_section + "-" + current_subsection;
          $subsection = $("#for-section-" + current_section + " ul");
          if (!$subsection.length) {
            $("#for-section-" + current_section).append("<ul></ul>");
            $subsection = $("#for-section-" + current_section + " ul");
          }
          return $subsection.append("<li id=\"for-" + section_id + "\">\n  <a href=\"#" + section_id + "\">" + (el.innerText || el.textContent) + "</a>\n</li>");
        }
      });
      return $("pre code").each(function(el) {
        return hljs.highlightBlock(el, "  ");
      });
    };

    return DocumentUp;

  })();

  Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(input) {
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4, i, output;
      output = "";
      chr1 = void 0;
      chr2 = void 0;
      chr3 = void 0;
      enc1 = void 0;
      enc2 = void 0;
      enc3 = void 0;
      enc4 = void 0;
      i = 0;
      input = Base64._utf8_encode(input);
      while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else {
          if (isNaN(chr3)) enc4 = 64;
        }
        output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
      }
      return output;
    },
    decode: function(input) {
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4, i, output;
      output = "";
      chr1 = void 0;
      chr2 = void 0;
      chr3 = void 0;
      enc1 = void 0;
      enc2 = void 0;
      enc3 = void 0;
      enc4 = void 0;
      i = 0;
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      while (i < input.length) {
        enc1 = this._keyStr.indexOf(input.charAt(i++));
        enc2 = this._keyStr.indexOf(input.charAt(i++));
        enc3 = this._keyStr.indexOf(input.charAt(i++));
        enc4 = this._keyStr.indexOf(input.charAt(i++));
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
        output = output + String.fromCharCode(chr1);
        if (enc3 !== 64) output = output + String.fromCharCode(chr2);
        if (enc4 !== 64) output = output + String.fromCharCode(chr3);
      }
      output = Base64._utf8_decode(output);
      return output;
    },
    _utf8_encode: function(string) {
      var c, n, utftext;
      string = string.replace(/\r\n/g, "\n");
      utftext = "";
      n = 0;
      while (n < string.length) {
        c = string.charCodeAt(n);
        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
        n++;
      }
      return utftext;
    },
    _utf8_decode: function(utftext) {
      var c, c1, c2, c3, i, string;
      string = "";
      i = 0;
      c = c1 = c2 = 0;
      while (i < utftext.length) {
        c = utftext.charCodeAt(i);
        if (c < 128) {
          string += String.fromCharCode(c);
          i++;
        } else if ((c > 191) && (c < 224)) {
          c2 = utftext.charCodeAt(i + 1);
          string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
          i += 2;
        } else {
          c2 = utftext.charCodeAt(i + 1);
          c3 = utftext.charCodeAt(i + 2);
          string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          i += 3;
        }
      }
      return string;
    }
  };

}).call(this);
var compiled_css = document.createTextNode('html,body,div,span,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,code,del,dfn,em,img,q,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td{margin:0;padding:0;border:0;font-weight:inherit;font-style:inherit;font-size:100%;font-family:inherit;vertical-align:baseline}table{border-collapse:separate;border-spacing:0}caption,th,td{text-align:left;font-weight:normal}table,td,th{vertical-align:middle}blockquote:before,blockquote:after,q:before,q:after{content:""}blockquote,q{quotes:"" ""}a img{border:none}body{margin:10px}pre code{display:block;padding:.5em;color:#000;background:#f8f8ff;padding:20px;border:1px solid #ccc;overflow-y:auto}pre .comment,pre .template_comment,pre .diff .header,pre .javadoc{color:#998;font-style:italic}pre .keyword,pre .css .rule .keyword,pre .winutils,pre .javascript .title,pre .lisp .title,pre .subst{color:#000;font-weight:bold}pre .number,pre .hexcolor{color:#40a070}pre .string,pre .tag .value,pre .phpdoc,pre .tex .formula{color:#d14}pre .title,pre .id{color:#900;font-weight:bold}pre .javascript .title,pre .lisp .title,pre .subst{font-weight:normal}pre .class .title,pre .haskell .label,pre .tex .command{color:#458;font-weight:bold}pre .tag,pre .tag .title,pre .rules .property,pre .django .tag .keyword{color:#000080;font-weight:normal}pre .attribute,pre .variable,pre .instancevar,pre .lisp .body{color:#008080}pre .regexp{color:#009926}pre .class{color:#458;font-weight:bold}pre .symbol,pre .ruby .symbol .string,pre .ruby .symbol .keyword,pre .ruby .symbol .keymethods,pre .lisp .keyword,pre .tex .special,pre .input_number{color:#990073}pre .builtin,pre .built_in,pre .lisp .title{color:#0086b3}pre .preprocessor,pre .pi,pre .doctype,pre .shebang,pre .cdata{color:#999;font-weight:bold}pre .deletion{background:#fdd}pre .addition{background:#dfd}pre .diff .change{background:#0086b3}pre .chunk{color:#aaa}pre .tex .formula{opacity:.5;filter:progid:DXImageTransform.Microsoft.Alpha(Opacity=50)}@font-face{font-family:"Droid Sans Mono";src:url("data:font/woff;charset=utf-8;base64,d09GRgABAAAAAD1QABAAAAAAX8wAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABGRlRNAAABbAAAABsAAAAcWnAAikdERUYAAAGIAAAAHQAAACAAtgAET1MvMgAAAagAAABfAAAAYJ+IkIZjbWFwAAACCAAAASIAAAHSn1IGaWN2dCAAAAMsAAAAQgAAAEIQug3HZnBnbQAAA3AAAAGxAAACZQ+0L6dnYXNwAAAFJAAAAAwAAAAMAAMAB2dseWYAAAUwAAAzBwAAUcjO6TWtaGVhZAAAODgAAAAxAAAANvZvmN5oaGVhAAA4bAAAACAAAAAkDDsEtGhtdHgAADiMAAABIAAAAh5fQlF/bG9jYQAAOawAAAEDAAABFLRJyd5tYXhwAAA6sAAAACAAAAAgAaYBlG5hbWUAADrQAAABCAAAAeophUSucG9zdAAAO9gAAAE3AAAB9Gweq4dwcmVwAAA9EAAAAEAAAABAXsu7eXjaY2BgYGQAguP/NtwH0Sctll+B0tcAXYgIUAB42mNgZGBg4ANiCQYQYGJgBMIOIGYB8xgACiIAuwAAAHjaY2Bm6WacwMDKwMI6i9WYgYFRHkIzX2RIY/zEwMDEzcbJzMHCxMTygIFpvQODQjQDA4MGEDMYOgY7MwAFfrOwyf0TYWhmz2V8osDAMB8kx+LFug1IKTAwAgDE6Q8xAHjaY2BgYGaAYBkGRgYQOAPkMYL5LAwbgLQGgwKQxcFQx7CAYTHDUoaVDOsYtihwKYgoSCrIKigpqCnoK8QrrFFUesDwm+X/f6AOBaDKRWCVa4EqGRQEFCQUZNBUMv7////x/0P/D/4/8H/v/13/tz7IepD6IOlBwoOYB5EPAh8o3b92P1GhhbUF6iqiACMbA1w5IxOQYEJXAPQqCysbOwcnFzcPLx+/gKCQsIiomLiEpJS0jKycvIKikrKKqpq6hqaWto6unr6BoZGxiamZuYWllbWNrZ29g6OTs4urm7uHp5e3j6+ff0BgUHBIaFh4RGRUdExsXHxCIhGuTE4BhiVDRlpzJkwkFZuy+iQwVVFZU1tVDWY2MTC0thEyHQBoIU4nAAD+FAAABEoFtgYUAKQAugCNAJEAqgCcAJgAiQCPALQAqACAAJoArQCHAIsAoQCyAIIApgCvAJ4AeQCEAJMAlQBoAF0AAHjaXVG7TltBEN0NDwOBxNggOdoUs5mQAu+FNkggri7CyHZjOULajVzkYlzAB1AgUYP2awZoKFOkTYOQCyQ+gU+IlJk1iaI0Ozuzc86ZM0vKkap3ab3nqXMWSOFug2abfiek2kWAB9L1jUZG2sEjLTYzeuW6fb+PwWY05U4aQHnPW8pDRtNOoBbtuX8yP4PhPv/LPAeDlmaanlpnIT2EwHwzbmnwNaNZd/1BX7E6XA0GhhTTVNz1x1TK/5bmXG0ZtjYzmndwISI/mAZoaq2NQNOfOqR6Po5iCXL5bKwNJqasP8lEcGEyXdVULTO+dnCf7Cw62KRKc+ABDrBVnoKH46MJhfQtiTJLQ4SD2CoxQsQkh0JOOXeyPylQPpKEMW+S0s64Ya2BceQ1MKjN0xy+zGZT21uHMH4RR/DdL8aSDj6yoTZGhNiOWApgApGQUVW+ocZzL4sBudT+MxAlYHn67V8nAq07NhEvZW2dY4wVgp7fNt/5ZcXdqlznRaG7d1U1VOmU5kMvZ9/jEU+PheGgseDN531/o0DtDYsbDZoDwZDejd7/0Vp1xFXeCx/ZbzWzsRYAAAAAAAACAAQAAv//AAN42sV8e3xUV73vWvs178ne88zkQTIZkoGmZMgMIR0oj1KKGBE5kZODfBAjIlJqRYocRMQc5HJiipRSHkWKNFI+HA5ycO/JmGJKaSgiImIPInCRg1wOUqTFyqm92EBmc3+/tfYMoaVeP/f8cUuTmb33ZO/1e6zf7/v7/tYaIpBDhEhOuZuIxEYeJhmRktqsJBO/VJuBc7VZG3tPdXtCF89kJYVoUq0uqYZMa7MCOzIctJYMr/dHtWgj/BwSP97/8nxhWa5d7r7VNF96k8B/Ar1657JwxXrO50lGgnvrJJEVZFJk3Z6eyYoKicDt5aQuqvisanxWAg8ov0ITXYoo2WFYfCC2RFa5OwhDEjSfrqSH10tqUhVTYoxeNf94MbWsnIbNa/Kp23/gYykXd4m6NZbxhMmpS6msKBM73FNJ5qUF+eJwQlANG0irsCN8kGGD5xhUSqdBboqPwZ/yPw59ga6AX3J37oag5m7gs8gw0G8nPKuUVNBPkkwJ6DcTDEVSqVTGDs/N2FxueJ8tFUrsntqMVlbOjmTyIBggEC5OJpNZRWTX1EEVeE3h1xxOD1yjemXCiNJafWRJz9j/+PNNEqx16iV1ur1OL1GNiK1Pt8PgbX09Y0/8eS+7GKrT3XV6SDWC9j7drRoueClRu4QSm7+2S2S/FfytR9QuR8QOb0JqlzPkgjdBtcsTdMMHVPZbY78D+Bs/E2afgb8qZn8F9yzN36csf59y/EzXoPwnK/C8OL5YEBWb3eF0uT2qFgiGwsWRktKy8kEVdR/xnz6+BB2uIeWPNUT9KRF/UsEY/ETFmB9/GqP+6LD3HrlGheYNzbR6+rPTL7w//oZ5s3njdPN3zc9O3Udj480LdG8HndxBdXMa/nSY+zvM6XQv/sB58IruOx1SQPGRClJDask6og9K6KUpQ5Sv6fFkZpDorO0aP6jcUasHEnp1yiiC8+5kpiiA54s8DnDrBxO6/YxRqVzTK1WjnNZmRPdgNGmZQsrAiN5AHI70MtUYCl4VUa4Zw/B1KHiXTwPvMsRB4NAkrQe0H1PJFxxcOzic1ot8ugY+3tgQSmk18ZrGEY0jGxtSoDdbTVwLhUM2VQ7GGqr8gXAorCl0ZMOIePeR3UeaptJZM3d1dG+dsK7t6LRmam7p+P1DQ4fO3Esb9u/fu3cWzUz41PTvrGqZHsrq9knrxznMmROnNa80r45884LYNWVYbQVdVNo/s2xb21giE3LnHemEfJR4SYiUkKGknpwlmTB4t16SytRgFHlQJpUgYwRnV3GKzfhskJ3LDq+okTzwwo80FzvS2BHVkwmdnMkW8blXpBp+yqY7HtlUoxSOHuBHD6hGHRxV8XmZ4rMgPenyIubo4To9UqeHVaMEZkFENYptfWIXupblQYa/CHQrpY26B0DdFTWo7uEPwtuq0nTaCGrwzkbSoGcN9JtKhoIBm2KrAnUHwsmGEbEqP0056N1LsQGXpk3tWNU5dVrHqmnTtqxds2atTzi3PReno/n55vb8eenJnbNm/uQHu2bOop9r3X6FvnnpVgaDJm2C8/t37Jw5ezY/Db445s516bh8gpSRapIifSQTQl0HU5kIvBpR+VrGAQo2hsvXqD4CNWiUK9e6lHJirzVqwP/KVeNB8C03vIVZr8FbH7hbA1far9SzfVZ08OpSr2wEHX1efUivPkTt8g4JwpwtYr8D+Buif1dYCsFhjP0ejL8z8LHKpyufjilezQcuCi6bzsAVPIil9XCavCx5iwLh2OAh+VlMxzvxFPjtgJPMNNR4sEbzZRyRaJpZJQoHxA0TAqzhR28Hn+d6l+nIxpRi88fieQOEUslGqoDvj2xEx6+JVdmUMePH7d1JezO7f2K+TiOTqvY3rHjr3Kp97xx84snXHp04a0eH+erx5atXp+rrU9NaUvV0xerWOV889NKGf9u78XiPuXPphuv/Yl7Y1bPgyd75kyc9R9cvF2YseX7a6PSUyYnEsFrMKZTeEHcJF1hOqeIZxUonlCWwfC7BtJnPGTesVMH/Pm4eEHfC3ztgLmUE+HuqO5kZZbCYrBp2sJSQNGxwJCYNF7+NSlNEU2mM0Dg9cMgcR197zZwoNAoB+oTZkbuVu2mupa38/kPh/rvy9yf5+ytndJJkj6BJ6ymGCH5h3T9F/Hh3zUeH9tID1Hz0ID1I5W5zc+7t3GVzB10i2EEuvD9ZLSyVJisBiAcaoAgJ71+UMFQODRplSMbVYdlvc9G4f3U5ba89UUvXlpqrb3bp3//Ju1L60ELaYS5deKjM7Gml88ytrXQSv+8WqkgpaQdxkb8nABh0W8qgEGflZIZQjLPE6ajNUIJvqYgh153QnWdAVVkHjxJSEnIlXnbY4JNOB751Eket4eFja4hqKS0ajGoxbQtdtYmuMldsEto309Xm8s1mG10JuttvXhR9gEAUMoRYoIVZ1pbQBYaJSsGyqDoLf6DqfI2psCLS/VNi59XR7eZFOuFK8RXzDLNFOT0p6sIy5itwPxQIf9BVDAIRDWCQ7a6vNESDtFzYQE/u3g1/+8adS4JJhxGJ1BH4PI7FAzGUv1BdZsETbuCVaq0XQ2H3qR5RqVbSN2jCPNm+y8yibk8RIr7PfPbj4BMYT8QU8z2dpthgZB4eRv36zZ+x8EDqdKFOJyqkwD6ERVSGmEqoIN7Nyin401PC4kxuLUYyhrfIBohdaYhdTsgUE0jGhhELkiV7lBFGwUuZq7vAD10s4KNLGmXw6neBRgUIAmGI1obMArJfjSZ9mloNE96vsgk/UlP5TActXX3HrL26ZMlPHp24fsPESZMmblg/8VHhgnDDbDPX57z09UP0K+bhZ9asXU8fog3PrV3zNPezSzDQm6ALJ/kcoFNEaZRNEldCl86wOeFmytBrIDw5SeIYMYgzcQzVE59zYi2qRwbN6LTXqztV3dFLdEcdNaiDRzQCcBEkseHwaQp8bUSjUkQv0bbNur126gZpDa291SSu33AmMWEZG892wI3D5OOgsW9y2xjFoLEi1JjT0phyxvAr1zJ+BV3aXwLerfjxrQLeDfMZ9YfDS1T9JovDk3QK0V3oNcKuPj3US7qoEAqzQJzhb/g4ncWar0txe/wANcCcDdQKpLYqWxyCbhiirmCjwWhwO519LD1m3IQFO7bNO/iHI19etPSqeVXQt9EV5+fMb1s8fgLtWLr3iSd/tNg0b5qn7bu4nleBL1SAXDVkPslUo1wApzIhlEuTr2Ud9uqQB0A2ihhP6PIZIwpO4ak8oxklIKunBAX02GH6DkHAL1ZzfGTXdJrWHT5jUEU6rWua4S+B15APshAHSpWaGo01pJL5nJAXBXJ6UPLDS7WyqucInWOuWr26U3900iJ996yeWyeWLG5u2Ujn046nzVt/Hr2nlUap8PyWFfNHjV62YvMXWnevnTk7ogwzTx5fsoRS5utjwG7z5IPgRz6yhmQc6Eno51nicggerDMMAvELiwx/QnecAcRo2FlQz9hZbLIrYEiHnUUsy5ABbsgGx38MyxtSRkMCdvfqvl7wLR+zosuXz592B+hFhWkj4PwpQq9rALcDkAyuVx0F74sptjHClgOnT+tmEf0vj2NoPZ38oni2f/gucz+dvIvOzZgLHwN77WX26gY//CfCsQbYq4uIEcAVELMyLrScFyyn2SIuDzMic06wXJDPYRz6uF/eepNFEBe4oBMAhleGoRfB0J1FMPQup8tbVEj+QRmmutuDqd9GIfXLjiBL/ZYdZbCeHwK2WDBhXNm7/iydZu6e+r2ZjUImdz0+74mTq1Z2tN/5X6P3ttJRkB1L0oK+y/xsYPFTR699u82y1VaQLQW+GCZxsoBkgihdWT4u2UAmz+Ag2CzrgbiDwXUIi1LFYC1nUi9WjUoIUBoIieC9EqcNWDiICB0cUMbq0BhchtDF5YTxGzYPmEK24lc4CBNKEFNMBhvDj8RCLwXYslVomz/xY5+78Kbd3Xrq8MKFdNnSX543ze7maatWPjZ54sR/WjGjRVgkzvS/EKHmm+av9vzj1391efUqOr1n81cXzpjZuWHK1OZpOOfWgU+OBhsqiE3kvEcaCprKlsDMBY6iwOhE5iiQb2J0nbg3d/p1ISWru9bfOi+rkCrINtBXPcTxENwngXEygBqLgMawlDWG4f2GMx2FQUcSTtoYvAmz0sdQ4e1QPAcY1KiHE0Njmi9rFyJRL+iMGMMimu/HxK0K0TgLPX61mtU23MqyxCxdBRgvynRUk2AwLwRAj+lL2UZLrtOvLc7uX7TYvEUb2r71q3P/laGB9ilNbZsHmYn6xJqrdPyEBfPb6BIKCf58ZyvA6x1Xvt15LQu6Pdl9Y8KEr81c0+T9R2HwrDHpifP3zRvR8MQ9flIMUesJknHm8xeWNMZg8JNguRMrmKDlJ3GmAyjnsO7A6tzH5jiGLCNCLOfWo1qXs0gKMtmDWIt40sbgcvAiO/H7uAYs6SF2VcXB+ZM+f2wgzkUtgOBbv770xIW2lbmV8ydOnMO85TeHvvoV/bGJbSunt3SublsnXrz8z6v27DVP9u/ybYvQUlq/Z+nXTq6bNrV5+twtF/S7/Iw0D6xsJ43kLjWj2xNIOTCSxoG5EAAjlmPIxgDI4oyN4WQQg7EuI5JqFb1qwn+MdRHfX2O+Bfffar4vXIf7K4DkGgik1azDuisANtuZrJPdqEtw2uy1CKmGSwyhfQhSuSh7wNYJVUe9jcsa4DHv08B/hk+a70qX8UkMM5ILgBmPwbMWEIbSyBkMo3Yei8oiP2u7Jx9K7j5d7O25fDV/nsB5Bc6Ldrzm1eVe0o0oR5KVfO2SvXvE0iYLsEEHDW4RX8g1CMeFznn0cKe5x9zTyTHQFtojpcRrjHMqyaM+hrFw1tgTeRYNZx/8wG36vyi+QHs2b6ZbN20iH5BrPpcLEMCHhFJg8KTXEDx9gEUKQnl1EeCaYAd5vYYE1+4j04/5cd1AqRobHBQE2yL8IjdSfOFCJ22hLZ3mmHlMpt13LksxmBdlpBLnBQsqJSBVeSJbYRk3mtAHnclWcuMWVQ4C43oVkgTnqVSNENhXgXlRBa9enAElab1S0/2YuTOugJNVfyUVEEIVbxkc6IIGyR6UNLIxn7y9AKZjDSNGNo6lVtj0gRPuPnHh3PIVDSPWL32kc/aiVc1Nk9v3Hj1kygta6efn7Fw9/dNPzHhipq966fPNcxfOmzUqPfO2D30VZaq40yTtg1jZQMaRP3CeMlvDKDc9mcgO4++0hO5OZR/iB9GkPiaRjbADqo9nAHwo43f0oaoRBDw/kks8UjVGwVEFr0sqVCMGR3b2SeMRK09e63+Rmyut6qN7jTJnn17aK8FR16j0aH+t0FVaNmo0B22lZaPzGXPUSAidUqRmWFLD9FOhGUVeUFfMl3EnhjMtwhWfPhwzk55IG2MewlBbFPTGhlqhtnEk5KSQyIkMHmQaePQRlXIaSCU1VYhVCRrH20ElVhmvwdP+xpp4lVKxexetfH/jZjpuwqJVJVLTtq9PmtQ6Z/vq5SFh8twLr14yV7a9m9m97afmuT27aaZtlbeoITlztjCTrnnr6k+Pmvr19jXZ7OPzMieXtyXM1sgwRadtNExHA2bPmMf27pm6uvmNX9Il/fShXIC+ynwvCjltr3wAZpOX7OcIGcpOG/KqVgWTVewEEZcjhZkOKkasSDEwYw1tUw3JqnVVrvqHj799hxc5HMTbVN3b23N49NvXuUEkFYELTCOYQoDwu2Sn5EdGqguc0F/bZcffeN6B50UANl4w0stUkBXAdd6B1KUh2MEY7jQvlmJiVPRHxZq4YovSy4fpld5nzeBzR+nK1fFwoFQ+cGsiPWKOFhbQ3csen/E5gnm4HWRfBD5aBJm4knzJqg9UyEhYsxiVkJHCIUI9VnEVZVJj+g0ndZXXV8gDlWEyzs+/MhXyktOBvhJS2fD0sGY4YA7qlZxThyq5EmcdImYtoMSqo5XaiKEQrCARxSERRdvpfqp+a/m2djrFvGDuBdkazQPmb2nZ9z82mT6/24RSc0bLT1fu9jsbzUtHL22nPnNbY2Pbsi9hbFsJOXYby7FjLCSG8ogojx2FiDAhEDqUIFxRgzBGPwL/DFF8GBvEPLgi4Mk2BqDu8daVdC596PzOqds2nW1b+fWlf2jv3fzv5i9e2ilcoDPo5pZtU7d3mu+al57fPGrH6J8eZT6Gel7OakKNPGTlfVceHzKg6xtYt3qtcObHAWoubaDaNNWmROMIX6tj7RBEx/1I7+4x//WpViFg+tvl7gOHTN3c8MqhTuFRIUVBH+fg2TF4tot8zLKvI29fCewr25l9WfJws0E4EHIlMw5GhThcDkzPnPSwmA7OcvCfc2JT7qvC47nnhWfl7p3mwzty7+/kOeY9eO4YxhONt2ZV4Zl2mT2TmcN5n2eKDotlseijuw98T/x4bhE+Dh6W69+Z28yftQRsPglsHiH/yPlMwzPA5lnNFxLzFUXJQEUXgaIDUA1aTLsGTyyFU0WgckO0p5EuhymPruwJaVgDGj6kc4krzSpF5T7OApEN/FiLNUQ1JQ7esoQ+SssPfW/y5m8fOk2fnv3lP9JdRy+YtzZuAHdppc+07JhuHjPfzmXLaXZnLjWF/vznIA/6yyRms3EWn2JLMfXpciorOpn2xLsWQ2mEJAqESVxi5F7BVqA8DXmCqNb+ivDxV17JvSx357YI8281CXtyLQXOQrzGnvdJ/rwsZRw6lCcZWeSNPDy0JdkjBWawjEMoeIiSzAis6BSw0oQRWE9vqNaqAYTImhy8ROPmOdEO07hmeUDaEli+PHB7fmA5e37HneviKXi+F6qBjCdfy9tETv4hOnHw+AqFuocX6jYs1FkpF4ZaHCRkoL5jx4YdP+lZu+ads/FdY2jnc+L/7vechTKNc1QsH7vJYl5NG8SeKmiV6p58XEBVunlfUlFIPYjtgPiG+RXe49zEIP+LL//HHR7OHRjOdbuq26AItTkhVrPfFlfjsIohtEMjEv0xatNO9SyjR07m/iKUnjLHfhfMUb1bSOVW9R8Vep7K7YexAoBgtTJAAWvOitacpbrCxgn5JiOy2SLK4LW2u8YOXntFgFhz64bFkyyCe82Ce/nJCyTjxXlIbJ5CdkPJAwxp+Dma8DMnsvokCDpQ2kNL3n2CpTRvHRbbhmjrQ96gZ+w3332AnZcZ3W+4VTjv6RVJlyi5WR1OX0Yk6PbwqrzQMSF5VsELb1xcP374h3yWPwZKivmC2qK/vK/c6v+e125e2Wq+ZffJ3bdnSLtvNYlLl1HvbagqzPee7t9MrPkykeWxL/LoqhNLPhvIpzKNFYFli1TkMJkzaVyynzX9voVJ4AQJXCCZxiSDtCu6kE8QRKcrP+oiwtIZVzRNCeh1fKTtp4UJinff2dwBNsoptHypWHmrSeoxr6/tv8px+3SIUcuh5nVBrp1g5QBvPgcEcTKHCx5oNVYwBxQjNeC2uMugF6OPYnGXVjaoliweE1Br5XQhRIV/7uh4+g7JXT9CP7Wvs3n6LvNHwkXhncNHza3m5sNHKBXezWVAx7W0/rvr2Nh0K944iA/Hdjda+zBaO+9Ga38hWjuT4PksgEowygBOTZ+T9cF4ptICUjQWoay4VKMxnW4UBPOP5s3X9hye0WLuOyZ3m9PP38wdFc5OnvQCDVs6MucwHamklPw9yRShjvx5HZXgAMrYADQYgFaA/TAWxguEIDZnBI8dk7iigVsR3pqzp/US7QNqk1mTU4ndR3fm5ZZDy96ZWR2/nwJz7+7Ornpm7++VDyhRID2gww0shgbIN0jGziKMzZpnRgApSY9dyFOSwULgdrPArXJF6nYMNTD5amDyhbiLHnvsd79hLmpHNpjhSaWXQHlGDaVACgc8A3WvyjiFUPtY2dfSHvpFwW5epGvPmzuu7Nzz0otdL4L+P29eehyy6azcTuHWqvVrv8njxVrw03GQS2OIB6vysUcteOnghO7hvEyYBUljENi/Gl7DOARnWpe1rOhQg6VYQAzyZXz+MlY4iFU8cAe1LurxD8Krqk/35ek4LLrwX8OIwSmWSSuDyMkMooytkdaeOk5nf6zp1KkZM6lw8dJr44+8ZJ6fMOGX7/3LmqfvmGZ9puXG/IfSU5rmztux78jUnVNPzhs7btKMA88dXLiQcXSUQKUpzQX72MgoklEKHo4cqsgXaiisR5aRGQ0ui0iDy3kafEBVjQ2eeaJpfu4V2bdz5613ZB+7/wrQ2zR5P8SgBI+ziKl4erEXgpCIBC1bBWI4eRDCm0IcAbdkL1A2SSt6APFW23pWtL1nlgt2cV//LHMFXS3u7J9i9nesodxOvG5BTPktK+Y5Uqwfl6E2SGwp1nGAR1LsyfFH2gvNh57Dk9/+Wb5IcYJTUaxGeh7OvN3FsxpzMpm7nIikHguGisNZqD1Ifrb7UxS5M6xAoj+l8WG10Yfp4KNm+BW5u//z617bckD8Hu/fUJglRDrOOGDTWsHi87MVLDhug2o46tKErrIZnqd8e7f9JWU1jbB4wuaIQYv6cO1QSVFfz5hf/OnT7HIELhf3GnZ/H4y55/X2d5K8l+KH84FewwXnnb094775l0tcRI+KMaQogClLNXyBvp7eZe+PhWsu0EaXQKH6ysDvu81oMt4pSLi8xFMUKL7bZ6bjVULzF3z+gLUy4APrTGCOkhKI3kqIhaGUPwQl0MhG9mZkKfZxWeUmxoQ9M3xBX2ntWmN9ukgZPWnPKwd314YrqrYdBKDw+Po/HI/v2CxIub+cmDdLKBKeBxg3cUP77q/lDoJ+G0C/m1kMumhFcbvDlc/1GVFWmF9wBIeuSLBwc3GflK1gOhDseLgFRq793XdQZz3HPvO7DHszcvPvNjNNEbWLEtmP88iuC3AgOPy191yWCpdFOBDteJnfzwWBr8vmUqDodeLvDPwe0Pq3pUkXlWzM42jhnUUnAZLi/8eQVjpizjxKP0GnvmbOpMdOmd83nxP6hZ7cSSGRm9JvCstzq+/OmT2gHztZwruHbH6C90lMMQ62yAY7hk4u+NEfXnrRcj1Jt/fKBg31IdPX89DwS7M4SybXyYh8qGA3BCe4kgjTJSPIdsbtMR5s4EojHDNFMH6cfp2uOGZGYJLkyoXL/asgEybuiVOOPBbHBgJD4YbACyasinB0I7LnDTY6ATyc9hpKEJ5vw+lK2XSlgmIb0E9toFHkBKPBeWKkv1883X9VHLZeatu1/vbKXYTSbeYBcS+Lj/WkUKohvWjxitYSgozMUKdsY3WhFRapVaDRbYJq7qIzzQPKrU236jd/qDeMqwJ1wULd5J7e8JG6D/aGKe8Nix/uDUPIiZ3KCIvZIhcYexTGXp8fOyPTcWmVLYHR3VoSiL6doSy0Uxy7mB+7DAOHYi1KozDuXbjcbp/8xqY+Bce+UKiWZsuHiEIeya+l4G0O5hyj/3NxQf1iryGHISb14poFuY5DR06B5mldDJAOupDunkcv7TCfNV8XqsVt/XOFizlwS3rnhnlAOn8HV4uVE11MZAnjAa2XvKLgPjZQtSq9fTu4/7tsDcAO6ZxYq0RB9iEAChKFBj6zGBLgrvyiRtaZwaKJNqRC4WCshu44P6Nl2UuKO9i9tHQN8hSQwwRpNikmg8nTJKPhDMFyGtcRPibVZlwC7/ZkhWjI5WGLBdhKq+qBfYoKyrTL8XZW4wSmljBq8k0LuyON1GJGCbkQqjH+hRjRUuxw+ZGCMRSBwzaXpjt4A6cRl0Plm61aLB7z0hi2cBBfjqE2xaa0U/P4e5sz447uv/j4vFXV9qbdK3buf/Xnm6fP2HH4082g/Cmq7bHrzR2tM1p6c+qW2VN/uDXTPH39F2z2hhTit+0g+0QlAHXSIJiDPHoW5dvlVMJYKvC2HtUrmLwBViti4YQSBlQklBixhO28gB8bjgquNUL0aS9CDFRWrPmyCqB5mffEWdmaslozAhKmNuxEsSZzlbK9225/8vTxry5+8+dvLHZX10+avImq5jtb25WA+Z3Wb+/ctMW8ab5nnnxxjRC/8rlWuotuf5XHOey1gueSIHJgvjwfIgnEQp+hPPo0wugYHh8rx3SHBrVhEY5Y4pSTReciGmO0BifA9q5fT21659gNy8y19PHOH7S/bprPrBUqaHjThtHb0+YXzAVjO8esX88xPdT2UoLptRJ7o27Uq4pDCuFSM9SriOOquEswol65NnV70qJqsm5enroTjGQsCaB2RS+O1Y1EDDEqQqBboshej8VE+0CtqRpWpMVjSpwt8kCKsZFBzcqON39+Yonb3b2h1L74DVDyq9S35dEJEijZvCHEqJsmOldGabbv+obddNMWajfnzJhxdOiV2a2Uy7Ua5JoMOvbDbJlLuEjI6TFpwjBHAg4VWafAXdIR66YAq5uCuPaXU5BG0IFsE1JKNs3weNFPXEicetEguietB3y8WaESdJRyGvUxUzCJogAcV1Pv73/zrbb+Ww76qaM/3PP6exs2HhLGmDfM60I5ddLG9o7zi8yOKZ1T6Kbn6bdoPfeRbZBnZioVJIw4Hyd5RoORZwO8F0GSYAKLBcoIcAE1b0NRihN6CJdFYVdeV5OZYAhjatAPcDkUxLchhMsR9Cu3xisCmzWNG6qtVoANF4EoIAkD09vomJkzTq1oG/rknOXDanG9VLd46CvR1sMtLbF15TRVv3h+R/848RBhnPU8MyDNA70PIUmSJr8hmWoCw67li5mLUIQ0J6u0ZMZjHWIgrR9U7QFz1INlGorxbbbBil6jcKGXkcrjoaHwJqUyUhvDZ5ItHceFtvgupRqNnDTsGhZotNdiX9oYDWdSQ1mNrpcxWrDR111U7Kmorm3AOmeYBnUOMeprwWljZCg67SANP1zsMySojvQG9kdpn+FrRHQYHtGITROsh3B5YjgatFmt/bgSDIymGAOxk4st7EpW4NX4IRI2jJDm3Whd3dKQoqePzBhLv/HTCXTBkwcaK+b+4JW9s2fljv/2qUV7aRFdM2fzgTc/e/miObbnN6MSTyz6VGzG9HndRwKLSmes2DG7VWmcOn3qlHVm+7S/e37fxRljqHDm8ps3KPpMJ64lgrmskb+zeElnisdGm8DpjDyTrXEeDQC2y6p1sFmgEVYzQFw3ZBs6uhfzgSSnrWCIsbAyQmOaGoOXzm67c/4f6Orud8wTEPKSz+42F+ZSwmEqmU/ljuIcPALjSSlewEoq+dq9zKU9mZGFu8ylmsi6ZeJDc2sM/sLsg0Gjv9oc4LqCLc9ewm8JsY3aNVxweWuzHt5C9lmr9RltJVFrCZZFcGpykIxIBgNK7AidYf6ZHqatufOnHxm6PCDWBpf3PxZYLg+98lR6FOsFmAGxRcHVjUEyh2SKCAd2uoa+RzAm4rDtfOax9za2GgAUi5OTiRBixaqLhxMIjn42Rt2fyPhdbA0XrmsK8+KS9/fZKPnCYxhpoH3V9qXjJpizhJmLFv57Zxu9edo8GU+P/oKUDi6//Uh2TiuNKe9euYI2Pws6XsPWY36XZFyM1XCmBlg93wzzcot7+R4HO99zAfWjE+eRiw/QlcD2PKrT6pX96t0zb/JqzKXq7l5rwZvhcCONir9ZV7LgJcSwuQo8R0oTUwVK9WxWldrpmt+ZPsF52mxZqQRyI82LW2iHWZ1bT99vNmeiLAdAllqQxUGaP+wtUsFbWFfi/+4jrDtxP184AE7wHjrB8oB0M/iNW8sZzQ3PmwXPXwyxK0a+ne+1laIuQY0ZBYOsK4WJUA8lGc8C+C3Gwg4u+kWMEVOxKM6W8lhUyljCrMqOGAUTExjdDEHIkBSIK6U+w2Fn69gYG1YBeuwSoVLNo48wwx4cgISRe4WIA4EZABbMwCp4ndVW6py4eme9MnXtynSa7igtHTMjHv/BiuYmqWnj7u7uWTPP44zc0JimzdOO5nbg5Ox8ByanFStAVhWZPGLxEwVJEZCwqcgbivkdMqqKpRcjaHHCqZY8Ti4PIBX0BFFK3x3+gHCxobQQLnB09wQLgSyGfD0DxuOBeZfnX9V8vg7cRUXox+DEPot/DeMCdy8bBjEC2NtUrLWjkI0JEjYWsqjEn8XUe/UcDXes+c/zHWsO0EaoTc2fm8eFOLXThHnsDjFvbtlKX9hOBXMW3Uk7EXdCPpvIcEQF4ghPAXIWVFXG6jDcoYPj87NZn1eYn6NODLBRXOUKCstIRaqFOhVPAXVKziJV5Mgob/c85gwFI/Qu6rRtB0S08FQedrot1LmlXTADysiNuwuoc2XUrJX8FvDUWTzuAFkSTJZKXJVZgHkYJwowDybXB5AeVtslSQaPHGphiwZHes4BSM+GcKiA9DxeeSDSa+SLYe+P9E4uspdu6Ha7PwLp7d7Y9wt6eujKDyM9Su3YPwWZfPn+KbeMveDEnBP3FZwYyXDDJ7A4xT0WSkJW6VAN0NDw+igzgAWEsL1s06h9Y8g+pWX6qqXL6pd96aUZM6jUdGxJQ2rYrmGzZmZyOjz3uFWbRVGzlQVetuC9VQndfcYIgQ5DnMwpB5+IIS2O3QMH8rI/Fu1FaiCCkKTcl9F8JZyYrcxvDeqiDl+5RczmNwZVNo5gvGwckFslG28wEAqHWP8+phw//CPqo3OMa2NG04WLaMfeh/e3X/9S9o2PT7p29mb9rpYdjS3jWz4+eW771KlNmyavTn9q3JQpk7+y+YcWh7kGZZIXgr/8jwEIWrYSoIVD7QyH4j5CyhazUsnBISnrXPnuNo99+cX5uieZ8bF2pA/bkeBTIt/lJyYY8hZ9Vj8lj7Pt6FgMoPp5rznAuv1xiCprqOuTj9Nus6l3zjMdi83N4qHZ9bTCPN+RW3U4+HSU0hnCCiZLJ8gyTGqCvP6ZgVWObE1liH55bGSRwLjO/0PFDaIku8hH5ebuTnEVK9YFFlOc4v1OVtRUdnZf37EBahjngt+by+gK4URujNm//7Qw6nY31C04rmbw32UwLhfq2JXHbOjCxO6w+MA80ffT+LVPF6hWwaJaI4yFcUX6ekafsy7b63RnHe4IdOD2HiekfEcfMQQb9vsIFdgevHu5T+oqsMX+EHh/KbIhzQduTFcV+2f/9KrZelVqyn3t0twGqgrfvd1N6J1+GPdJGHeEJvl64YzPX8y4YnQPaneo2uBwChv62LNnXcrJf370Q6MvYaOPlPT1jF337gpr9LgSzwiV9sl6cW/Poa+8+ww7j0RxsNdwlsF5R2/P2Myf4+y8Wqf76jA1aWyZtGoU2ft0We2yyUhmWn/uwl2NgaAfzlgPcunFale4GPc0wSfvEpsZOIcv8OGB3LJDkG1OtotpALPsB23KqM4i8FQ/39J4/32MyC9HECa50VFEruVGf+FVjLko/i/tmBP3KdHY6kNttcVKecW87ZcOr5qoPNL+Khjg0tnM4ZeECbmDB/Zc2i1U3O4WptMmk8efVrDHAvQjQH73csvCB7llnG4P4+S1oB++FwsddTxSVNbp4iE/wRoTlgum/vm3DkYx//Irv42wN9aZj+KaB16+D9dcuJznmmHOscu2D112Fi7DzZ1487+RgG6l282lb9AqGnvDXEK//yvzF+YxISWEzXl0a+5a7gTNmlNYjGiG/IhzMUz+jWS8xOpu3jMZixNYO7PJeObq9wruHEby2cfJ59H/69pc3tpATw7BFT4Ne3FnrC1kRxWE7V1hfJeB4wFelgUMazkYHe+wpuoAj+OO5PdyPogC7NLS+RYPcyOqsDIU1xCPHEebD1Cl2aYEJsEMrp7U8pnvz24a84nWBbWjwJeeOv4PC3pgLsczf9+irXc3z7XW6nSDHwVABw7yaQuD23jtzsK+YNGdd1nu5MP/c8Y9LHf538Zydwsbc2vF2twy4XsrxIkdz/Wf7OBrXcwDbK1LKfkCySjWAn09nECgYq2mZW3myBlkMX0YoCGbRFg2CfOlLhGWaSIUSoByLAEIzGdDi7AMb3iLEKnkJ6K/obJBU6uDCmb5gC0YCmrY1gwOjtARl2gz7d7Q0EivXXuoYYPZRK+/8Cr9JK1QNkmx6mYzezLujp80f9xcHZM2K7SCTn0Vxi+UmgFBhxpGJNWEVWEMG0r57Vpxvl1rwBZByBVC6SYzYCfvo/yXQf7rIH8E5feKHMXoEcaVQ0JFj2SrpMQzuiPJ+rxqMhNmW5TDSPKIYbbqJMLSLIZegMWsPguD3H7AnFDY6x4oPFRGZWCyGtHYUBPXRtTEGiS/FpCDlUFNlS+vXfzWNfrUM7Sb0mZzn/nxfVOn0U8wmemUaVM3KeYls+sAfeFVM2NesvYGbhGapJQ4E3JsirC1Tyk0Xpdqc9s55e9IYpLlC+dUN2OfDNFm0d7+hpFhLHTy5Fm8asucTfOeWzl5wbI5m+etXz1xgdC040k6rpEu4y93uVS2t6ONrydk68o4/sOtHX5v0OZhExnKti570GavZSTZ3aUcQbbjMhvgNRwglQDjyQIa58mMQJANlBhev4bAi61FdDMMb2P8mYhkEaPBrd3ZSMdWoxi2YKxh8F6a6diep2O3/OtyvcOcKlyl7zTt3Smkt6fNOeYCOubF0eLPfzUR5FkK869FPkbK8owJW2lNkxl3fuuUrBC3p1YPpLIyB2FYjpYzj7Al2a4VfzJTzDyiuAyL4eIQ+kUx8wsk/waBUMUiW4ZNDE1hG4cQzXhZlTwy3hBrSOFm6EYOgIMIuYIBWzS49Bj92c+eXPDyoe9NWLfyIl1mtn9XuL61/u3THXTirnlz6bRnJ980z3WcOvqJXcw2U0GWFeDLIXLMWts0oJ+XVTUvZct2syqXw5XM+kPsnJzK+vk5XNIWTujeM7i3woMrMJIZj5dtDrMWtnk9eORVcXt+EtfjsHVD2y7/24ewho9hjZCvryfdeLmZXRbrdLkOk59U3seWzcuqIZT3EYhm1Fo2H6q7Z6E87xGmgqgTZEchnMG/1NRe2kJnvma23TB/TevMX2fMU3SYeeot3j/MkY7tHeYtqsALRAYFfPYo+KyLFJM6qMRZtYtaQBSN7psN8x3zD8adooftsEeKtCzKjsqsGJxgX6Xh5tAZ/Bh8NVvNqYdqFasc68szjOFg72oAH3oYq4iXVTFUNqhi6ANsQ0r8QWzr2B5Is40qP/YHIu4KXCuul/kyVBnE9mP5VIKrcnAtU6VobcRU4zWVxD+CF0lISoTVRubxVTUKHU8raenOHTt2mlfMy2dWtv353bZVq9rMctNcfeFgW9uYBf+wfNwEenvOki8vOvLvdLWwl249fiw3+dhxKvzJPLV3z559Qsu+PeZu8+zJm2PbGmjLjI3mATpsVT29+d/cVyvdo/vBZBj5r4/WflUN03cVz39wBH5WBYHVqIwmk9nSYexqqWWNuvtYY7BljaQ+WMVNQdlyfiKK2KqSb9YfYKeEtaCo4qKfOWdU1at6vXqlqlf0Er2ijhoVVRblNtgy5xDNUMV02iiPwnEI7FmlMnv60Z41Gq7uHuYzAkOQbNIgI/91c2qpSjFg88dEtjaJbQaN/TVrXnuLTqIv/jHzxuzJe4bWfuaxv2LKXFhcYf7lpUkAwFrNTnp5bVN5Bf1Qf5QkcDf9gP6oXOiPGjInp5lFRzamwNXojlnN5598STpX2rYvuHsN+W/vuf7/9LdkPz0pBdjfhj/0t3JhYdN+cRb//J1b8PlTf/XzInxekc5ZYzsoHhLdbF/gA7xPjju9HNbOdq7l/M52pmWBaXmkPyXYYvRg+uvfn1B1Xjx7jirm9Uvkvvcjd+/3kTvlR/Kd8gfHDDnvbVguHjL/EnrDvIG81DW43yV2Pw9p4nfEtMAHqbshBXgHjBNjNHLYbv6UorujRgZKhFSGfAoqjUtQzV+ucTnoC/fKE8qL9dHj4MKxVOQdIB+ucALHxAoqPw5LWmwM2tK6C7f6sXEwyaP85RqXn7rv1UNeG6jf5fSK2Cy+Cxi8juBXH/HvISh8HYEzDyYdHEzCS+GLIio11oiqgXucHf/IE4u+IVwH+W6tnDDxO7w/N/XOZamN3GL703A9OfqPZId0zLcBGrIDYptwd8ve3W9rskpEa0+grSB8RMrvPAipycK/qeYL5ja+NTD/wzBBK8TfBRB/HyDPkcwQxDex/O5iFcANoUNcAAAGpayVFXplEvyAnQvlvxMJ8jzVaxHwGGXKtUwZgzpllQh1yhjUKctDHV1Osm9DKRPxW14eQDotNgRMVJPWiaZXpw1V4VyOK88wpeKNgH58BfADdQHk+YBSLgTC8MYn8y672LpREDZ2Dl2z9reHnvnU8qWrv9haTXVzgiDQleb6Jhpfs3LF982Jn6c3O+JLO6iybh2d9VzT3NZXOxRNiYwp93aYW+moHaMFJ/odEa5I29j6mAj5tbW6x+lOMR34UfOFL8FQQEi7NxAcHE6yKkBhkwK/Yui+yyKtr/rIRji2jbAVwbgxD7eiWbTM6zV/Yt9qoAdZtWq4KqCAc/b2jHnxnZfZeXed4XTZdVev1/BXwrUALqFy+REX0W6ny428x4DF4xE7S018o58P/V+DYIT70aHUKbW+EwFSjBgLa/RSpo3OfmXNpq42p3vr3OfcTrnpy1/OvSB8EX5O5t4SQrkEbWlanTsvVGfNdeg/8J80RZoC/ku0qBaVptzO4g/z7XrWP6oAvDkIovBLvB7QK1KMhtUrC6CSJHnP3JVgO8YUVY8gFTLIat/FEnqQtdCR/y4q1AM+UG2Q7UQJomoDfClNOGlUKdeyJbxvNhicrSKAXQjs61Rp+iBwOdXPKhzDNQguOEpwAU2ELaBBh2tsGDGw5c537rNuJcxjEYrD+sPPZ1u/mGgeMzMavXmzW5hzuiL6wGdfFg99YmLrQaN6LfxNw0Legafjrjw1qqz8NpGabneDX6E+Spk+2K5+po1wKlOMVamSYmQuauYDamFrPP82BWD3pcT6Bo9wXuyCwHx9kF78V0Wl9xHxq/eVrn+cEui7jvNlAsg1FOSqh3dZkhmOUSRem0plkmjV6lS2jgE4gwxNWpYuS+SFHMVILwu0PZrQh7PvkElwYAYfH55AAYejgAn2VUp6Kpmt5ZcHJ/VaDuTivKk3EeR+MAFyu0aBuWs1o2gkvA7x6WVpPa4ZxWHUxijcklkM5i+DDxaF03ldQIzhXQZcnst2uiKU5jEH/7HyIv+vMcVXHOSvBifMDYRj1aMbJ6djiYraYQ1jR8fro0N9dRVDqstLfarTTunCncdfOrFz54nicm+5Gg+V+rwup3j8kbHNTz46ZXA86HN6XVGnm7q87lV2t93tjoTr4hPn3+4Wj/c38J+2eYun2gXJ6Y74RiTGkA/q/lVL9+GC7uP30f2ohKVvfRDq3v//pvuaZKb2QbxcOxQugxmg0suG/4oZjHAx6D0IBhg0Ct5EmDtCoev3GcHQRxsB4xNoeYAZuJ/+bUZojK/aGXBIASlvhGee+ZtM0HddXisJeRO0fZT+/w9G5T/9AHjaY2BkYGAAYq9fegnx/DZfGeQ5GEDgpMXyazD6/4d/Iiy32RSBXA4GJpAoAFH6DKgAAAB42mNgZGBgz/0nw8DApvD/w/+PLLcZgCIooA0Am1UG+3jaRdGhS4NBGMfx594dQwz+AzJ0SQwGg5gsy2IQMRlM1iEiBjGIjDFEDBYZL0OWRAwmERmCgskXDAYxikFsBpMI83t3vynjw++523vPvfeeL+zWF2bZmVlIX7h3VKincJnmbI65T0xgknEDx9RX6Vn3yPgJR3hFB3tpnZ2jjUPkqY57tFOPP6cYQxVN7Cpf8IVNjUP/lvb7wLrml3ChvMYB1rCjnhlmVDPv8tTDhXHdF/1wvq56dfTeLZ01V68T3OuZZ/SwovkNrWONGyIfsK//Fun/Q66mOn5XzpGNkm86v2nPLSygrHsI2S2NmJXHzQaZDZu5Jnxid+QsuRzvsPLPuKP+N/VNEr8Z3HbYJ6wJffRu5udjPc2vZrVf96Gk0HjaY2BgMIHCKoYNjH1MMkxXmJcwH2H+wqLCEsAyiWUXyw2Wf6xGrC2sZ9gs2FawC7DXsX/iEOOYxMnCacKZxbmF8xqXHFcHdwz3LR4Xnj6eM7wcvHa8y3jv8cnxBfAt4zvDb8c/gf+egJJAg8ATwQDBBsEdQkJCh4SDhJcIPxDhEbETyRJZILJH5JFogugxMR6xCrEb4ibinySsJKZIvJEMkpwkxSEVIDVHmkk6R3qDjJRMg8wZWQ3ZD3KT5EXkQ+S3yF9RMFLIAcIrilaKx5TSlFqUfZRLcMBJyhuUzyk/U/6noqbipzJJ5Zoqi6oLGJ5TS1ErUvulnqahovEEALm5Tl4AAAEAAACJAEMABQAAAAAAAgABAAIAFgAAAQABTQAAAAB42oWQPU7DQBCFn0lA0FBSUKA5AIoIBRyACCoagug3EOxIkRdMIgQH4AScgI6bUHIgCr4dr6OIBlljvTc/782OpG3dq6eivyOpIlpc6ADW4g3t6i3jHvg9474G+sh4U4f6znhL+/rJ+Et1saeRZiqJBfGqqe5kRIAH0K2iHvSixrsqsqZP4lhHfCcomy7oiVTnTJvOwA0z6R9cNapmmxE8wpL+mEqtJ9ClV6OumC21RCPQ9wyb8PZUW/wzaX9mb2ANHa2vaYh32tVQXJKdu86QzOmacqfbqV7z1pn7dFsYWwXPlDjU7pLe115swo0MVvkNzlczYz26a8M3xTtda306XWnwCztSTVV42m3Ox05CYRCG4XeQIoiiooK993bOodtBwd5710RRN5pouAONsW29CXfWy1P0/Eu/ZPJkZjH5sPCX7zRp/stddgQLOVixYcdBLk5c5OEmnwI8FFJEMV5KKKUMH37KqaCSKqqpoZY66mmgkSaaaaGVNtrpoJMuuumhFw0dgwBBQoSJECVGH/0MMMgQw4wQJ8EoYyRJMc4Ek0wxzQyzzDHPAossscwKq6yxzgabbLHNDrvssc8Bh2LhmhueeZAc7nkSq9jELg7JFae4JE/cki8F4pFCKeKVNz754p0PbnmRYvFKCY9SKmXiE7+UOzLnZ5oW15Rjvxqapil1paEMKIPKkDKsjCijypgybqqrv7ruSp+dZC6Pjw6vTs2TkTINpazJzOXF75JUPVIJs0dWQxlQBn8A5AVUcgC4Af+FsAGNAEuwCFBYsQEBjlmxRgYrWCGwEFlLsBRSWCGwgFkdsAYrXFgAsAUgRbADK0QBsAYgRbADK0RZsBQr") format("woff");font-weight:normal;font-style:normal}html{height:100%}body{padding:0;margin:0;font:18px/1.4em "Minion Pro",Times,"Times New Roman",serif;font-size-adjust:none;font-style:normal;font-variant:normal;font-weight:normal}h1,h2,h3,h4,#header,#nav,#loader{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}a{color:#369}#header{border-bottom:1px solid #ccc;}#header #logo{color:#333;font-size:18px;font-weight:bold;padding:10px 15px;line-height:1.2em;text-decoration:none}#nav{position:fixed;top:0;left:0;width:250px;height:100%;background:#f9f9f9;background:rgba(0,0,0,0.10);border-right:1px solid rgba(0,0,0,0.20);-webkit-box-shadow:rgba(0,0,0,0.10) -1px 0 3px 0 inset;-moz-box-shadow:rgba(0,0,0,0.10) -1px 0 3px 0 inset;box-shadow:rgba(0,0,0,0.10) -1px 0 3px 0 inset;text-shadow:rgba(255,255,255,0.70) 0 1px 0;overflow-x:hidden;overflow-y:auto;}#nav a{display:block;font-weight:bold;text-decoration:none}#nav #sections{margin-bottom:5px;border-bottom:1px solid #ccc;background:#f1f1f1;-webkit-box-shadow:rgba(0,0,0,0.15) 0 0 5px;-moz-box-shadow:rgba(0,0,0,0.15) 0 0 5px;box-shadow:rgba(0,0,0,0.15) 0 0 5px;}#nav #sections > li{border-bottom:1px solid rgba(0,0,0,0.05);border-top:1px solid rgba(255,255,255,0.50);}#nav #sections > li > a{padding:5px 15px;color:#555;font-size:14px;}#nav #sections > li > a:hover{background:#ddd;background:rgba(0,0,0,0.05)}#nav #sections > li:last-child{border-bottom:1px solid rgba(255,255,255,0.50)}#nav #sections ul{margin-bottom:6px;}#nav #sections ul li a{padding:1px 25px;font-size:13px;}#nav #sections ul li a:hover{background:#ddd;background:rgba(0,0,0,0.05)}#nav .extra{padding:5px 15px;min-height:1.4em;}#nav .extra a{color:#555;font-size:14px}#nav #travis img{margin-top:10px;display:block}#github-ribbon{position:absolute;top:0;right:0;}#github-ribbon img{border:0}#refresh{z-index:3;position:fixed;display:block;top:0;left:50%;width:320px;margin-left:-160px;font-family:"Helvetica Neue","Helvetica",arial,sans-serif;line-height:1.4em;padding:10px;color:#fff;text-shadow:rgba(0,0,0,0.30) 0 1px 1px;font-weight:bold;font-size:13px;text-decoration:none;text-align:center;background:#666;-moz-border-radius-bottomleft:5px;-webkit-border-bottom-left-radius:5px;border-bottom-left-radius:5px;-moz-border-radius-bottomright:5px;-webkit-border-bottom-right-radius:5px;border-bottom-right-radius:5px;}#content{margin:0 40px 0 290px;padding:30px 0 20px;min-height:100px;max-width:688px;}#content #loader{color:#888;width:300px;height:24px;line-height:24px;position:absolute;top:30px;left:30px;background:url("data:image/gif;base64,R0lGODlhGAAYAPYAAP///5mZmfn5+dvb27i4uKmpqaCgoNra2v39/c/Pz6CgoJmZmfT09K+vr66urvb29qWlpaSkpPPz8/v7+87Ozvj4+NXV1dTU1Li4uKysrJubm52dnaqqqu7u7uPj46Ojo8LCwvb29ra2tqenp7q6utzc3JycnNfX1/Ly8uzs7J6ensbGxs3NzeDg4MvLy9LS0r+/v/r6+qysrOrq6t7e3tnZ2cTExLS0tLOzs6ioqLGxsefn57W1tcvLy7y8vMHBwd7e3qKiovHx8cfHx+Hh4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH+GkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAAFAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAGAAYAAAHmoAAgoOEhYaHgxUWBA4aCxwkJwKIhBMJBguZmpkqLBOUDw2bo5kKEogMEKSkLYgIoqubK5QJsZsNCIgCCraZBiiUA72ZJZQABMMgxgAFvRyfxpixGx3LANKxHtbNth8hy8i9IssHwwsXxgLYsSYpxrXDz5QIDubKlAwR5q2UErC2poxNoLBukwoX0IxVuIAhQ6YRBC5MskaxUCAAIfkEAAUAAQAsAAAAABgAGAAAB6GAAIKDhIWGh4MVFgQOGhsOGAcxiIQTCQYLmZqZGwkIlA8Nm6OaMgyHDBCkqwsjEoUIoqykNxWFCbOkNoYCCrmaJjWHA7+ZHzOIBMUND5QFvzATlACYsy/TgtWsIpPTz7kyr5TKv8eUB8ULGzSIAtq/CYi46Qswn7AO9As4toUMEfRcHZIgC9wpRBMovNvU6d60ChcwZFigwYGIAwKwaUQUCAAh+QQABQACACwAAAAAGAAYAAAHooAAgoOEhYaHgxUWBA4aCzkkJwKIhBMJBguZmpkqLAiUDw2bo5oyEocMEKSrCxCnhAiirKs3hQmzsy+DAgq4pBogKIMDvpvAwoQExQvHhwW+zYiYrNGU06wNHpSCz746O5TKyzwzhwfLmgQphQLX6D4dhLfomgmwDvQLOoYMEegRyApJkIWLQ0BDEyi426Six4RtgipcwJAhUwQCFypA3IgoEAAh+QQABQADACwAAAAAGAAYAAAHrYAAgoOEhYaHgxUWBA4aCxwkJzGIhBMJBguZmpkGLAiUDw2bo5oZEocMEKSrCxCnhAiirKsZn4MJs7MJgwIKuawqFYIDv7MnggTFozlDLZMABcpBPjUMhpisJiIJKZQA2KwfP0DPh9HFGjwJQobJypoQK0S2B++kF4IC4PbBt/aaPWA5+CdjQiEGEd5FQHFIgqxcHF4dmkBh3yYVLmx5q3ABQ4ZMBUhYEOCtpLdAACH5BAAFAAQALAAAAAAYABgAAAeegACCg4SFhoeDFRYEDhoaDgQWFYiEEwkGC5mamQYJE5QPDZujmg0PhwwQpKsLEAyFCKKsqw0IhAmzswmDAgq5rAoCggO/sxaCBMWsBIIFyqsRgpjPoybS1KMqzdibBcjcmswAB+CZxwAC09gGwoK43LuDCA7YDp+EDBHPEa+GErK5GkigNIGCulEGKNyjBKDCBQwZMmXAcGESw4uUAgEAIfkEAAUABQAsAAAAABgAGAAAB62AAIKDhIWGh4MVFgQOGgscJCcxiIQTCQYLmZqZBiwIlA8Nm6OaGRKHDBCkqwsQp4QIoqyrGZ+DCbOzCYMCCrmsKhWCA7+zJ4IExaM5Qy2TAAXKQT41DIaYrCYiCSmUANisHz9Az4fRxRo8CUKGycqaECtEtgfvpBeCAuD2wbf2mj1gOfgnY0IhBhHeRUBxSIKsXBxeHZpAYd8mFS5seatwAUOGTAVIWBDgraS3QAAh+QQABQAGACwAAAAAGAAYAAAHooAAgoOEhYaHgxUWBA4aCzkkJwKIhBMJBguZmpkqLAiUDw2bo5oyEocMEKSrCxCnhAiirKs3hQmzsy+DAgq4pBogKIMDvpvAwoQExQvHhwW+zYiYrNGU06wNHpSCz746O5TKyzwzhwfLmgQphQLX6D4dhLfomgmwDvQLOoYMEegRyApJkIWLQ0BDEyi426Six4RtgipcwJAhUwQCFypA3IgoEAAh+QQABQAHACwAAAAAGAAYAAAHoYAAgoOEhYaHgxUWBA4aGw4YBzGIhBMJBguZmpkbCQiUDw2bo5oyDIcMEKSrCyMShQiirKQ3FYUJs6Q2hgIKuZomNYcDv5kfM4gExQ0PlAW/MBOUAJizL9OC1awik9PPuTKvlMq/x5QHxQsbNIgC2r8JiLjpCzCfsA70Czi2hQwR9FwdkiAL3ClEEyi829Tp3rQKFzBkWKDBgYgDArBpRBQIADsAAAAAAAAAAAA=") no-repeat center left;padding-left:32px;font-size:18px}#content p{padding:0 0 .8125em 0;color:#111;font-weight:300}#content p img{float:left;margin:.5em .8125em .8125em 0;padding:0}#content h1,#content h2,#content h3,#content h4,#content h5,#content h6{font-weight:normal;color:#333;line-height:1.2em}#content h1{font-size:2.125em;margin-bottom:.765em}#content h2{font-size:1.7em;margin:.855em 0}#content h3{font-size:1.3em;margin:.956em 0}#content h4{font-size:1.1em;margin:1.161em 0}#content h5,#content h6{font-size:1em;font-weight:bold;margin:1.238em 0}#content ul{list-style-position:outside}#content li ul,#content li ol{margin:0 1.625em}#content ul,#content ol{margin:0 0 1.625em 1em}#content dl{margin:0 0 1.625em 0}#content dl dt{font-weight:bold}#content dl dd{margin-left:1.625em}#content a{text-decoration:none}#content a:hover{text-decoration:underline}#content table{margin-bottom:1.625em;border-collapse:collapse}#content th{font-weight:bold}#content tr,#content th,#content td{margin:0;padding:0 1.625em 0 1em;height:26px}#content tfoot{font-style:italic}#content caption{text-align:center;font-family:Georgia,serif}#content abbr,#content acronym{border-bottom:1px dotted #000}#content address{margin-top:1.625em;font-style:italic}#content del{color:#000}#content blockquote{padding:1em 1em 1.625em 1em;font-family:georgia,serif;font-style:italic}#content blockquote:before{content:"\201C";font-size:3em;margin-left:-.625em;font-family:georgia,serif;color:#aaa;line-height:0}#content blockquote > p{padding:0;margin:0}#content strong{font-weight:bold}#content em,#content dfn{font-style:italic}#content dfn{font-weight:bold}#content pre,#content code{margin:0 0 1.625em;white-space:pre}#content pre,#content code,#content tt{font:.8em "Droid Sans Mono",Monaco,monospace;line-height:1.5}#content code{background:#f8f8ff;padding:1px 2px;border:1px solid #ddd;word-wrap:break-word}#content pre code{padding:10px 12px;word-wrap:normal}#content tt{display:block;margin:1.625em 0}#content hr{margin-bottom:1.625em}@media only screen and (-webkit-min-device-pixel-ratio: 1.5), only screen and (min--moz-device-pixel-ratio: 1.5), only screen and (min-device-pixel-ratio: 1.5), only screen and (max-width : 480px){#nav{position:static;width:100%;height:auto;-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none;border-bottom:1px solid #aaa}#content{margin:0;padding:30px;position:relative}#github-ribbon img{width:100px}}');
var style_tag = document.createElement("style");
style_tag.type = "text/css"
document.getElementsByTagName('head')[0].appendChild(style_tag);
if (style_tag.styleSheet) { // IE
  style_tag.styleSheet.cssText = compiled_css.nodeValue;
} else {
  style_tag.appendChild(compiled_css);
}