export function updateLoop(name, connection, interval, fn){
  
      //console.log(`starting update loop ${name} @  ${interval}`);
  
      let _keepGoing = true;
      let _timeoutHandle = null;
  
      function beat(){
  
          const message = fn();
  
          if (message !== null){
              connection.send(message);
          }	
          
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
  