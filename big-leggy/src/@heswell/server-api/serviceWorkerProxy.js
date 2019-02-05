navigator.serviceWorker.register('/serviceworker.js')
    // .then(registration => {
    //     if (navigator.serviceWorker.controller){
    //         console.log(`serviceWorker registered and active`)
    //     } else {
    //         console.log(`serviceWorker registered, but not yet active`)
    //     }
    // })
    .catch(err => {
        console.log(err)
    });

export default class Worker {

    //TODO allow connectionString to be passed in constructor
    constructor() {
        navigator.serviceWorker.addEventListener('message', message => {
            this._onmessage(message);
        });
        this.queuedRequests = [];

        if (navigator.serviceWorker.controller){
            Promise.resolve().then(() => {
                this._onmessage({data: {type: 'identify'}});
            });
        }
    }

    postMessage(message){
        this.sendIfReady(message);
    }

    sendIfReady(message) {
        if (navigator.serviceWorker.controller) {
            console.log(`[ServiceWorkerProxy]  ==>  ${message.type}`);
            navigator.serviceWorker.controller.postMessage(message);
        } else {
            this.queuedRequests.push(message);
        }
    }

    _onmessage(message){
        console.log(`message received from worker, no client is listening ${JSON.stringify(message)}`);
    }

    set onmessage(handler) {
        this._onmessage = handler;
    }

    terminate(){
        console.log(`terminate worker`);
    }

}
