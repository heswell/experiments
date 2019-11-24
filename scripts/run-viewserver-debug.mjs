import startServer from '../packages/server-core/dist/debug.js';
import {config} from '../packages/viewserver/dist/index.mjs';

console.log('run-viewserver.js about to START SERVER');

startServer(config);