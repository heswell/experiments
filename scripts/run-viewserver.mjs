import startServer from '../packages/server-core/dist/index.mjs';
import {config} from '../packages/viewserver/dist/index.mjs';

console.log('run-viewserver.js about to START SERVER');

startServer(config);