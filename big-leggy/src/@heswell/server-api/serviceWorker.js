/* global self */
import {ServerProxy} from './serverProxyStatic-viewserver.js';

// doees this need to go into some kind of lifecycle handler ?
let _server;

function broadcast(evt){
    // assume for now message goes to all clients, we will address this shortly
    // can we improve responsiveness of this with a channel ?
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            console.log(`[serviceWorker.broadcast]  ==>  C   ${evt.data.type}`)
            client.postMessage(evt.data)
        })
    })
}

self.addEventListener('message', evt => {
    if (_server){
        console.log(`[ServiceWorker.<message>Listener]  <==  C   ${evt.data.type} ${JSON.stringify(evt.data,null,2)}`)
        _server.handleMessageFromClient(evt.data);
    } else {
        console.log(`[ServiceWorker] _server not defined`);
    }
})

self.addEventListener('install', function(event) {
    event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim().then(() => {
        _server = new ServerProxy(message => broadcast(message))
    }))
});
