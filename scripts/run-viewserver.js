import startServer from './@heswell/server-core';
import {config} from './@heswell/viewserver/config';

console.log('server.mjs about to START SERVER');

startServer(config);