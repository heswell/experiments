server-api

initialize a defaultConnection oject 

1) status

{
  status: pending
  resolve
  reject
}

2) pendingConnection - a promise for the eventual connection 
  resolver stored in defaultConnection object baove

3) getDefaultConnection method

getDefaultConnetion = () => pendingConnection

Any clients that call getDefaultConnection before the connection is
actually established will block until the connection is opened


The connection is eventually resolved to a new ServerApi when we receive a 
ConnectionStatus.ready message from server.

Blocked clients will all be waiting for subscribe to complete. If their
own clients have made further requests beyond subscribe, they will be
queued.


connect

set defaultConnection status to connecting, if this is the first request
for the default connection

return a promise for this connection, store the resolver in pendingPromises
store the promise in connections[connectionString]. Return same promise for
subsequent requests to connect to same connectionString

getWorker (async) then post a connect message to server. This will eventually
get response in messageFromTheWorker

so we now have 1 promise for default connection ans an additional promise
for each connect request

in defaultConnection (the resolve) and pendingConnection (the promise)
and pendingPromises (resolve)



messageFromTheWorker: ConnectionStatus.ready

1) get pendingPromise - resolve, connectionString, isDefaultConnection & timeoutHandle
2) create a connection (ServerAPI) store it under connections[connectionString]
Note: connections[connectionString] is now an actual connection, not a promise
this is surely going to break some clients ?
3) resolve(connection) . Because multiple client requests for the same connectionString
have been returned te same promise, this will reoslve it for all waiting clients
4) if this is the default connection, resolve that as well

At the moment, this weird behaviour of connect works because were just calling it
once to establish the defaultConnection, but it isn't correct


The sequence right now is

1) application calls connect, ignoring the returned Promise<connection>
2) when resolved, this will become the default connection
3) client requests to subs ribe in the meantime will block on getDefaultCOnnection
until the above resolves.


This defaultConnection is used to subscribe clients and to handle client queries

