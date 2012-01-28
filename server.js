(function() {
  var Coffee, Express, FS, Server, compileStylus, eco, nib, server, stylus, _base;

  process.env.TZ = "EST";

  (_base = process.env).NODE_ENV || (_base.NODE_ENV = "development");

  if (module.id === ".") {
    Server = require("./server");
    Server.on("loaded", function() {
      var growl;
      console.log("Server is READY!");
      if (process.env.NODE_ENV === "development") {
        growl = require("growl").notify;
        return growl("Restarted", {
          title: "DocumentUp"
        });
      }
    });
    Server.listen(8080);
    return;
  }

  require("sugar");

  Express = require("express");

  Coffee = require("coffee-script");

  eco = require("eco");

  stylus = require("stylus");

  nib = require("nib");

  compileStylus = function(str, path) {
    console.log("COMPILING STYLUS");
    return stylus(str).set('filename', path).set('compress', true).use(nib());
  };

  server = Express.createServer();

  server.register(".eco", eco);

  FS = require("fs");

  server = Express.createServer();

  server.configure(function() {
    server.set("root", __dirname);
    server.use(stylus.middleware({
      src: "" + __dirname + "/app",
      dest: "" + __dirname + "/public",
      compile: compileStylus
    }));
    server.use(Express.query());
    server.use(Express.bodyParser());
    server.use(Express.cookieParser());
    server.set("views", "" + __dirname + "/app/views");
    server.set("view engine", "eco");
    return server.set("view options", {
      layout: "layouts/default.eco",
      release: new Date().toJSON(),
      env: server.settings.env
    });
  });

  server.configure("development", function() {
    process.on("uncaughtException", function(error) {
      console.log("Caught exception: " + error);
      return console.log(error.stack.split("\n"));
    });
    server.use(Express.logger({
      buffer: false
    }));
    if (process.env.DEBUG) server.use(Express.profiler());
    server.error(Express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
    return server.use(Express.static("" + __dirname + "/public"));
  });

  server.configure("production", function() {
    server.error(Express.errorHandler());
    server.use(Express.logger());
    server.use(Express.responseTime());
    return server.use(Express.static("" + __dirname + "/public", {
      maxAge: 300000
    }));
  });

  server.on("listening", function() {
    console.log("listening");
    server.configure(function() {
      return server.use(server.router);
    });
    return FS.readdir("" + __dirname + "/app/resources/", function(error, files) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        if (/\.coffee$/.test(file)) {
          require("" + __dirname + "/app/resources/" + file);
        }
      }
      return server.emit("loaded");
    });
  });

  module.exports = server;

}).call(this);
