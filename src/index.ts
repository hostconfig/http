#!/usr/bin/env node

/**
 * Module dependencies.
 */

import express, { Request, Response, NextFunction, Router } from 'express'
// this example uses express web framework so we know what longer build times
// do and how Dockerfile layer ordering matters. If you mess up Dockerfile ordering
// you'll see long build times on every code change + build. If done correctly,
// code changes should be only a few seconds to build locally due to build cache.
// import { body, header, validationResult } from 'express-validator'
import { readFileSync } from 'fs'
import debugLib from 'debug'
import http from 'http'
import createError from 'http-errors'
import { URL } from 'url'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
// morgan provides easy logging for express, and by default it logs to stdout
// which is a best practice in Docker. Friends don't let friends code their apps to
// do app logging to files in containers.

type Route = {
  path: string;
  route: Router;
}

type Routes = Route[]

const __filename = new URL('', import.meta.url).pathname
const __dirname = new URL('.', import.meta.url).pathname // Will contain trailing slash

export const app = express()
const debug = debugLib('http:server')

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'static')))

/**
 * Get port from environment and store in Express.
 * If you're not using docker compose for local development, this will default to 8080
 * to prevent non-root permission problems with 80. Dockerfile is set to make this 80
 * because containers don't have that issue :)
 */

const port = normalizePort(process?.env?.PORT || '8080')
app.set('port', port)

/**
 * Validation
 */

// const pathValidationRules = [
//   // body('title').notEmpty().withMessage('Title is required'),
//   // body('description').notEmpty().withMessage('Description is required'),
//   // body('completed').isBoolean().withMessage('Completed must be a boolean'),
//   header('X-Hostconfig-Http-Server-Middleware-Response').notEmpty().withMessage('Middleware response header is required'),
// ]

/**
 * Middleware
 */

app.use(function middleware(req: Request, res: Response, next: NextFunction) {

  const date = Date.now()

  res.setHeader('X-Hostconfig-Http-Server-Middleware-Response', `'${date}'`)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Upgrade-Insecure-Requests', '1')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  next()
})

/**
 * Router
 */

app.get('/', (req: Request, res: Response) => {

  res.render('index', { title: 'hostconfig/http' })
})

app.get("/health", /* pathValidationRules, */ function(req: Request, res: Response) {

  // do app logic here to determine if app is truly healthy
  // you should return 200 if healthy, and anything else will fail
  // if you want, you should be able to restrict this to localhost (include ipv4 and ipv6)

  // const errors = validationResult(req)

  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() })
  // }

  res.send("I am happy and healthy\n");
});

/**
 * If requested route is not listed above, catch 404 and forward to error handler
 */

app.use(function(req: Request, res: Response, next: NextFunction) {
  next(createError(404))
});

/**
 * Error handler
 */

app.use(function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
});

/**
 * Create HTTP server.
 */

const server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address()
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr?.port
  debug('Listening on ' + bind)
  console.log(`http server running on http://localhost:${port}`)
}

/**
 * Quit on ctrl-c when running docker in terminal
 */

process.on("SIGINT", function onSigint() {
  console.info(
    "Got SIGINT (aka ctrl-c in docker). Graceful shutdown ",
    new Date().toISOString()
  );
  shutdown();
});

/**
 * Quit properly on docker stop
 */

process.on("SIGTERM", function onSigterm() {
  console.info(
    "Got SIGTERM (docker container stop). Graceful shutdown ",
    new Date().toISOString()
  );
  shutdown()
})

/**
 * Shut down server
 */

function shutdown() {
  server.close(function onServerClosed(err) {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    process.exit(0)
  })
}


// need above in docker container to properly exit need this in docker
// container to properly exit since node doesn't handle SIGINT/SIGTERM
// this also won't work on using npm start since:
// https://github.com/npm/npm/issues/4603
// https://github.com/npm/npm/pull/10868
// https://github.com/RisingStack/kubernetes-graceful-shutdown-example/blob/master/src/index.js
