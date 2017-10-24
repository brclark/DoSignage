const http = require('http')
const path = require('path')
const phantom = require('phantomjs-prebuilt')
const { spawn } = require('child_process')
const winston = require('winston')
const port = 3000

var cron = require('node-cron')

const requestHandler = (request, response) => {
  winston.log('info', 'node-app', { log: request.url })
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return winston.log('error', 'something bad happened', {error: err})
  }

  return winston.log('info', 'node-app', {info: `server is listening on ${port}`})
})

function parse_events(code) {
  console.log('Created json with events ret: ' + code)
  console.log('Time to parse json')
}

function phantom_web_scrape() {
  var p = spawn(phantom.path, ['./phantom-job.js']);

  winston.log('info', 'node-app', {info: `${phantom.path}` })
  p.stdout.setEncoding('utf8')
  p.stderr.setEncoding('utf8')

  p.stdout.on('data', (data) => {
     winston.log('info', 'phantom-js', { stdout: `${data}` })
  })

  p.stderr.on('data', (data) => {
    winston.log('error', 'phantom-js', { stderr: `${data}` })
  })

  p.on('error', (data) => {
    winston.log('error', 'spawn', { child_process_error: `${data}` })
  })

  p.on('close', (code) => {
    parse_events(code)
  })
}

//phantom_web_scrape()
// Currently set to scrape once every minute
cron.schedule('* * * * *', phantom_web_scrape)
