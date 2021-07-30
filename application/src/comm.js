/**
 * Communicated with the system using child process
 */

const exec = require('child_process').exec;

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
            logv('recremote server started successfully');
        }
    });

    logv('starting launcher');
    execute(runLauncher,(output)=>{
        logv(output);
        //todo: how foolproof is this?

    });
}

initBasics();