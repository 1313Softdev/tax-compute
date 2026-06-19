const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { fork } = require('child_process')
const path = require('path')

// Start Express backend in a background child process on port 5000
try {
  const backendPath = path.resolve(__dirname, '../backend/dist/server.js')
  console.log(`> Spawning Express API server at: ${backendPath}`)
  const child = fork(backendPath, [], {
    env: {
      ...process.env,
      PORT: process.env.BACKEND_PORT || '5000'
    }
  })
  child.on('error', (err) => {
    console.error('> Backend process error:', err)
  })
  child.on('exit', (code, signal) => {
    console.warn(`> Backend process exited. Code: ${code}, Signal: ${signal}`)
  })
} catch (e) {
  console.error('> Failed to fork backend process:', e)
}

const dev = false
const app = next({ dev })
const handle = app.getRequestHandler()

const port = process.env.PORT || 3000

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
