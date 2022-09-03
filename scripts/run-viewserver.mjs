import startServer from '@heswell/server-core';
import { config } from '@heswell/viewserver';

console.log('run-viewserver.js about to START SERVER');

startServer(config);
