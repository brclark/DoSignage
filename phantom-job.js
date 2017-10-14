var page = require('webpage').create()
var url = "http://do314.com"

page.open(url, function(status) {
	console.log("Status: " + status);
	if(status === "success") {
		console.log(page.title);
	}
	phantom.exit();
});

