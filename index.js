const http = require('http')
const path = require('path')
const phantom = require('phantomjs')
const { spawn } = require('child_process')
const port = 3000

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

const p = spawn(phantom.path, ['./phantom-job.js'])

p.stdout.setEncoding('utf8')
p.stderr.setEncoding('utf8')

p.stdout.on('data', (data) => {
  console.log("stdout:", JSON.stringify( data ) )
})

p.stderr.on('data', (data) => {
  console.log("stderr:", JSON.stringify( data ) )
})

p.on('error', (data) => {
  console.log("err:", JSON.stringify( data ) )
})


