#!/usr/bin/env node

const startServer = require('@heswell/server-core');
const {config} = require('@heswell/viewserver');

console.log('server.mjs about to START SERVER');

startServer(config);
