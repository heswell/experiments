const electron = require('electron')
const {BrowserWindow} = electron.remote;
global.ipcRenderer = electron.ipcRenderer
const _require = require("esm")(module)
process.once('loaded', () => {
  global.require = _require
  console.log(`assign openModal`)
  global.openModal = openModal
})

let modalWindow;

function openModal(){
  console.log('open modal')

  modalWindow = new BrowserWindow({
    width: 255,
    height: 230,
    frame: false,
    // show: false,
  })

  return document.body
}