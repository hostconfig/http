import http from 'http'

declare module '@hostconfig/http' {
  const server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
}
