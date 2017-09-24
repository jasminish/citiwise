const async = require('async');

// upload json to nexosis 
function sendToNexosis(dataSetName, json, callback) {
    axios({
        method: 'put',
        url: `https://ml.nexosis.com/v1/data/$(dataSetName)`,
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.NEXOSIS_API_KEY, 
        },
        data: JSON.stringfiy(json)
    }).then(function(res) {
        callback(null, res.dataSetName, 'transactionAmount', '2017-09-01', '2017-12-31');
    }).catch(function(err) {
        console.log(err); 
    });
}

// start / end dates eg. 2017-03-31
function startNextSesh(dataSetName, targetCol, start, end, callback) {
    axios({
        method: 'post',
        url: `https://ml.nexosis.com/v1/sessions/forecast?dataSetName=$(dataSetName)&targetColumn=$(targetCol)&startDate=$(start)&endDate=$(end)&resultInterval=Month`,
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.NEXOSIS_API_KEY, 
        },
        data: JSON.stringfiy(json)
    }).then(function(res) {
        callback(null, res.sessionId);
    }).catch(function(err) {
        console.log(err); 
    });
}

function getNextSesh(sessionId) {
    axios({
        method: 'get',
        url: `https://ml.nexosis.com/v1/sessions/$(sessionId)/results`,
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.NEXOSIS_API_KEY, 
        },
        data: JSON.stringfiy(json)
    }).then(function(res) {
        if (res == 'completed') {
            return res.data; 
        } else { // try getting again 
            setInterval(function() {
                getNexSesh(sessionId);
            }, 200); 
        }
    }).catch(function(err) {
        console.log(err); 
    });
}

function getForecast(data) {
	async.waterfall([
		function(callback) {
			callback(null, 'loc', data)
		}, 
		sendToNexosis, 
		startNextSesh, 
		getNextSesh
	], function(err, res) {
		if (err) 
			console.log(err); 
		return res.data; 
	});
}

exports.getForecast = getForecast; 
