var system = require('system')
var fs = require('fs')
var page = require('webpage').create()
var url = "http://do314.com"
var path = './output.html'

page.open( url, function( status ) {

	if(status === "success") {
    fs.touch(path);
    fs.write(path, page.content, 'w');
    system.stdout.write( "content written to output.html" )
  }

  system.stdout.write( "phantom job complete. exiting." )
	phantom.exit();
})

