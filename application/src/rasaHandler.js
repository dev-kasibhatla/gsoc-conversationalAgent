const {getAppState, setAppState} = require("./main");
const {logv} = require("./common");
const {execute, sendPostRequest, URLProvider} = require("./comm");
const dgram = require('dgram');

//RASA and Action server scripts
const bashStartRasa = ". bash/startRasa.bash";
const bashStartActions = ". bash/startActions.bash";
const getRasaStatus = ". bash/getRasaStatus.bash";
const bashKillRasa = ". bash/killRasa.bash";
const bashKillAction = ". bash/killAction.bash";

//RASA dialog scripts
const bashRasaTrain = ". bash/rasaButtons/rasaTrain.bash";
const bashRasaInteractive = ". bash/rasaButtons/startRasaInteractive.bash";
const bashRasaShell = ". bash/rasaButtons/startRasaShell.bash";
const bashRasaVisualise = ". bash/rasaButtons/startRasaVisualise.bash";


const RASA_SERVER_UI_ID = "rasa-server-status";
const RASA_ACTION_UI_ID = "rasa-action-status";

const STATUS_RUNNING_COLOR = "var(--main-light)";
const STATUS_PROCESSING_COLOR = "var(--yellow-light)";
const STATUS_STOPPED_COLOR = "var(--red-light)";

class RasaHandler {
    static STATUS_ACTION_SERVER = false;
    static STATUS_RASA_SERVER = false;

    static RASA_IN_PROGRESS = false;
    static ACTION_IN_PROGRESS = false;

    static appState;

    static init(){
        logv('starting rasa handler');
        logv('getting statuses');
        // this.getRasaServerStatus();
        this.getAppState();
        this.getActionServerStatus();
    };

    static getAppState() {
        this.appState = getAppState();
        logv('getting app state');
        logv(this.appState);
        this.appState.servers = this.appState.servers || {
            rasa: this.STATUS_RASA_SERVER,
            action: this.STATUS_ACTION_SERVER
        };
        this.STATUS_ACTION_SERVER = this.appState.servers.action || false;
        this.STATUS_RASA_SERVER = this.appState.servers.rasa || false;
    }

    static setAppState() {
        //get any other changes that happened first
        this.appState = getAppState();
        //set the changes this class makes
        this.appState.servers = {
            rasa: this.STATUS_RASA_SERVER,
            action: this.STATUS_ACTION_SERVER
        };
        setAppState(this.appState);
    }

    //specificworker.py line 135
    static startRasaServer() {
        this.setStatusNode(RASA_SERVER_UI_ID,STATUS_PROCESSING_COLOR,"STARTING");
        execute(bashStartRasa,(output)=>{
            logv('output of starting rasa server');
            logv(output);
            this.getActionServerStatus();
            //todo: how foolproof is this?
        });
    }

    static stopRasaServer() {
        this.setStatusNode(RASA_SERVER_UI_ID,STATUS_PROCESSING_COLOR,"STOPPING");
        execute(bashKillRasa,(output)=>{
            logv('output of killing rasa server');
            logv(output);
            this.getActionServerStatus();
            //todo: how foolproof is this?
        });
    }

    static startActionServer() {
        this.setStatusNode(RASA_ACTION_UI_ID,STATUS_PROCESSING_COLOR,"STARTING");
        execute(bashStartActions,(output)=>{
            logv('output of starting action server');
            logv(output);
            this.getActionServerStatus();
            //todo: how foolproof is this?
        });
    }

    static stopActionServer() {
        this.setStatusNode(RASA_ACTION_UI_ID,STATUS_PROCESSING_COLOR,"STOPPING");
        execute(bashKillAction,(output)=>{
            logv('output of killing action server');
            logv(output);
            this.getActionServerStatus();
            //todo: how foolproof is this?
        });
    }

    static async getActionServerStatus() {
        execute(getRasaStatus,(output)=>{
            logv('rasa status received:');
            logv(output);
            let s = output.trim().split(' ');
            logv(s);
            this.STATUS_RASA_SERVER = (s[0]==0);
            this.STATUS_ACTION_SERVER = (s[1]==0);
            this.setAppState();
            this.setStatusUI();
            logv(this.appState);
        })
    }

    static setStatusUI() {
        //rasa server
        if(this.STATUS_RASA_SERVER){
            //rasa server is running
            this.setStatusNode(RASA_SERVER_UI_ID,STATUS_RUNNING_COLOR,"RUNNING");
        }else{
            this.setStatusNode(RASA_SERVER_UI_ID,STATUS_STOPPED_COLOR,"STOPPED");
        }

        //action server
        if(this.STATUS_ACTION_SERVER){
            //rasa server is running
            this.setStatusNode(RASA_ACTION_UI_ID,STATUS_RUNNING_COLOR,"RUNNING");
        }else{
            this.setStatusNode(RASA_ACTION_UI_ID,STATUS_STOPPED_COLOR,"STOPPED");
        }
    }

    static setStatusNode(id,color,text){
        let node = document.getElementById(id);
        node.innerHTML = `Status: ${text}`;
        let parent = node.parentElement;
        parent.style.background = color;
    }

    static rasaNodeClicked() {
        //check status and decide course of action
        if(this.RASA_IN_PROGRESS){
            logv('rasa action is running, so not doing anything');
            return;
        }
        if(!this.STATUS_RASA_SERVER) {
            logv('rasa server is stopped. starting it');
            this.startRasaServer();
        }else{
            this.stopRasaServer();
        }
    }

    static actionNodeClicked() {
        //check status and decide course of action
        if(this.ACTION_IN_PROGRESS){
            logv('action action is running, so not doing anything');
            return;
        }
        if(!this.STATUS_ACTION_SERVER) {
            logv('action server is stopped. starting it');
            this.startActionServer();
        }else{
            this.stopActionServer();
        }
    }

    //todo: stop using external terminal for these
    static rasaTrainButton() {
        logv('Rasa train initiated - Opening in external terminal');
        execute(bashRasaTrain,(output)=>{
            logv('output of starting rasa train');
            logv(output);
            this.getActionServerStatus();
        });
    }

    static rasaInteractiveButton() {
        logv('Rasa interactive initiated - Opening in external terminal');
        execute(bashRasaInteractive,(output)=>{
            logv('output of starting rasa interactive');
            logv(output);
            this.getActionServerStatus();
        });
    }

    static rasaShellButton() {
        logv('Rasa shell initiated - Opening in external terminal');
        execute(bashRasaShell,(output)=>{
            logv('output of starting rasa shell');
            logv(output);
            this.getActionServerStatus();
        });
    }

    static rasaVisualiseButton() {
        logv('Rasa Visualise initiated - Opening in external terminal');
        execute(bashRasaVisualise,(output)=>{
            logv('output of starting rasa Visualise');
            logv(output);
            this.getActionServerStatus();
        });
    }
}

module.exports = {
    RasaHandler
}