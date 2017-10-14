const http = require('http')
const path = require('path')
const phantom = require('phantom')
const binPath = phantom.path
const port = 3000

var spawn = require('child_process').spawn

const requestHandler = (request, response) => {
  console.log(request.url)
  response.end('Hello Node.js Server!')
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})

var childArgs = [
    './phantom-job.js'
]
console.log(binPath)

spawn('phantomjs', ['phantom-job.js'])
