import MessageQueue from '../MessageQueue';
import {findHandler as handlerFor} from '../requestHandlers';
import stomp from './stomp/stomp';

// we can have a separate clientId for XHR requests
let _clientId = 0;


export const requestHandler = (options, logger) => (socket) => {

    const{HEARTBEAT_FREQUENCY, PRIORITY_UPDATE_FREQUENCY, CLIENT_UPDATE_FREQUENCY} = options;

    socket.sessionId = stomp.StompUtils.genId();
    
    console.log('Server.websocketRequestHandler: connection request from new client');
  
    const _update_queue = new MessageQueue();
  
      // Note: these loops are all running per client, this will get expensive
      //const HEARTBEAT = JSON.stringify({type : 'HB', vsHostName:'localhost'});
      //const stopHeartBeats = updateLoop('HeartBeat', socket, HEARTBEAT_FREQUENCY, () => HEARTBEAT);
      const stopPriorityUpdates = updateLoop('Priority Updates', socket, PRIORITY_UPDATE_FREQUENCY, priorityQueueReader);
      const stopUpdates = updateLoop('Regular Updates', socket, CLIENT_UPDATE_FREQUENCY, queueReader);
  
      socket.on('message',function(data){
          console.log(`message in ${data}`);    
  
          let frame = stomp.StompUtils.parseFrame(data);
          let cmdFunc = stomp.frameHandler[frame.command];
          if (cmdFunc) {
            frame = frameParser(frame);
            cmdFunc(socket, frame);

            switch(frame.command){

              case 'CONNECT': break;

              case 'SUBSCRIBE':
                // need a protocol-aware transform to handle this
                handlerFor('subscribe')(socket.sessionId, frame.headers.destination, frame.headers.id, _update_queue);
                break;

              default:
                console.log(`don't currently handle ${frame.command}`);
            }
          }
  
      });
  
      socket.on('close',function(msg){
          
          console.log('viewserver, local CONNECTION closed');
  
          // how do we clear up the open subscription(s)
          // keep  alist od all active handlers and notify them
 
          //stopHeartBeats();
          stopPriorityUpdates();
          stopUpdates();
  
          // kill the update queue
  
      });
  
      function PRIORITY1(msg){
        return msg.priority === 1;
      } 
      const NO_MESSAGES = [];

      function priorityQueueReader(PRI){
          return _update_queue.extract(PRIORITY1);
      }
  
      function queueReader(){
        return _update_queue.queue;
      }
  
  };
  
  function frameParser(frame) {
    if (frame.body !== undefined && frame.headers['content-type'] === 'application/json') {
      frame.body = JSON.parse(frame.body);
    }
    return frame;
  }


function updateLoop(name, socket, interval, readQueue){
    
        //console.log(`starting update loop ${name} @  ${interval}`);
    
        let _keepGoing = true;
        let _timeoutHandle = null;
    
        function beat(){
    
            readQueue().forEach(message => {
              console.log(JSON.stringify(message));
              const {id, destination, correlationId} = message;
              stomp.StompUtils.sendCommand(socket, 'MESSAGE', {
                subscription:id, 
                destination, 
                'correlation-id': correlationId
              }, 
              JSON.stringify(message.body));
            });
            
            if (_keepGoing){
                _timeoutHandle = setTimeout(beat, interval);
            }
        }
    
        beat();
    
        function stopper(){
            console.log(`stopping updateLoop ${name}`);
            if (_timeoutHandle){
                clearTimeout(_timeoutHandle);
            }
            _keepGoing = false;
        }
    
        return stopper;
    
    
  }
    