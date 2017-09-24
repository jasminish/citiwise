/**
Server.JS
Version: 1.0.0
Date: 4/26/2017

A server file written for express that serves a basic webpage flow to demonstrate connection to a Citi API.

Uses Async for synchronous API calls, Axios for HTTP requests, and body-parser for formatting data.
*/

//Library imports
const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const async = require('async');
const bodyParser = require('body-parser');
const axios = require('axios');
const querystring = require('querystring');
const config = require('./config.json');

//Files
const transactionData = require('./creditTransactionData.json');

const client = require('nexosis-api-client').default;
const nexosisClient = new client({ key: config.NEXOSIS_API_KEY });

//initialize express
var app = express();

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//options for https server - use certificate generated by openssl
var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  passphrase: config.CERTIFICATE_PASSWORD
};

var routes = require('./routes')
app.use('/', routes);

//port assignment for local server
const port = process.env.PORT || '3000';
app.set('port', port);

//create https server with options for https
const server = https.createServer(options, app);

//display console message for where server is listening
server.listen(port, () => console.log(`API running on localhost:${port}`));

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

function filterDataByMonth(monthInput, yearInput){
	var i = 0;
	var filteredData = {};
	Object.keys(transactionData).forEach(function(key) {
		Object.keys(transactionData[key]).forEach(function(subkey){
			var dateObject = new Date(transactionData[key][subkey]['transactionDate']);
			var dataMonth = dateObject.getMonth()+1;
			var dataYear = dateObject.getFullYear();
			transactionData[key][subkey]['accountType'] = key;
			if(dataMonth===monthInput && yearInput===dataYear){
				filteredData[i] = transactionData[key][subkey] ;
				i++;
			}
		})
	});
	console.log(filteredData);
	return filteredData;
}
