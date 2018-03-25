// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

// Create context for the app & load configuration
const context = {};
context.config = require('./config');

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const bodyParser = require('body-parser');
const express = require('express');

context.config.staticDir = context.config.staticDir || 'static';
if (context.config.staticDir[0] !== '/') {
  context.config.staticDir = path.join(__dirname, context.config.staticDir);
}

// -----------------------------------------------------------------------------
// Create and initialize Express WebApp
// -----------------------------------------------------------------------------
function createExpressWebapp (context) {
  // Initialize the express framework and keep a reference in the app context
  context.express = express();
  const app = context.express;

  app.set('views', './view');
  app.set('view engine', 'pug');
  app.set('trust proxy', true);

  context.lib = require('./lib')(context);

  // Define the available models on the app context.
  context.model = require('./model')(context);

  // Define the available controllers on the app context.
  context.controller = require('./controller')(context);

  // Configure the request middleware stack
  app.use(compression());
  app.use(express.static(context.config.staticDir));
  app.use('/static', express.static(context.config.staticDir));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(
    bodyParser.raw({
      type: 'application/octet-stream',
      limit: '100mb'
    })
  );

  require('./route/index.js')(context);

  return app;
};


// -----------------------------------------------------------------------------
// Normalize a port into a number, string, or false.
// -----------------------------------------------------------------------------
function normalizePort(val) {
  const port = parseInt(val, 10);

  // named pipe
  if (Number.isNaN(port)) return val;

  if (port >= 0) return port;

  return false;
}

const httpPort = normalizePort(context.config.port || '80');
const sslPort = normalizePort(context.config.ssl.port || '443');
const noSslConfig = { ssl: { enabled: false } };

// -----------------------------------------------------------------------------
// Starts one instance of the server
// Create and i----------------------------------------------------------------------------
function startServer(port, sslConfig) {
  const app = createExpressWebapp(context);
  const ip = '0.0.0.0';

  app.set('port', port);

  // ---------------------------------------------------------------------------
  // Create HTTP server.
  // ---------------------------------------------------------------------------
  let server = null;
  if (!sslConfig.enabled) {
    server = http.createServer(app);
  }
  else {
    console.log('Create HTTPS server: ' + sslPort);
    server = https.createServer(
      {
        key: sslConfig.key ? fs.readFileSync(sslConfig.key) : null,
        cert: sslConfig.cert ? fs.readFileSync(sslConfig.cert) : null
      },
      app
    );
  }

  // ---------------------------------------------------------------------------
  // Event listener for HTTP server "error" event.
  // ---------------------------------------------------------------------------
  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Event listener for HTTP server "listening" event.
  // ---------------------------------------------------------------------------
  function onListening() {
    const addr = server.address();
    const bind =
      typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Listening on ' + bind);
  }

  // ---------------------------------------------------------------------------
  // Listen on provided port
  // ---------------------------------------------------------------------------
  server.on('error', onError);
  server.on('listening', onListening);

  server.listen(port, ip);
}

// -----------------------------------------------------------------------------
// Start server instance
// -----------------------------------------------------------------------------
startServer(httpPort, noSslConfig);

if (context.config.ssl.enabled)
  startServer (sslPort, context.config.ssl);
