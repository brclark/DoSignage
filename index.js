const http = require("http")
const path = require('path')
const phantom = require("phantom")
const childProcess = require('child_process')
const binPath = phantom.path
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


var url = "http://do314.com"
var _ph, _page, _outObj;

phantom.create().then(function(ph){
    _ph = ph;
    return _ph.createPage();
}).then(function(page){
    _page = page;
    return _page.open(url);
}).then(function(status){
    console.log(status);
    return _page.property('content')
}).then(function(content){
    console.log(content);
    _page.close();
    _ph.exit();
}).catch(function(e){
   console.log(e); 
});
