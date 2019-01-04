import {app, BrowserWindow, ipcMain} from 'electron'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let modalWindow
let registeredModalOwner

ipcMain.on('ping', (evt, arg) => {
  console.log(`message from renderer ${arg}`)
  if (arg === 'hello'){
    evt.sender.send('pong', 'Hello, Buddy')
  }
})


ipcMain.on('modal.register', (evt, arg) => {
  console.log(`register modal ${arg}`)
  registeredModalOwner = evt.sender
})

ipcMain.on('modal.calendar', (evt, arg) => {  
  console.log(`[main.js] message from modal.calendar ${JSON.stringify(arg)}`)
  registeredModalOwner.send('modal.calendar', arg)
  modalWindow.destroy()
  modalWindow = null;
  registeredModalOwner = null;
})

ipcMain.on('open.modal', (evt, {url, position}) => {
  createModal(url, position)
})

ipcMain.on('window-resize', (evt, size) => {
  if (mainWindow){
    mainWindow.setSize(size.width, size.height);
  }
})


function createModal(url, position){

  console.log(JSON.stringify(position))
  const {x,y} = mainWindow.getBounds();

  modalWindow = new BrowserWindow({
    x: x + position.left , 
    y: y + position.top + 24, // whats the 24 ? is it the height of the window title ?
    width: position.width,
    height: position.height,
    frame: false,
    // show: false,
    webPreferences: {
      preload: `${__dirname}/preload.js`
    }

  })
  modalWindow.webContents.loadURL(url)
  //modalWindow.webContents.openDevTools()

  modalWindow.on('blur', () => {
    modalWindow.destroy()
    modalWindow = null;
    registeredModalOwner.send('modal.calendar', {type: 'cancel'})
    registeredModalOwner = null;
  })

}

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