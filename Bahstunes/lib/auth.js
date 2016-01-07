/* 
 *	Google OAuth2 code
 * 	Access user information using Google Web API
 *
 * Only necessary if we decide to do server side handling of gapi...doesn't seem like we will
 */
var website_domain = require('./website_domain');

var Google_clientId = '766911402371-36knpmn2r23qoeqvkdkk5f5ccrj0746p.apps.googleusercontent.com';
var Google_apiKey = 'AIzaSyAFOJzJ2wUEKuKJljmJ_yQuqUzu0hIbFew';
var Google_scopes = 'https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/calendar';
var Google_secret = '3nvxYPjEhNsJpOAX0JSSwanL';
var REDIRECT_URL = website_domain.domain + '/oauth2callback';


module.exports = {

    'spotifyAuth' : {
        'consumerKey'       : 'your-consumer-key-here',
        'consumerSecret'    : 'your-client-secret-here',
        'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : '766911402371-36knpmn2r23qoeqvkdkk5f5ccrj0746p.apps.googleusercontent.com',
        'clientSecret'  : Google_secret,
        'callbackURL'   : website_domain.domain + '/oauth2callback';
    }

};


