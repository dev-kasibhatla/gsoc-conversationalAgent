const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const shell = require('electron').shell

ipcMain.on( "AppState", ( event, globalVarValue ) => {
  global.AppState = globalVarValue;
} );


function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
	webPreferences: {
      preload: path.join(__dirname, 'src/preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webviewTag: true
    }
  })

  // win.loadFile('src/index.html')
  win.loadURL(url.format({
    pathname: path.join(__dirname,'src/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  //todo: add other window listeners here
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    console.log('app.on() called')
  })

  app.on('session-created', function () {
    console.log('session created')
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})