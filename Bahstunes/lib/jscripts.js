/* 
 *	Determine which js files are loaded
 * 	
 *
 *
 */

/* Public Libraries */
var google_platform = 'https://apis.google.com/js/platform.js'; /*  async defer (needed?)*/
var google_client = 'https://apis.google.com/js/client.js';
var google_maps = 'https://maps.google.com/maps/api/js?signed_in=true&libraries=places';


/* Personal Libraries */
var jquery = 'javascript/jquery.js';
var bootstrap = 'javascript/bootstrap.min.js';
var require = 'javascript/require.js';
var events = 'javascript/events.js';
var gmaps = 'javascript/gmaps.js';
var main = 'javascript/main.js';
var respond = 'javascript/respond.min.js';
var fiveshiv = 'javascript/html5shiv.js';
 
 
exports.homepage = [jquery, bootstrap, main, google_platform, google_client, google_maps, require, events, gmaps, respond, fiveshiv];
exports.eventlist = [jquery, bootstrap, main, google_platform, google_client, google_maps, require, events, gmaps];
exports.error = [jquery, bootstrap, main, require, respond, fiveshiv];
exports.login = [jquery, bootstrap, main, require, respond, fiveshiv];