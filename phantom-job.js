var system = require('system');
var fs = require('fs');
var page = require('webpage').create();
var url = "http://do314.com"
var path = './output.txt';

page.open( url, function( status ) {

	if(status === "success") {
    fs.touch(path);
    fs.write(path, page.content, 'w');
    system.stdout.write( "content written to output.txt" )
  }

	phantom.exit();
});

