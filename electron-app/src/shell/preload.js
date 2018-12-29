global.ipcRenderer = require('electron').ipcRenderer
const _require = require("esm")(module)
process.once('loaded', () => {
  global.require = _require
})