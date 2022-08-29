import startServer from '../packages/server-core/src/index.js';
import { config } from '../packages/viewserver/src/index.js';

console.log('run-viewserver.js about to START SERVER');

startServer(config);
