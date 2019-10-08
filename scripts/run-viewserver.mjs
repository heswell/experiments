import startServer from '../packages/server-core/dist';
import {config} from '../packages/viewserver/dist';

console.log('run-viewserver.js about to START SERVER');

startServer(config);