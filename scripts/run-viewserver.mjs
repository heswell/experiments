import core from '@heswell/server-core';
import viewserver from '@heswell/viewserver';

const { start } = core;
const { config } = viewserver;

console.log(JSON.stringify(config, null, 2));

console.log('run-viewserver.mjs about to START SERVER');

start(config);
