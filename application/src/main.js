/**
 * Main control of the entire app
 */

const {logv} = require("./common");
const {initBasics} = require("./comm");
const {ChatData} = require("./chatData");
const { ipcRenderer, remote } = require( "electron" );

function getAppState() {
    // let gv = remote.getGlobal('AppState').appInitialised;
    let gv = remote.getGlobal( "AppState" );
    logv(`App state: ${gv}`);
    if(gv === undefined){
        logv('app state was never set. setting it now');
        setAppState(new AppState(false));
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

function startChat() {
    logv('starting chat');
    ChatData.startChat().then(function(res){
        logv(res);
    });
}

function initialiseApp() {
    console.log(remote);
    if(getAppState().appInitialised === false) {
        logv('app wasnt initialised. Starting it now');
        initBasics();
        startChat();
        setAppState(new AppState(true));
    }else{
        logv('app already initialised. Not starting it again');
    }
}

class AppState {
    appInitialised = false;

    constructor(appInitialised) {
        this.appInitialised = appInitialised;
    }
}

module.exports = {
    initialiseApp,
    AppState,
    setAppState
}