const workerModule = process.env.WORKER_MODULE || '/web-worker.js';
console.log(`[ServerApi] workerModule = ${workerModule}`)
const asyncWorkerModule = import(/* webpackIgnore: true */ workerModule)
    .catch(err => console.log(`failed to load worker ${err}`));

let worker;

export async function getWorker(callback){
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
