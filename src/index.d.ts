#!/usr/bin/env node
/**
 * Module dependencies.
 */
/// <reference types="node" resolution-mode="require"/>
import http from 'http';
/**
 * Create HTTP server.
 */
declare const server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
export default server;
//# sourceMappingURL=index.d.ts.map