import {useCallback} from 'react'; 

export const PERSISTENT = "persistent";
export const SESSION = "session";

const persistentState = new Map();
const sessionState = new Map();

export default () => {

  const loadState = useCallback((id, key, stateType=PERSISTENT) => {
    console.log(`load state for id ${id} (key: ${key})`)

    const store = stateType === PERSISTENT ? persistentState : sessionState;
    const state = store.get(id);

    if (state){
      if (key !== undefined && state[key] !== undefined){
        return state[key];
      } else {
        return state;
      }
    } 
  },[])

  const saveState = useCallback((id, key, data, stateType=PERSISTENT) => {
    const store = stateType === PERSISTENT ? persistentState : sessionState;
    console.log(`save state for id ${id} (key ${key}) ${JSON.stringify(data)}`)
    if (key == undefined){
      store.set(id, data)
    } else if (store.has(id)){
      const state = store.get(id);
      store.set(id, {
        ...state,
        [key]: data
      })
    } else {
      store.set(id, {[key]: data})

    }
  },[]);

  const purgeState = useCallback((id, key, stateType=PERSISTENT) => {
    const store = stateType === PERSISTENT ? persistentState : sessionState;
    if (store.has(id)){
      if (key === undefined){
        store.delete(id);
      } else {
        const state = store.get(id);
        if (state[key]){
          const {
            [key]: _doomedState,
            ...rest
          } = store.get(id);
          if (Object.keys(rest).lenth > 0){
            store.set(id, rest)
          }
        }
      }
    }  


  },[]);

  return [loadState, saveState, purgeState];
}