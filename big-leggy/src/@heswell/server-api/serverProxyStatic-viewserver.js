import {ServerProxy as BaseServerProxy} from './serverProxy.mjs';
import Server from './servers/viewserver.mjs';
import Connection from './connectionStatic-websocket.js';

export class ServerProxy extends BaseServerProxy {
    connect({connectionString, connectionId=0}) {
        this.connectionStatus = 'connecting';

        const server = this.server = new Server();
        console.log(`[serverProxyStatic.connect]`)
        Connection.connect(connectionString).then(connection => {
            // shouldn't we read connection status from the connection object itself
            this.connection = connection;

            // call the server to group messages by viewport, then invoke each batch with the subscription for that viewport
            connection.on('message', (evtName, msg) => {
                return this.receiveMessageFromServer(msg);
            });

            if (server.connectionPipeline) {
                const [first, ...rest] = server.connectionPipeline;
                rest.reduce((result, next) => result
                    .then(next), first(connection))
                    .then(() => this.onReady(connectionId));
            } else {
                this.onReady(connectionId);
            }

        });

    }
};