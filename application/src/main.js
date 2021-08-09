/**
 * Main control of the entire app
 */

const {logv} = require("./common");
const {initBasics, execute} = require("./comm");
const { ipcRenderer, remote } = require( "electron" );

function getAppState() {
    // let gv = remote.getGlobal('AppState').appInitialised;
    let gv = remote.getGlobal( "AppState" );
    logv(`App state: ${gv}`);
    if(gv === undefined){
        logv('app state was never set. setting it now');
        setAppState(new AppState(
            false,
            [],
            {
                rasa: false,
                action: false
            },
            ));
        //todo: super dangerous
        gv = getAppState();
    }
    return gv;
}

function setAppState(state) {
    // remote.getGlobal('AppState').appInitialised= state
    logv("setting app state to");
    logv(state);
    ipcRenderer.send( "AppState", state);
}

function initialiseApp() {
    console.log(remote);
    if(getAppState().appInitialised === false) {
        logv('app wasnt initialised. Starting it now');
        initBasics();
        setAppState(new AppState(true));
    }else{
        logv('app already initialised. Not starting it again');
    }
}

const CHAT_STATE_FILE = "$ROBOCOMP/components/robocomp-viriato/components/conversationalAgent/newUiConnection.txt"
class AppState {
    appInitialised = false;
    //type Message
    chatHistory = [];
    servers = {
        rasa: false,
        action: false
    }
    static chatState = false;
    constructor(appInitialised, chatHistory, servers) {
        logv('app state was constructed');
        this.appInitialised = appInitialised;
        this.chatHistory = chatHistory;
        this.servers = servers;
        AppState.getChatState();
    }

    static getChatState() {
        //read file
        // logv('reading hc state');
        execute(`cat ${CHAT_STATE_FILE}`,function (output){
           AppState.chatState = output == 1;
           // logv(`chat needs to be active: ${AppState.chatState}, ${output}`);
        });
    }
}

module.exports = {
    initialiseApp,
    AppState,
    setAppState,
    getAppState
}