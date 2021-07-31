
const electron = require('electron')
const path = require('path')
// const {AppState} = require("../main");
const {initialiseApp} = require("./main");
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