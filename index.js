const http = require('http')
const path = require('path')
const phantom = require('phantomjs-prebuilt')
const { spawn } = require('child_process')
const winston = require('winston')
const port = 3000
var fs = require('fs')
var request = require('request')
var cron = require('node-cron')

const requestHandler = (request, response) => {
  winston.log('info', 'node-app', { log: request.url })
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return winston.log('error', 'node-app', {error: `${err}`})
  }

  return winston.log('info', 'node-app', {info: `server is listening on ${port}`})
})

function parse_events() {
  var contents = fs.readFileSync('./event-list.json', function(err) {
    winston.log('error', 'node-app', {stderr: `${err}`})
  })
  var event_list = JSON.parse(contents)
  var image_dir = "./client/public/assets/img/"
  var download = function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback)
    })
  }

  if (!fs.existsSync(image_dir)) {
    fs.mkdirSync(image_dir)
  }
  for (var i = 0; i < event_list.events.length; i++) {
    download(event_list.events[i].img_url, image_dir + i + '.jpg', function() {})
  }
}

function phantom_web_scrape(callback) {
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

  p.on('close', (message) => {
    winston.log('close', 'spawn', { close_message: `${message}` })
    callback()
  })
}

phantom_web_scrape(parse_events)
// Currently set to scrape once every minute
//cron.schedule('* * * * *', phantom_web_scrape(parse_events))
