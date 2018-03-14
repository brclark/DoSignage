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
var cors = require('cors')
var app = express()
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')

const requestHandler = (request, response) => {
  winston.log('info', 'node-app', { log: request.url })
}

class DoCityJson {
  constructor () {
    this.e_list = null
    this.img_dir = "./client/public/assets/img/"
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
      if (err) {
        winston.log('error', 'node-app', {stderr: `${err}`})
        return callback(err)
      } else {
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
      request(uri, (err, res, body) => {
        if (err) {
          winston.log('error', 'request', {stderr: `${err}` })
          return cb(err)
        }
      }).pipe(fs.createWriteStream(filename))
          .on('close', () => { cb(null) })
          .on('err', (err) => { return cb(err) })
    }

    if (!this.e_list) {
      return callback(new Error("no json file yet"))
    }

    /* _downloadImages()
     *
     * Helper function to download the images in parallel
     */
    let _downloadImages = () => {
      let downloaded = 0, hasErrors = false
      this.e_list.events.forEach( (e) => {
        download(e.img_url, this.img_dir + e.id + '.jpg', (err) => {
          if (err) {
            hasErrors = true
            return callback(err)
          }
        })
        delete(e.img_url)
        if (++downloaded === this.e_list.events.length && !hasErrors)
          callback(null, "Successfully downloaded " + downloaded + " images")
      })

      download(this.e_list.logo_url, this.img_dir + 'logo.jpg', (err) => {
        if (err) {
          return callback(err)
        }
      })
    }

    /* Delete previous image directory */
    rimraf(this.img_dir, () => {
      // Download images once old img dir is removed
      mkdirp(this.img_dir, _downloadImages)
    })

  }

}

var do_city = new DoCityJson()

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/events', (req, res) => {
  res.json(do_city.event_list)
})

app.use(express.static(__dirname + '/client/dist'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/dist/index.html')
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

  p.on('error', (err) => {
    winston.log('error', 'spawn', { child_process_error: `${err}` })
  })

  p.on('close', (message) => {
    winston.log('close', 'spawn', { close_message: `${message}` })
    do_city.updateEventList(callback)
  })
}

phantom_web_scrape((err, data) => {
  if (err) {
    winston.log('error', 'scrape', { stderr: `${err}` } )
  } else {
    winston.log('info', 'scrape', { stdout: `${data}`} )
  }
})
// Currently set to scrape once every minute
//cron.schedule('* * * * *', phantom_web_scrape(parse_events))
