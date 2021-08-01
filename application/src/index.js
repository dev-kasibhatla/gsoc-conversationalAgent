
const electron = require('electron')
const path = require('path')
// const {AppState} = require("../main");
const {initialiseApp} = require("./main");
const {ChatData} = require("./chatData");
// const {logv} = require("./common");
//logv already imported in nav.js
// const {logv} = require("./common");
// const BrowserWindow = electron.remote.BrowserWindow

console.log('index.js was initialised')

/*
if(!AppState.appInitialised) {
    logv('app initialised:');
    logv(!AppState.appInitialised);
    initialiseApp();
    AppState.appInitialised = true;
    logv('app initialised:');
    logv(!AppState.appInitialised);
}*/

initialiseApp();
ChatData.init();

function startChatButton() {
    logv('starting chat');
    ChatData.startChat().then(function(res){
        logv(res);
    });
}


/**
 * Called when text box key is pressed
 */
function sendMessage(textBox) {
    if(event.key === 'Enter') {
        ChatData.sendChatMessage(textBox.value);
        logv(`entered message: ${textBox.value}`);
        textBox.value = "";
    }
}