import { WebSocket } from "ws";

export function updateLoop(name: string, connection: WebSocket, interval: number, readQueue: () => any) {
  console.log(`starting update loop ${name} @  ${interval}`);

  let _keepGoing = true;
  let _timeoutHandle: NodeJS.Timeout | null = null;

  function tick() {
    const queuedMessages = readQueue();

    if (Array.isArray(queuedMessages)) {
      for (const message of queuedMessages) {
        connection.send(JSON.stringify(message));
      }
    } else if (typeof queuedMessages === 'string') {
      connection.send(queuedMessages);
    }

    if (_keepGoing) {
      _timeoutHandle = setTimeout(tick, interval);
    }
  }

  tick();

  function stopper() {
    console.log(`stopping updateLoop ${name}`);
    if (_timeoutHandle) {
      clearTimeout(_timeoutHandle);
    }
    _keepGoing = false;
  }

  return stopper;
}
