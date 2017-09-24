const async = require('async');
const axios = require('axios');
const config = require('./config.json');

const NEXURL = "https://ml.nexosis.com/v1/";

// upload json to nexosis 
function sendToNexosis(dataSetName, json, callback) {
	var url = NEXURL + "data/" + dataSetName;
    axios({
        method: 'put',
        url: url,
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.NEXOSIS_API_KEY, 
        },
        data: JSON.stringify(json)
    }).then(function(res) {
        callback(null, dataSetName, 'transactionAmount', '2017-09-01', '2017-12-31');
    }).catch(function(err) {
        console.log(err); 
    });
}

// start / end dates eg. 2017-03-31
function startNextSesh(dataSetName, targetCol, start, end, callback) {
	var url = NEXURL + "sessions/forecast?dataSetName=" + dataSetName + "&targetColumn=" + targetCol + 
		"&startDate=" + start + "&endDate=" + end + "&resultInterval=Day";
    axios({
        method: 'post',
        url: url,
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.NEXOSIS_API_KEY, 
        }
    }).then(function(res) {
		callback(null, res.data.sessionId);
    }).catch(function(err) {
        console.log(err); 
    });
}

var interval; 
function getNextSesh(sessionId, callback) {
	var url = NEXURL + "sessions/" + sessionId + "/results";
    axios({
        method: 'get',
        url: url,
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.NEXOSIS_API_KEY, 
        }
    }).then((res) => {
        if (res.data.status == 'completed') {
			if (interval)
				clearInterval(interval);
			console.log('done');
            callback(null, res.data);
        } else { // try getting again 
            if (interval)
				clearInterval(interval);
			interval = setInterval(function() {
                getNextSesh(sessionId,callback);
            }, 10000); 
        }
    }).catch(function(err) {
        console.log(err); 
    });
}

function getForecast(data, callback) {
	async.waterfall([
		function(callback) {
			callback(null, 'loc', data);
		}, 
		sendToNexosis, 
		startNextSesh, 
		getNextSesh
	], function(err, res) {
		if (err) 
			console.log(err); 
		console.log(res.data);
		callback(res.data); 
	});
}

exports.getForecast = getForecast; 
