var express = require('express');
var router = express.Router();
var path = require('path');

const axios = require('axios');
const async = require('async');
const querystring = require('querystring');
const config = require('./config.json');

//create encoded secret by concatenating ID and Secret with a colon, converting to base64, and prepending with 'Basic '
const CLIENT_ID = config.CLIENT_ID; //Client ID generated from your application page
const CLIENT_SECRET = config.CLIENT_SECRET;

var tempEncoding = new Buffer(CLIENT_ID + ":" + CLIENT_SECRET);
const ENCODED_ID_SECRET = "Basic " + tempEncoding.toString('base64');

//Constants for API access
const TOKEN_URL = "https://sandbox.apihub.citi.com/gcb/api/authCode/oauth2/token/us/gcb"; //HTTPS endpoint to retrieve token
const ACCOUNTS_URL = "https://sandbox.apihub.citi.com/gcb/api/v2/accounts"; //HTTPS endpoint to retrieve account summary
const CONTENT_TYPE = "application/x-www-form-urlencoded"; //content type for header
const GRANT_TYPE = "authorization_code";
const REDIRECT_URI = "https://127.0.0.1:3000/accounts/retrieve"; //URI to redirect to after successfully logging in at Citi redirect
const SAMPLE_UUID = "a293fe0a-51ff-4b03-9376-022f1a1b453e"; //UUID - can be any generated value
const ACCEPT = "application/json"; 

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname + "/login.html"));
});

//page that your redirect URI points to. 
router.get('/accounts/retrieve', function (req, res) {
	var code = req.query.code;
	//error path - no code variable passed through url
	if(typeof code === 'undefined' || code === null){
		res.send("<h1>You need to be redirected here from the Citi Login page. Please return to <a href='https://127.0.0.1:3000'>localhost</a> to try the oath flow over.</h1>");
	} else {
		//code exists, use it to fetch account information
		async.waterfall( //synchronous calls to get token first, then account
			[	//bootstrapping function to pass code into fetchToken
				function(callback){ 
					callback(null, code);
				},
				fetchToken, //function to retrieve access_token
				fetchAccount //function to retrieve account
			],
			function(err, successfulAccount){
				//error case: https request
				if(err){
					res.send('<h1>Something Went Wrong. Try again.</h1><p>Error: ' + err + '</p>');
				} else {
					//Success: send account information
					console.log(access_token);
					res.send(
						'<script src="https://cdn.rawgit.com/google/code-prettify/master/loader/run_prettify.js"></script><pre class="prettyprint">' +
						successfulAccount + 
						'</pre>'
						);
				}
			}
		);
	}
});

/**
takes a code, and a callback function for use with async waterfall

calls Citi endpoint to exchange a code for an access token.
*/
function fetchToken(code, callback) {
	//https request
	axios({
		method: 'post',
		url: TOKEN_URL,
		headers:{
			"Authorization": ENCODED_ID_SECRET,
			"Content-Type": CONTENT_TYPE
		},
		data: querystring.stringify({
			"grant_type": GRANT_TYPE,
			"redirect_uri": REDIRECT_URI,
			"code":code
		})
	}).then(function(response){
		var access_token = response.data['access_token'];
		callback(null, access_token);

	}).catch(function(error){
		//pass error to async.waterfall
		callback(error, null);
	});
}

/**
takes an access_token and a callback function for use with async waterfall

calls citi endpoint with a client ID and access token to retrieve account information
*/
function fetchAccount(token, callback) {
	access_token = "Bearer " + token;
	axios({
		method: 'get',
		url: ACCOUNTS_URL,
		headers: {
			"Authorization": access_token,
			"uuid": SAMPLE_UUID,
			"Accept": ACCEPT,
			"client_id": CLIENT_ID
		}
	}).then(function(response){
		var successfulAccount = JSON.stringify(response.data, undefined, 2);
		callback(null, successfulAccount);
	}).catch(function(error){
		callback(error, null);
	});
}

module.exports = router;
