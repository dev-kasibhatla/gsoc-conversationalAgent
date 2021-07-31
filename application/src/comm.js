/**
 * Communicated with the system using child process
 */

const exec = require('child_process').exec;
const request = require('request');
const {logv} = require("./common");

var statusRCRemoteServer = false, statusLauncher = false;

function execute(command, callback) {
    exec(command, (error, stdout, stderr) => { 
        callback(stdout); 
        logv('error in command');
        logv(command);
        logv(error);
        logv(stderr);
    });
}

/**
 * Starts rcremoteserver and launcher
 */

const runRemoteServer = "rcremoteserver";
const runLauncher = ". bash/runConAgent.bash";

function initBasics() {
    logv('init basics called');
    execute('ls',(output)=>{
        logv(output);
    });
    logv('starting rcremoteserver');
    execute(runRemoteServer,(output)=>{
        logv(output);
        //todo: how foolproof is this?
        if(output.includes("ok")) {
            logv('rcremote server started successfully');
            statusRCRemoteServer = true;
        }
    });

    logv('starting launcher');
    //todo: start listening to the strean
    execute(runLauncher,(output)=>{
        logv('output of starting launcher');
        logv(output);
        //todo: how foolproof is this?

    });
    statusLauncher = true;
}

async function sendPostRequest(urlPack,body) {
    logv('sending a post request');
    logv(urlPack);
    //expecting a URLProvider object for url
    let completeUrl = `${urlPack.url}`;
    let options = {
        'method': 'POST',
        'url': completeUrl,
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
    try {
        //todo: errors are not getting caught
        let response = await request(options);
        logv("response:");
        logv(response);
        return new Response(response,false);
    }catch(e) {
        logv('post request failed');
        logv(e);
        return new Response(e,true);
    }
}

class URLPack {
    //should be a const
    static baseUrl = 'http://localhost:5002/webhooks/rest/webhook/';
    port = '0';
    url = "";

    constructor(url, port) {
        this.port = port;
        this.url = url;
    }
}

class URLProvider {
    static messageUrl = new URLPack(URLPack.baseUrl,'5002',);
}

class Response {
    body="";
    statusCode="";
    isError;
    error;
    response;
    constructor(response, error) {
        if(error === false) {
            if(response.body === undefined){
                // logv('response is an error');
                error=true;
            }else {
                logv('response is not an error');
                this.response = response;
                this.body = response.body;
                logv(this.body);
            }
        }
        if(error === true){
            logv('response is an error');
            this.error = response;
            logv(error);
        }
        this.isError=true;
    }


}

module.exports = {
    execute,
    initBasics,
    sendPostRequest,
    URLProvider,
    URLPack,
    Response
}