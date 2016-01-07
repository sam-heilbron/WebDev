var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    passport = require('passport'),
    swig = require('swig'),
    SpotifyWebApi = require('spotify-web-api-node'),
    SpotifyStrategy = require('./lib/spotify_index').Strategy,	/* Spotify strategy */
	jscripts = require('./lib/jscripts'), 						/* Javascript files */
	stylesheets = require('./lib/stylesheets'), 				/* CSS files */
	g_auth = require('./lib/google_auth'), 						/* Google API scripts. */
	nodemailer = require('nodemailer'), 						/* Custom email alerts */
	regualarDBupdate = require ('./lib/dbupdate'), 				/* Script to update every n hours */
	CronJob = require('cron').CronJob,		 					/* Library to include cron jobs */
	consolidate = require('consolidate');


/************************************************************************************************************************/
/***********************************************  PASSPORT SPOTIFY ******************************************************/
/************************************************************************************************************************/
var appKey = '0e00c6a2b5f7439ca3691de98b8e1472';
var appSecret = 'c188bae86d66422cb60278e0b9f8e887';
var genre_freqs = [];
var a = 0;

passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});


passport.use(new SpotifyStrategy({
    clientID: appKey,
    clientSecret: appSecret,
    callbackURL: 'https://bahstunes-demo.herokuapp.com/callback'
    //callbackURL: 'http://localhost:3000/callback'
}, function(accessToken, refreshToken, profile, done) {

    var spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(accessToken);

    var playlist_id;
    var artist_ids = [];

    spotifyApi.getUserPlaylists(profile.username)
        .then(function(data) {
            for (var i = 0; i < data.body.items.length; i++) {
                if (data.body.items[i].name == 'Starred') {
                    if (data.body.items[i].owner.id == profile.username) {
                        var total_tracks = data.body.items[i].tracks.total;
                        playlist_id = data.body.items[i].id;
                    }
                }
            }
            getTracks(total_tracks);

        }, function(err) {
            console.log('Something went wrong!', err);
        });

    function getTracks(total_tracks) {
        console.log("Total are " + total_tracks);
        //var offset_count = 0;
        //for (var a = 0; a < Math.ceil((total_tracks)/50); a++) {
        if (a >= Math.ceil((total_tracks) / 50)) {
            sortandprint();
            return;
        } else {
            console.log("a at start " + a);
            console.log("profile id is: " + profile.username);
            console.log("playlist id is: " + playlist_id);
            spotifyApi.getPlaylistTracks(profile.username, playlist_id, {
                    'limit': 50, //, // TODO - make multiple calls to getartists
                    'offset': (50 * a)
                })
                .then(function(data) {
                    console.log("50*a = " + (50 * a));
                    //console.log(data.body.items[1].track.artists[0].id);
                    a++;
                    console.log("This is " + data.body.items.length);

                    for (var i = 0; i < data.body.items.length; i++) {
                        if (data.body.items[i].track.artists[0] != "null") { // BUG -- STILL NULL SOMETIMES?!?!?!
                            artist_ids[i] = data.body.items[i].track.artists[0].id;
                        }
                    }
                    console.log("call get genres");
                    getGenres();
                    console.log("end a " + a);
                    console.log("math function value " + Math.ceil((total_tracks) / 50));
                    getTracks(total_tracks);
                    /*if ((a+1) != Math.ceil((total_tracks)/50)) {
                        sortandprint();
                    }
                    else {
                        console.log("Gone Through once");
                    }*/

                }, function(err) {
                    console.log('Something went wrong1!', err);
                });
            //getTracks(total_tracks);
        }
        //}
        //sortandprint();
    }

    function compare(a, b) {
        if (a.count < b.count)
            return 1;
        if (a.count > b.count)
            return -1;
        return 0;
    }

    function sortandprint() {

        genre_freqs.sort(compare);
        console.log("genre freqs:");
        console.log(genre_freqs.length);
        for (var i = 0; i < genre_freqs.length; i++) {
            console.log(genre_freqs[i]);
        }
    }


    function getGenres() {
        console.log("getgenres call");
        spotifyApi.getArtists(artist_ids)
            .then(function(data) {
                for (var i = 0; i < data.body.artists.length; i++) {
                    for (var j = 0; j < data.body.artists[i].genres.length; j++) {
                        var cur_genre = data.body.artists[i].genres[j];
                        var in_array = false;
                        for (var u = 0; u < genre_freqs.length; u++) {
                            if (genre_freqs[u].genre == cur_genre) {
                                in_array = true;
                            }
                        }

                        if (!in_array) {
                            genre_freqs.push({
                                "genre": cur_genre,
                                "count": 1
                            });
                        } else {
                            for (var u = 0; u < genre_freqs.length; u++) {
                                if (genre_freqs[u].genre == cur_genre) {
                                    genre_freqs[u].count++;
                                }
                            }
                        }
                        //console.log(data.body.artists[i].genres);
                    }
                }



            }, function(err) {
                console.error(err);
            });
    }

    process.nextTick(function() {
        return done(null, profile);
    });
}));


/************************************************************************************************************************/
/************************************************* APP DEPENDENCIES *****************************************************/
/************************************************************************************************************************/
var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser());
app.use(methodOverride());
app.use(session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));
app.engine('html', consolidate.swig);



/* Global Variables for Database Information */
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/comp20';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) { db = databaseConnection;});
var DEVELOPERS_COLLECTION = 'developers'; //info about the developers of this project
var PERFORMANCES_COLLECTION = 'performances';
var ATTENDING_COLLECTION = 'attending';
var VENUE_COLLECTION = 'venues';
var TEMP_COLLECTION = 't'; // testing only
var MAX_DB_RETURN = 25; //limit events shown on Event List
var USER_EMAIL;
var RES;
var transporter = nodemailer.createTransport({service: 'Gmail',auth: {user: 'bahstunes2015@gmail.com',pass: 'Comp20FP'}});

/************************************************************************************************************************/
/************************************************** LOCAL METHODS *******************************************************/
/************************************************************************************************************************/
app.locals.alreadyAttendingYN = function (event, MyEvents) {
	for(var i in MyEvents) {
		if((MyEvents[i]._start == event._start) &&
			(MyEvents[i]._location == event._location))
				return true;
	}
	return false;
}


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
function RemoveFromDatabase(arr) {
	var user_email = USER_EMAIL;
	for(var i in arr) {
		db.collection(ATTENDING_COLLECTION, function(er, collection) {
			collection.remove({"user_id": user_email, "_performer":arr[i]._performer, "_location":arr[i]._location }, true);
		});
	}
	RES.send({redirect: "/myEvents"});
}

/*  Middleware to ensure authentication to spotify */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

/*  Middleware to ensure cookie for google. does not ensure authentication */
function ensureGoogleCookie(req, res, next) {
  if (req.cookies.GooglePlus_email != null) { return next(); }
  g_auth.initialize(function(code) {res.redirect(code);}, null, []); //trigger new token
}

/************************************************************************************************************************/
/***************************************************  POST METHODS ******************************************************/
/************************************************************************************************************************/

app.post('/attendEvents', function(req, res) {
	var events=req.body.data;
	RES = res;
	USER_EMAIL = req.cookies.GooglePlus_email;
	g_auth.Add_CalendarEvents(
		InsertIntoDatabase,
		function(code) {res.send({redirect: code});},
		events
	);
});

app.post('/removeEvents', function(req, res) {
	var events=req.body.data;
	RES = res;
	USER_EMAIL = req.cookies.GooglePlus_email;
	g_auth.Remove_CalendarEvents(
		RemoveFromDatabase, 
		function(code) {res.send({redirect: code});},
		events
	);
});

app.post('/fire_developer', function(req,res) {

	var mailOptions = {
    	from: 'Bahstunes <bahstunes2015@gmail.com>', // sender address
    	to: 'samheilbron@gmail.com', // list of receivers
    	subject: 'Great News!', // Subject line
    	text: 'Your services are no longer required.', // plaintext body
	};
	
	transporter.sendMail(mailOptions, function(error, info){
    	if(error){return console.log(error);}
    	console.log('Message to fire developer sent: ' + info.response);
	});
});


app.post('/messageBahstunes', function(req, res) {
	
	var t = req.body.message;
	var e = req.body.email;
	console.log("content is: " + t + e);

	//pull user from post.
	var mailOptions = {
    	from: 'Do Not Reply <bahstunes2015@gmail.com>', // sender address
    	to: 'Bahstunes <bahstunes2015@gmail.com>', // list of receivers
    	subject: 'Submitted Contact Form', // Subject line
    	text: 'message.', // plaintext body
	};
	
	transporter.sendMail(mailOptions, function(error, info){
    	if(error){
        	return console.log(error);
    	}
    	console.log('Message sent: ' + info.response);
	});
	console.log('done');
});

/************************************************************************************************************************/
/**************************************************** GET METHODS *******************************************************/
/************************************************************************************************************************/
/* Homepage of logged in client */
app.get('/', ensureAuthenticated, function(req, res){
	var locals = {
        title: 'My Account',
		scripts: jscripts.eventlist,
		stylesheets: stylesheets.homepage,
		gSync: 'F',
		user: req.user,
		genres: genre_freqs
	};
	res.render('pages/account',locals);
});

/* Homepage of NOT logged in client */
app.get('/login', function(req, res){
	var locals = {
        title: 'Login',
		scripts: jscripts.login,
		stylesheets: stylesheets.homepage,
		user: req.user,
	};
	res.render('pages/newuser',locals);

});

/* List of all events */
app.get('/event_list', ensureAuthenticated, ensureGoogleCookie, function(req, res) {
  	var locals = {
        title: 'Full List of Events',
		scripts: jscripts.eventlist,
		stylesheets: stylesheets.homepage,
	};
  	db.collection(PERFORMANCES_COLLECTION, function(er, collection) {
		collection.find().sort({_start: 1}).limit(MAX_DB_RETURN).toArray(function(err, events) {
			locals.events = events;
			db.collection(ATTENDING_COLLECTION, function(er, collection) {
				collection.find({ user_id: req.cookies.GooglePlus_email }).sort({_start: 1}).toArray(function(err, arr) {
					locals.mine = arr;
					res.render('pages/event_list', locals);	
				});
			});
		});
	});
});

/* List of My Events */
app.get('/myEvents', ensureAuthenticated, ensureGoogleCookie, function(req, res) {
	var locals = {
        title: 'My Events',
		scripts: jscripts.eventlist,
		stylesheets: stylesheets.homepage,
		mine :[]
	};
	db.collection(ATTENDING_COLLECTION, function(er, collection) {
		collection.find({ user_id: req.cookies.GooglePlus_email }).sort({_start: 1}).toArray(function(err, arr) {
			locals.events = arr;
			res.render('pages/event_list', locals);	
		});
	});	
});


/* Google Authentication */
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


app.get('/auth/spotify',
	passport.authenticate('spotify', {scope: ['user-read-email', 'user-read-private', 'playlist-read-private'], showDialog: true}),
  	function(req, res){
});

app.get('/callback', 
	passport.authenticate('spotify', { failureRedirect: '/login' }), 
	function(req, res) {
    	res.redirect('/');
});

app.get('/logout', function(req, res){
	req.logout();
  	res.redirect('/login');
});


/* Handle all other pages with 404 error */
app.get('*', ensureAuthenticated, function(req, res, next) {
	var locals = {
        title: 'Error 404: Page Not Found',
		scripts: jscripts.error,
		stylesheets: stylesheets.error,
	};
	res.status(404).render('pages/error404', locals);
});



/************************************************************************************************************************/
/***************************************************  SCHEDULED TASKS ***************************************************/
/************************************************************************************************************************/
function OnUpdateSuccess(arr) {
	db.collection(TEMP_COLLECTION).remove();
	db.collection(TEMP_COLLECTION).insert(arr);
	db.collection(PERFORMANCES_COLLECTION).remove();
	db.collection(PERFORMANCES_COLLECTION).insert(arr);
	console.log("Successful DB Update");

}

/* Seconds(0-59) | Minutes(0-59) | Hours(0-23) | Day of Month(1-31) | Months(0-11) | Day of Week(0-6) */
new CronJob('00 35 23 * * *', function() {regualarDBupdate.run(OnUpdateSuccess);}, null, true, 'America/Boston');



app.listen(process.env.PORT || 3000);
