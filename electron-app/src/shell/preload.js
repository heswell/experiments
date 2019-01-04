const electron = require('electron')
const {BrowserWindow} = electron.remote;
const _ipcRenderer = electron.ipcRenderer
const _require = require("esm")(module)

process.once('loaded', () => {
  global.require = _require
  console.log(`assign openModal`)
  global.ipcRenderer = _ipcRenderer
  global.openModal = openModal
})

function openModal(url, position){
  console.log('open modal')
  _ipcRenderer.send('open.modal', {url, position})
}