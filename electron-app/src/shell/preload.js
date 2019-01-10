const electron = require('electron')
const _ipcRenderer = electron.ipcRenderer
const _require = require("esm")(module)

process.once('loaded', () => {
  // does this give loaded page full access to require anything ?
  global.require = _require
  global.ipcRenderer = _ipcRenderer
  global.openModal = openModal
  var currentWindow = electron.remote.getCurrentWindow()
  global.props = currentWindow.props;
})

function openModal(url, options){
  _ipcRenderer.send('open.modal', {url, options})
}