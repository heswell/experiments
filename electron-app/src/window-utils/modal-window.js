import {app, BrowserWindow, ipcMain} from 'electron'

let modalWindow
let registeredModalOwner

const MODAL_DEVTOOLS = false;

ipcMain.on('modal.message', (evt, arg) => {
  console.log(`['modal.message'] ${arg}`)
})


ipcMain.on('modal.register', (evt, arg) => {
  console.log(`register modal ${arg}`)
  registeredModalOwner = evt.sender
})

ipcMain.on('modal.unregister', (evt, arg) => {
  console.log(`unregister modal ${arg}`)
  // registeredModalOwner = null
})

ipcMain.on('modal.calendar', (evt, arg) => {  
  console.log(`[main.js] message from modal.calendar ${JSON.stringify(arg)}`)
  registeredModalOwner.send('modal.calendar', arg)
  modalWindow.destroy()
  modalWindow = null;
  registeredModalOwner = null;
})

ipcMain.on('modal.window', (evt, args) => {
  switch (args.type) {
    
    case 'focus':
      console.log(`focus modal window`)
      modalWindow.focus();
      modalWindow.send('modal.focus', true)
      break;
    
      case 'props':
      console.log(`send 'modal.props' to registerdModalOwner`)
      modalWindow.send('modal.props', args)
      break;

    default:
  }
})

export function createModal(url, options, {x,y}){
  const {position, focusOnOpen, props} = options;

  console.log(`openModal with ${JSON.stringify(props,null,2)}`)
  // TODO how do we inject the props into the modal component after the page has loaded ?
  // queryString ? sendMessage ? serviceWorker ? via the javascript url ?  webRTC ?
  // javascript url is best bet if that's how we will load the page

  const [extraWidth, extraHeight] = MODAL_DEVTOOLS
    ? [700,300]
    : [0,0];

  modalWindow = new BrowserWindow({
    x: x + position.left , 
    y: y + position.top + 24, // whats the 24 ? is it the height of the window title ?
    width: position.width + extraWidth,
    height: position.height + extraHeight,
    show: false,
    frame: false,
    // show: false,
    webPreferences: {
      preload: `${__dirname}/preload.js`
    }

  })
  modalWindow.props = props
  modalWindow.webContents.loadURL(url)
  focusOnOpen
    ? modalWindow.show()
    : modalWindow.showInactive();

  if (MODAL_DEVTOOLS){
    modalWindow.webContents.openDevTools()
  }

  modalWindow.on('blur', () => {
    modalWindow.destroy()
    modalWindow = null;
    registeredModalOwner.send('modal.calendar', {type: 'cancel'})
    registeredModalOwner = null;
  })
}

export function destroyModal(){
  if (modalWindow){
    modalWindow.destroy();
    modalWindow = null;
  }
}
