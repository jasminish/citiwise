var express = require('express');
var router = express.Router();
var path = require('path');

const axios = require('axios');
const async = require('async');
const querystring = require('querystring');
const config = require('./config.json');

//for Nexosis
const client = require('nexosis-api-client').default;
const nexosisClient = new client({ key: config.NEXOSIS_API_KEY });
const myNexiosis = require('./nexosis.js');

//Files
const rawTransactionData = require('./data.json');
const transactionData = addCategoryName(rawTransactionData);

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


//Forecast Page
router.get('/accounts/forecast', function(req,res){
	myNexiosis.getForecast(transactionData, function(result){
        res.send(JSON.stringify(result));
        // res.render('forecast.ejs', { 'data': JSON.stringify(result) });
    });
    // const data = require('./data.json');
    // res.render('forecast.ejs', { 'data': JSON.stringify(data.creditCardAccountTransactions)});
})

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

// identify categories based on number from citi API  
function getCategory(num) {
	if (num > 0000 && num < 1500)
		return "AGRICULTURAL SERVICES"; 
	else if (num >= 1500 && num < 3000)
		return "CONTRACTED SERVICES"; 
	else if (num >= 3000 && num < 3300)
		return "AIRLINES";
	else if (num >= 3300 && num < 3500)
		return "CAR RENTAL";
	else if (num >= 3500 && num < 4000)
		return "LODGING";
	else if (num >= 4000 && num < 4800)
		return "TRANSPORTATION SERVICES";
	else if (num >= 4800 && num < 5000)
		return "UTILITY SERVICES";
	else if (num >= 5000 && num < 5600)
		return "RETAIL OUTLET SERVICES";
	else if (num >= 5600 && num < 5700)
		return "CLOTHING STORES";
	else if (num >= 5700 && num < 7300)
		return "MISCELLANEOUS";
	else if (num >= 7300 && num < 8000)
		return "BUSINESS SERVICES";
	else if (num >= 8000 && num < 9000)
		return "PROFESSIONAL SERVICES AND MEMBERSHIP ORGANIZATIONS";
	else if (num >= 9000 && num < 10000)
		return "GOVERNMENT SERVICES";
	else 
		return "OTHERS";
}

//Add Category Name to the transaction data JSON Object based on its num. 
function addCategoryName(data){
	Object.keys(data).forEach(function(key) {
		Object.keys(data[key]).forEach(function(subkey){
			var merchantCategoryNum = new Date(data[key][subkey]['merchantCategory']);
			data[key][subkey]['merchantCategoryName'] = getCategory(merchantCategoryNum);
		})
	});
	return data;
}


module.exports = router;
