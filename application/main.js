const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const url = require('url')
const shell = require('electron').shell

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
	webPreferences: {
	      preload: path.join(__dirname, 'src/preload.js'),
        nodeIntegration: true,
        contextIsolation: false
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
  
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})