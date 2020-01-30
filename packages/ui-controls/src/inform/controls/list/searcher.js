import {getKeyboardEvent} from '../../../utils/key-code';

export function searcher(values, callback){

  let keyDownTimer = null;
  let searchChars = '';

  // KeyboardHandler
  return (e) => {
    const stateEvt = getKeyboardEvent(e);
    if (stateEvt && stateEvt.type === 'text'){
      if (keyDownTimer !== null){
        clearTimeout(keyDownTimer);
      }
      searchChars += e.key;
      keyDownTimer = setTimeout(applySearch, 100);
    }
  }

  function applySearch(){
    const regex = new RegExp(`^${searchChars}`,'i')
    const hilitedIdx = values.findIndex(
      val => regex.test(val)
    )
    searchChars = '';
    keyDownTimer = null;

    if (hilitedIdx !== -1){
      callback(hilitedIdx);
    }
  }

}
