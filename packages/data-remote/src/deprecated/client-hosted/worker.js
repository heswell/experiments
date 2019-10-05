// Note: this file associates a single callback with a single worker, it cannot be shared across multiple clients
// each call to setCallback would overwrite previous

import {createLogger, logColor} from '../constants';

const logger = createLogger('worker', logColor.brown);

const workerModule = process.env.WORKER_MODULE || '/web-worker.js';
const asyncWorkerModule = import(/* webpackIgnore: true */ workerModule)
    .catch(err => logger.log(`failed to load worker ${err}`));

let worker;

export const setWorkerCallback = (callback) => {
    getWorker(callback);
}

export const postMessageToWorker = async (message) => {
    const worker = await getWorker();
    worker.postMessage(message);
}

async function getWorker(callback){
  return asyncWorkerModule.then(workerModule => {
      const Worker = workerModule.default;

      return worker || (worker = new Promise((resolve, reject) => {
          const w = new Worker();
          w.onmessage = ({data: message}) => {
              if (message.type === 'identify'){
                  // w.onmessage = messageFromTheWorker;
                  w.onmessage = callback;
                  resolve(w);
              } else {
                  reject(new Error('Worker failed to identify'));
              }
          };
      }))

  });
}
