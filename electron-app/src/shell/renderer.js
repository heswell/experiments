// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// const {process} = require('electron').remote;
import {log} from 'console'

log(`renderer.js`)
window.ipcRenderer.on('pong', (evt, arg) => {
  console.log(`message from main ${arg}`)
})
window.ipcRenderer.send('ping', 'hello')

// We are using Node.js <script>document.write(process.versions.node)</script>,
// Chromium <script>document.write(process.versions.chrome)</script>,
// and Electron <script>document.write(process.versions.electron)</script>.

let firstTime = true;

const ro = new ResizeObserver(entries => {
  if (!firstTime){
    for (let entry of entries) {
      const {clientWidth: width, clientHeight: height} = entry.target;
      window.ipcRenderer.send('window-resize', {width, height})
    }   
  } else {
    firstTime = false;
  }
});

window.ipcRenderer.on('ready', (evt, arg) => {
  ro.observe(document.querySelector('body'));
})

document.querySelector('#resize-button').addEventListener('click', () => {
  document.body.style.cssText = 'width: 400px; height: 700px; background-color: ivory; transition-property: height, width; transition-duration: .25s';

  window.openModal();

})