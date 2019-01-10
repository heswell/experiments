const electron = require('electron')
const _ipcRenderer = electron.ipcRenderer

process.once('loaded', () => {
  global.ipcRenderer = _ipcRenderer
  var currentWindow = electron.remote.getCurrentWindow()
  global.props = currentWindow.props;
})
