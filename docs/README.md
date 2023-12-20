# hostconfig/http
Welcome to hostconfig/http.

A mini express http server, with out-of-the-box support for static HTML and API routes.

To start:

```
yarn build && yarn start
```

*or*

```
docker compose up --build
```

The ```app = express()``` object will be served at ```localhost:8080``` over an http server.

## Debug mode

Additionally, a debug mode can be activated:

```
yarn dbg
```

## Test mode

Additionally, a test mode can be activated:

```
yarn test
```

See the ```test``` directory for an example.

## Health check

In all three modes, a healthcheck request will be sent periodically to:

```
/health
```

See the ```test``` directory for an example.

Thanks for reading!

[Nathan J. Hood](https://github.com/nathanjhood)
