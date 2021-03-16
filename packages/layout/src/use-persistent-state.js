import {useCallback} from 'react'; 

const state = new Map();

export default () => {

  const loadState = useCallback((id) => {
    console.log(`load state for id ${id}`)
    return state.get(id)
  },[])

  const saveState = useCallback((id, data) => {
    console.log(`save state for id ${id} ${JSON.stringify(data)}`)
    state.set(id, data)
  },[])

  return [loadState, saveState];
}