const {logv} = require("./common");
const {getAppState, AppState, setAppState} = require("./main");
const stream = require('stream');
const {spawn,} = require('child_process');


const topNavInteractId = "topNavInteract", topNavShellId = "topNavShell", topNavOptionsId = "topNavOptions";
const bodyInteract = "interactBody", bodyShell = "interactShell", bodyOptions = "interactOptions";
const TNAV_INTERACT = 0, TNAV_SHELL = 1, TNAV_OPTIONS = 2;

topNavIds = {};
topNavIds[TNAV_INTERACT] = topNavInteractId;
topNavIds[TNAV_SHELL] = topNavShellId;
topNavIds[TNAV_OPTIONS] = topNavOptionsId;

bodyIds = {};
bodyIds[TNAV_INTERACT] = bodyInteract;
bodyIds[TNAV_SHELL] = bodyShell;
bodyIds[TNAV_OPTIONS] = bodyOptions;

const bashStartInteractive = "bash/interactive/start.bash";
class RasaInteractiveHandler {
    static appState;
    static CURRENT_TAB = TNAV_INTERACT;

    //child process that will interact with the shell
    static cproc;
    static interactionInProgress= false;
    static interactionPid = 0;

    static url = "";

    static shellHistory = "";

    static interactBody = "";

    static init() {
        this.loadState();
        RasaInteractiveHandler.updateUI();
    }

    static updateUI() {
        // logv(topNavIds);
        // logv(typeof topNavIds);
        for (let i of Object.keys(topNavIds)){
            let id = topNavIds[i];
            document.getElementById(id).classList.remove('top-nav-selected');
        }
        for (let i of Object.keys(bodyIds)){
            let id = bodyIds[i];
            document.getElementById(id).classList.add('dont-display');
        }
        document.getElementById(topNavIds[RasaInteractiveHandler.CURRENT_TAB]).classList.add('top-nav-selected');
        document.getElementById(bodyIds[RasaInteractiveHandler.CURRENT_TAB]).classList.remove('dont-display');
        document.getElementById(bodyInteract).src = RasaInteractiveHandler.url;

        if(!RasaInteractiveHandler.interactionInProgress) {

        }
        document.getElementById(bodyShell).innerText = RasaInteractiveHandler.shellHistory;
        RasaInteractiveHandler.saveState();
    }

    static saveState() {
        // logv(getAppState());
        RasaInteractiveHandler.appState = getAppState();
        AppState.getChatState();
        logv('fetched app state:');
        logv(RasaInteractiveHandler.appState);
        logv(typeof this.appState);
        // RasaInteractiveHandler.appState.cproc = RasaInteractiveHandler.cproc;
        RasaInteractiveHandler.appState.interactionInProgress = RasaInteractiveHandler.interactionInProgress;
        RasaInteractiveHandler.appState.interactionPid = RasaInteractiveHandler.interactionPid;
        RasaInteractiveHandler.appState.interactionTab = RasaInteractiveHandler.CURRENT_TAB;
        RasaInteractiveHandler.appState.interactiveShellHistory = RasaInteractiveHandler.shellHistory;
        setAppState(RasaInteractiveHandler.appState);
        //saving preferences
        logv('saved rasa interactive settings to global state')
    }

    static loadState() {
        RasaInteractiveHandler.appState = getAppState();
        AppState.getChatState();
        logv('fetched app state:');
        logv(RasaInteractiveHandler.appState);
        // RasaInteractiveHandler.cproc =RasaInteractiveHandler.appState.cproc;
        RasaInteractiveHandler.interactionInProgress = RasaInteractiveHandler.appState.interactionInProgress;
        RasaInteractiveHandler.interactionPid = RasaInteractiveHandler.appState.interactionPid;
        RasaInteractiveHandler.CURRENT_TAB = RasaInteractiveHandler.appState.interactionTab;
        /*if(RasaInteractiveHandler.cproc === undefined){
            RasaInteractiveHandler.interactionPid=0;
            RasaInteractiveHandler.interactionInProgress=false;
        }*/
        if(RasaInteractiveHandler.interactionPid === undefined) {
            RasaInteractiveHandler.interactionPid=0;
            RasaInteractiveHandler.interactionInProgress=false;
        }
        if(RasaInteractiveHandler.CURRENT_TAB === undefined){
            RasaInteractiveHandler.CURRENT_TAB = TNAV_INTERACT;
        }
        RasaInteractiveHandler.shellHistory = RasaInteractiveHandler.appState.interactiveShellHistory;
        if(RasaInteractiveHandler.shellHistory === undefined){
            RasaInteractiveHandler.shellHistory = "";
        }
        //get settings from file
        RasaInteractiveHandler.updateUI();
    }

    static startInteraction() {
        if(RasaInteractiveHandler.interactionInProgress){
            logv('interaction in progress so not starting');
            alert('Interaction already in progress');
            return;
        }
        logv('starting rasa interaction');
        RasaInteractiveHandler.startProcess();
    }

    static checkStatus() {
        logv('checking interaction status');
        if(RasaInteractiveHandler.cproc !== undefined && RasaInteractiveHandler.cproc.status>0){
            RasaInteractiveHandler.interactionInProgress = true;
        }else{
            RasaInteractiveHandler.interactionInProgress = false;
        }
        logv(`interaction in progress: ${RasaInteractiveHandler.interactionInProgress}`);
    }

    static inStream;

    static startProcess() {
        RasaInteractiveHandler.checkStatus();
        if(RasaInteractiveHandler.interactionInProgress){
            logv('not starting interaction as already in progress');
            return;
        }
        RasaInteractiveHandler.cproc = spawn('bash',[bashStartInteractive],
            {detached: false, shell: false});
        RasaInteractiveHandler.interactionInProgress=true;
        RasaInteractiveHandler.interactionPid = RasaInteractiveHandler.cproc.pid;

        RasaInteractiveHandler.cproc.stdout.setEncoding('utf8');
        RasaInteractiveHandler.cproc.stdin.setEncoding('utf8');
        RasaInteractiveHandler.cproc.stderr.setEncoding('utf8');

        RasaInteractiveHandler.inStream = new stream.Readable();

        RasaInteractiveHandler.cproc.on('data', (data)=> {
           logv('rasa interactive message:');
           RasaInteractiveHandler.shellHistory += data;
           RasaInteractiveHandler.updateUI();
           logv(data);
        });

        RasaInteractiveHandler.cproc.stdout.on('data', (data)=> {
            logv('rasa interactive stdout:');
            if(data.includes('http://localhost:5002')){
                logv('found link');
                let link = data.split("running at ")[1].split('\n')[0];
                logv('link:');
                logv(link);
                document.getElementById(bodyInteract).src = link;
                RasaInteractiveHandler.url = link;
            }
            logv(data);
            RasaInteractiveHandler.shellHistory += data;
            RasaInteractiveHandler.updateUI();
            logv(data);
        });

        RasaInteractiveHandler.cproc.stderr.on('data', (data)=> {
            logv('rasa interactive error:');
            RasaInteractiveHandler.shellHistory += data;
            RasaInteractiveHandler.updateUI();
        });

        RasaInteractiveHandler.cproc.on('exit', (data)=> {
            logv('rasa interactive exit:');
            logv(data);
        });

        RasaInteractiveHandler.cproc.on('close', (code) => {
            console.log(`rasa interactive process exited with code ${code}`);
        });

        RasaInteractiveHandler.cproc.on('SIGTERM', () =>
        {
            logv('rasa interactive process received SIGINT');
        })
    }

    static stopProcess() {
        RasaInteractiveHandler.checkStatus();
        logv('trying to stop interactive process');
        try{
            RasaInteractiveHandler.cproc.kill("SIGTERM");
        }catch(e){
            logv('failed stopping interactive process');
            logv(e);
        }
    }

    static sendDataToProcess(data) {
        logv('pushing data to process');
        RasaInteractiveHandler.inStream.push(data);
        RasaInteractiveHandler.inStream.push(null);
        RasaInteractiveHandler.inStream.pipe(RasaInteractiveHandler.cproc.stdin);
    }
}

module.exports = {
    TNAV_INTERACT,
    TNAV_SHELL,
    TNAV_OPTIONS,
    RasaInteractiveHandler
}