/* 
google_auth.js 

Author: Sam Heilbron
Last Updated: 01/04/16

The internal functions underlying a custom google API (built on top of the existing Google API)
to be integrated with a website


Note: There are various callbacks used. If the callback is named success or failure, this a function
which is defined outside of the google scope (somewhere else on the site) and is to be completed 
after the underlying google function is complete. Alternatively, 'cb' or 'callback' refer to functions
defined below

*/
var fs = require('fs');
var async = require('async');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

/* Request access to users Google Plus and Google Calendar */
var SCOPES = ['https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/calendar'];
var TOKEN_DIR = './authtokens/';

/* Google developers account must be created and information from this account is stored in these local files */
var TOKEN_PATH = TOKEN_DIR + 'googletoken.json';
var SECRET_PATH = TOKEN_DIR + 'client_secret3.json';
var CREDENTIALS;


/************************************************************************************************************************/
/********************************************* AUTHENTICATION METHODS ***************************************************/
/************************************************************************************************************************/

/**
 * Load client secrets from a local file.
 *
 * @param {function} callback #1, performed after authentication
 * @param {function} callback #2 
 * @param {Object} Data to be manipulated by callback functions
 */
function auth(e, success, failure, arr) {
	fs.readFile(SECRET_PATH, function processClientSecrets(err, content) {
  		if (err) {console.log('Error loading client secret file: ' + err);return;}
  		CREDENTIALS = JSON.parse(content);
  		authorize(CREDENTIALS, e, success, failure, arr);
	});
}


/**
 * Get a client based on provided credentials
 *
 * @param {Object} credentials to be manipulated by callback functions
 */
function get_oauth2Client(credentials) {
	var clientSecret = credentials.installed.client_secret;
  	var clientId = credentials.installed.client_id;
  	var redirectUrl = credentials.installed.redirect_uris[1]; /* + ":3000/oauth2callback";*/
  	var auth = new googleAuth();
  	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  	return oauth2Client;
}


/**
 * Authorize the given callback function for an client
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 * @param {function} success The successful callback to be applied after the above callback
 * @param {function} failure The failure callback to be applied after the above callback
 * @param {Object} arr The content to be applied to a particular callback.
 */
function authorize(credentials, callback, success, failure, arr) {
	var oauth2Client = get_oauth2Client(credentials);
	
	//SetGPlusInfo is ONLY called when a redirect to a google page occurs and therefore
	//the url contains the token that we want to store
	if(callback == SetGPlusInfo) useToken(oauth2Client, callback, success, arr);
	else {
		fs.readFile(TOKEN_PATH, function(err, token) {
   			if (err) initToken(oauth2Client, failure);
    		else {
    			oauth2Client.credentials = JSON.parse(token);
    			callback(oauth2Client, success, failure, arr);
    		}
  		});
	}
}


/**
 * Initialize a token for the given client, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function initToken(oauth2Client, cb) {
  	var authUrl = oauth2Client.generateAuthUrl({
    	access_type: 'offline',
    	scope: SCOPES,
    	include_granted_scopes:true
  	});	
  	cb(authUrl);
}


/**
 * Use the token provided from a URL
 *
 * @param {Object} oauth2Client The client
 * @param {function} callback The google callback to call with the authorized client.
 * @param {function} cb The callback to be applied after the google callback
 * @param {function} code The token gathered from the URL
 */
function useToken(oauth2Client, callback, cb, code) {
	oauth2Client.getToken(code, function(err, token) {
    	if (err) {
        	initToken(oauth2Client, cb);
        	return;
      	}
      	oauth2Client.credentials = token;
      	storeToken(token);
      	callback(oauth2Client, cb, code);
	});
}


/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
	try {fs.mkdirSync(TOKEN_DIR);} 
	catch (err) {if (err.code != 'EEXIST') throw err;}
  	fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  	console.log('Token' + JSON.stringify(token) + ' stored to ' + TOKEN_PATH);
}


/************************************************************************************************************************/
/************************************************* CALENDAR METHODS *****************************************************/
/************************************************************************************************************************/


/**
 * Insert a new event on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {function} cb The callback to be applied after successful insertion.
 * @param {Object} arr The content to be passed to the callback.
 */
function CalendarEvent_new(auth, cb, arr) {
	var calendar = google.calendar('v3');
	var content = {
		"summary": "Bahstunes: " + arr._performer ,
  		"location": arr._location,
  		//"start": {"dateTime":arr._start},
  		//"end": {"dateTime": arr._end}
  		"start": {"dateTime":arr._start.replace('Z', '-05:00')},
  		"end": {"dateTime": arr._end.replace('Z', '-05:00')}
	};
  	calendar.events.insert({
    	auth: auth,
		calendarId: 'primary',
  		resource: content,
  		sendNotifications:true
  	}, function(err, response) {
    	if (err) cb(err, arr);
    	else {
    		arr._eventid = response.id;
    		arr._link = response.htmlLink;
    		cb(null, arr);
    	} 
	});

}


/**
 * Insert a new event on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {function} cb The callback to be applied after successful insertion.
 * @param {Object} arr The content to be passed to the callback.
 */
function CalendarEvent_delete(auth, cb, arr) {
	var calendar = google.calendar('v3');
  	calendar.events.delete({
    	auth: auth,
		calendarId: 'primary',
		eventId: arr._eventid,
		sendNotifications: true
  	}, function(err, response) {
    	if (err) cb(err, arr);
    	else cb(null, arr);
	});
}


/**
 * Insert a group of events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {function} cb The callback to be applied after successful insertion.
 * @param {Object} events The list of events to be inserted.
 */
function Add_CalendarEvents(auth, success, failure, events) {
	async.map(events, 
			function(e, callback) {
				CalendarEvent_new(auth, callback, e);
			}, 
			function(err, db_events) {
				setTimeout(function() {
					if(err) initToken(get_oauth2Client(CREDENTIALS),failure);
					else success(db_events);
				}, 700 * events.length);
			}
  	);
}

/**
 * Remove a group of events from the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {function} cb The callback to be applied after successful insertion.
 * @param {Object} events The list of events to be removed.
 */
function Remove_CalendarEvents(auth, success, failure, events) {
	async.map(events, 
			function(e, callback) {
				CalendarEvent_delete(auth, callback, e);
			}, 
			function(err, db_events) {
				setTimeout(function() {
					if(err) initToken(get_oauth2Client(CREDENTIALS),failure);
					else success(db_events);
				}, 700 * events.length);
			}
  	);
}

function SetGPlusInfo(auth, cb, content) {
	var gplus = google.plus('v1');
	gplus.people.get({
		auth: auth,
		userId: 'me',	
	}, function(err, resp) {
			cb(resp.displayName);		
		}
	);

}


/************************************************************************************************************************/
/************************************************* EXPORTED METHODS *****************************************************/
/************************************************************************************************************************/

/* Exported methods expect a success callback function, failure callback function and content to apply to the selected cb */
/* Success and Failure are the callbacks to be applied after the exported google function is complete. */
exports.Add_CalendarEvents = function(success, failure, content) {auth(Add_CalendarEvents, success, failure, content);};
exports.Remove_CalendarEvents = function(success, failure, content) {auth(Remove_CalendarEvents, success, failure, content);};
exports.initialize = function(success, failure, content) {auth(SetGPlusInfo, success, failure, content);};




/************ FOR ELIF AND JADE *************/

app.post('/attendEvents', function(req, res) {
	var events=req.body.data;
	RES = res;
	USER_EMAIL = req.cookies.GooglePlus_email;
	g_auth.Add_CalendarEvents(
		InsertIntoDatabase, //on success of adding google calendar events, inserts the events (events variable) into the database. InsertIntoDatase is a function we wrote.
		function(code) {res.send({redirect: code});}, //on failure, a new code will be generated. Redirect the user to the google auth page with this code as their token
		events
	);
});

/* this is the success callback of the above function */
function InsertIntoDatabase(arr) {
	var user_email = USER_EMAIL;
	for(var i in arr) {
		arr[i].user_id = user_email;
		db.collection(ATTENDING_COLLECTION, function(er, collection) {
			collection.insert(arr[i]);
		});
	}
	RES.send({redirect: "/myEvents"});
}



/* Google Authentication */
//This endpoint was decided by us in the google developer account backed. all redirects go to this page.

//The success function is one which takes a token (we call info), and loads the homepage 
//A failure functin isnt provided because visiting this page always means that a token is generated
//The content we pass is the code grabbed from the end of the url (provided by google)
app.get('/oauth2callback', ensureAuthenticated, function(req, res) {
	g_auth.initialize(function(info) {
		var locals = {
    		title: 'Successfully Synced',
    		gSync: 'T',
			scripts: jscripts.homepage,
			stylesheets: stylesheets.homepage,
			user: req.user,
			genres: genre_freqs
		};
		res.cookie('GooglePlus_email', info, { maxAge: 900000, httpOnly: false}).render('pages/account', locals);
	}, null, req.query.code);
});