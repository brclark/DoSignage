"use strict";
var system = require('system')
var args = system.args
var fs = require('fs')
var page = require('webpage').create()

var urls =
  {
    "314":"http://do314.com",
    "312":"http://do312.com",
    "SD":"http://dosd.com"
  }

var url = undefined
var path = undefined

switch(args.length)
{
  case 1:
    url = urls["314"]
    path = './event-list.json'
    break
  case 3:
    url = urls[args[1]]
    if (url === undefined) {
      url = urls["314"]
    }
    path = './' + args[2]
    break
  default:
    console.error("usage: phantomjs phantom-job.js <location> <output_file name>")
    phantom.exit(1)
    break
}

console.log(url)

page.onConsoleMessage = function(msg) {
  console.log('CONSOLE: ' + msg)
}

/* Setting the viewport and zoom factor due to an issue
 * with event names. They show up truncated in the html if
 * the phantom window is too small. Increase the window
 * size to make sure the whole event name appears.
 */
page.viewportSize = { width: 600, height: 100 }
page.zoomFactor = 0.125

page.settings.loadImages = false;

page.onError = function(msg) {
  console.error('ERROR: ' + msg)
}

page.open( url, function( status ) {
  if(status !== "success") {
    console.log("unable to reach site")
  }
  else {
    fs.touch(path);
    var ua = page.evaluate( function() {
      var data = {}

      data.events = []
      /* TODO:
       * - Should define the events key's as constants
       * - Should define the jquery selectors as constants somewhere
       */
      $('#ds-events-list-outlet .ds-listing').not('#ds-repeating-ongoing-widget .ds-listing').each(function(index) {
        var title = $(this).find(".ds-listing-event-title-text").text()

        var image_url = $(this).find(".ds-cover-image").css('background-image')
        image_url = image_url.replace(/.*\s?url\([\'\"]?/, '').replace(/[\'\"]?\).*/, '')

        var locat = $(this).find('.ds-venue-name span[itemprop="name"]').text()

        var time = $(this).find('.ds-event-time').text().trim()

        data.events.push({'id':index, 'title':title,'img_url':image_url, 'location':locat, 'time':time})
      })
      var font_props = $("#ds-events-list-outlet .ds-listing:first").css(["font-family", "font-size", "font-weight"])
      data.font = font_props

      var logo_url = $('#ds-mobile-logo-wrap img')[0].src
      data.logo_url = logo_url

      return data
    })

    var ua_json = JSON.stringify(ua)
    fs.write(path, ua_json, 'w', function(err) {
      if (err) {
        console.error(err)
      }
    })
    console.log(' Stored events in ' + path)
  }
  console.log( "phantom job complete. exiting." )
  phantom.exit();
})
