const startServer = require('../packages/server-core/dist');
const viewserver = require('../packages/viewserver/dist');

console.log('run-viewserver.js about to START SERVER');

startServer(viewserver.config);