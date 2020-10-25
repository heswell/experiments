// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import dataReducer from './grid-data-reducer';

//TODO allow subscription details to be set before subscribe call
export default function useDataSource(dataSource, subscriptionDetails, callback) {

  const isRunning = useRef(false);
  const frame = useRef(null);
  
  const latestState = useRef(null);
  function getLatestState(){
    let instance = latestState.current;
    if (instance !== null){
      return instance;
    }
    let newInstance = dataReducer(undefined, { 
      type: 'clear', 
      range: subscriptionDetails.range,
      bufferSize: dataSource.bufferSize
    })
    latestState.current = newInstance;
    return newInstance;
  }

  getLatestState();

  const messagesPerRender = useRef(0);

  const [rows, setRows] = useState(latestState.current.rows);

  const dispatchData = action => {
    latestState.current = dataReducer(latestState.current, action);
    // only if they have changed ...
    setRows(latestState.current.rows);
  }

  const dispatchUpdate = useCallback(action => {
    messagesPerRender.current += 1;
    latestState.current = dataReducer(latestState.current, action);
  }, []);

  const applyUpdate = () => {
    if (messagesPerRender.current > 0) {
      setRows(latestState.current.rows);
      messagesPerRender.current = 0;
    }

    if (isRunning.current) {
      //TODO disable the timeouts if we're scrolling
      // TODO pair this with a timeout that turns update mode back off if we go a while without updates
      frame.current = requestAnimationFrame(applyUpdate)
    }
  }

  const setRange = useCallback((lo, hi) => {
    dispatchData({type: 'range', range: {lo,hi}});
    if (latestState.current.dataRequired){
      console.log(`%csetRange [${lo},${hi}] dataRequired`,'color:brown;font-weight: bold;')
      dataSource.setRange(lo, hi);
    } else {
      console.log(`setRange [${lo},${hi}] NO dataRequired`)
    }
  }, [dataSource]);

  useEffect(() => {
    console.log(`%c Viewport useEffect dataSource changed - subscribe to new datasource`, 'color:blue;font-weight:bold;', dataSource)

    dataSource.subscribe(subscriptionDetails,
      function datasourceMessageHandler({ type: messageType, ...msg }) {
        if (messageType === 'subscribed') {
          return callback(messageType, msg.columns);
        }
        if (msg.size !== undefined) {
          callback('size', msg.size);
        } else if (msg.type === 'pivot') {
          // Callback is for data oriented operations, should this be emitted ?
          callback('pivot', msg.columns);
        }

        if (msg.filter !== undefined) {
          dataSource.emit('filter', msg.filter);
        }

        if (msg.rows) {
          dispatchData({
            type: "data",
            rows: msg.rows,
            rowCount: msg.size, // why the discrepance netween rowCount & size ?
            offset: msg.offset,
            range: msg.range,
          });
        } else if (msg.updates) {
          dispatchUpdate({
            type: 'update',
            updates: msg.updates
          })

          if (!isRunning.current) {
            isRunning.current = true;
            applyUpdate();
          }
        }
      }
    );

    return () => {
      dataSource.unsubscribe();
      dispatchData({
        type: "data",
        rows: [],
        rowCount: 0,
        range: { lo: 0, hi: 0 }
      });
    }

  }, [dataSource]);


  return [rows, setRange];
}