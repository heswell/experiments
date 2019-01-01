import {app, BrowserWindow, ipcMain} from 'electron'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

ipcMain.on('ping', (evt, arg) => {
  console.log(`message from renderer ${arg}`)
  if (arg === 'hello'){
    evt.sender.send('pong', 'Hello, Buddy')
  }
})

ipcMain.on('window-resize', (evt, size) => {
  if (mainWindow){
    mainWindow.setSize(size.width, size.height);
  }
})

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    show: false,
    webPreferences: {
      webSecurity: false, 
      contextIsolation: false,
      nodeIntegration: false,
      preload: `${__dirname}/preload.js`
    }
  })

  // and load the index.html of the app.
  // mainWindow.loadFile(`${__dirname}/index.html`)
  mainWindow.loadURL(`http://localhost:3000/index.html`)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.send('ready')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //if (process.platform !== 'darwin') {
    app.quit()
  //}
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})