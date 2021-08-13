/**
 * Communicated with the system using child process
 */

const {exec, execFile, spawn} = require('child_process');
const axios = require('axios');
const {logv} = require("./common");

var statusRCRemoteServer = false, statusLauncher = false;

function execute(command, callback) {
    let proc = exec(command, );
    proc.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        callback(data);
    });
    proc.stderr.on('data',function(data){
        logv(`${command} error:`);
        logv(data.toString());
    });
    proc.on('exit',function(code){
        logv(`${command} exited with ${code}`);
    });
}

function executeFile(command, callback) {

}

function spawnProcess(command,callback) {
    let proc = spawn(command);
    proc.stdout.on('data', (data) => {
        callback(data);
    });
    proc.stderr.on('data',function(data){
        logv(`${command} error:`);
        logv(data.toString());
    });
    proc.on('exit',function(code){
        logv(`${command} exited with ${code}`);
    })
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
    });
    statusLauncher = true;
}

async function sendPostRequest(urlPack,body) {
    logv('sending a post request');
    logv(urlPack);
    //expecting a URLProvider object for url
    let completeUrl = `${urlPack.url}`;
    logv(completeUrl);
    logv(body);
    let options = {
        method: 'post',
        url: completeUrl,
        headers: {
            'Content-Type': 'application/json'
        },
        data : JSON.stringify(body)
    };

    try {
        //todo: errors are not getting caught
        let response = await axios(options);
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
    //specificworker.py line 150
    static rasaBase = "http://localhost:5002/";
    static actionsBase = "http://localhost:5055/";
    port = '0';
    url = "";

    constructor(url, port) {
        this.port = port;
        this.url = url;
    }
}

class URLProvider {
    static messageUrl = new URLPack(URLPack.baseUrl,'5002',);
    static rasaUrl = new URLPack(URLPack.rasaBase,'5002',);
    static actionUrl = new URLPack(URLPack.actionsBase,'5055',);
}

class Response {
    body="";
    statusCode=0;
    isError;
    error;
    response;
    constructor(response, error) {
        logv(`Response constructor called with error ${error} ${response.status}`);
        this.statusCode = response.status;
        if(error === false) {
            if(response.status !== 200){
                logv('response is an error, couldnt find data');
                error=true;
            }else {
                logv('response is not an error');
                this.response = response;
                this.body = response.data;
                this.isError = false;
                logv(`Response body:`);
                logv(this.body);
            }
        }
        if(error === true){
            logv('response is an error');
            this.error = response;
            logv(error);
            this.isError=true;
        }
    }
}

module.exports = {
    execute,
    // spawnProcess,
    initBasics,
    sendPostRequest,
    URLProvider,
    URLPack,
    Response
}