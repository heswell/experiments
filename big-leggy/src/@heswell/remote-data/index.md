1) application imports connect from server-api

application calls connect(serverURI)

meanwhile, when UI renders ...

2) Grid creates a RemoteView 

RemoteView imports subscribe from server-api

subscribe returns a ClientSubscription, which RemoteView interacts with:
  1) invoking methods to initiate requests
  2) registering listener to receive responses 

  subscribe makes subscription request on the defaultConnection