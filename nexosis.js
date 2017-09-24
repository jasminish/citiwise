// upload json to nexosis 
function sendToNexosis(dataSetName, json) {
    axios({
        method: 'put',
        url: `https://ml.nexosis.com/v1/data/$(dataSetName)`,
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.NEXOSIS_API_KEY, 
        },
        data: JSON.stringfiy(json)
    }).then(function(res) {
        // 
    }).catch(function(err) {
        console.log(err); 
    });
}

// start / end dates eg. 2017-03-31
function startNexSesh(dataSetName, targetCol, start, end) {
    axios({
        method: 'post',
        url: `https://ml.nexosis.com/v1/sessions/forecast?dataSetName=$(dataSetName)&targetColumn=$(targetCol)&startDate=$(start)&endDate=$(end)&resultInterval=Month`,
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.NEXOSIS_API_KEY, 
        },
        data: JSON.stringfiy(json)
    }).then(function(res) {
        return res.sessionId;
    }).catch(function(err) {
        console.log(err); 
    });
}

function getNexSesh(sessionId) {
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
