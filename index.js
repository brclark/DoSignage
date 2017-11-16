const http = require('http')
const path = require('path')
const phantom = require('phantomjs-prebuilt')
const { spawn } = require('child_process')
const winston = require('winston')
const port = 3000
var fs = require('fs')
var request = require('request')
var cron = require('node-cron')
var express = require('express')
var app = express()
var rimraf = require('rimraf')

const requestHandler = (request, response) => {
  winston.log('info', 'node-app', { log: request.url })
}

class DoCityJson {
  constructor () {
    this.e_list = null
    this.image_dir = "./client/public/assets/img/"
  }

  get event_list() {
    return this.e_list
  }

  set event_list(event_list) {
    this.e_list = event_list
  }

  /*
   * updateEventList( callback )
   *
   * Pull in latest event-list.json. Download
   * images stored in the event list.
   */
  updateEventList(callback) {
    fs.readFile('./event-list.json', (err, data) => {
      winston.log('error', 'node-app', {stderr: `${err}`})
      if (!err) {
        this.e_list = JSON.parse(data)
      }
      this.downloadImages(callback)
    })
  }

  /*
   * downloadImages( callback )
   *
   * Download images stored in event_list.events
   * from the web using url in img_url element
   */
  downloadImages(callback) {
    var download = function(uri, filename, cb) {
      request.head(uri, function(err, res, body) {
          if (err) {
            winston.log('error', 'request', {stderr: "request error"})
          }
          request(uri, function(err) {
            if (err) {
              winston.log('error', 'request', {stderr: "request error"})
            }
          }).pipe(fs.createWriteStream(filename)).on('close', cb)
        })
    }

    if (!this.e_list) {
      return new Error("no json file yet")
    }

    if (!fs.existsSync(this.image_dir)) {
      fs.mkdir(this.image_dir, (err) => {
        if (err)
          return err
      })
    } else {
      rimraf(this.image_dir, () => {
        console.log('rm')
      })
    }
    this.e_list.events.forEach( (e) => {
      download(e.img_url, this.image_dir + e.id + '.jpg', () => {})
      delete(e.img_url)
    })
    callback()
  }
}

var do_city = new DoCityJson()

app.get('/', (req, res) => {
  res.send(do_city.event_list)
})

app.listen(3000)

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
    do_city.updateEventList(callback)
  })
}

phantom_web_scrape(() => {
  winston.log('info', 'scrape', { stdout: "done" } )
})
// Currently set to scrape once every minute
//cron.schedule('* * * * *', phantom_web_scrape(parse_events))
