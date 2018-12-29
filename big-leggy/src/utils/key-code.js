import * as StateEvt from '../state-machinery/state-events';

export const TAB = 9;
export const LEFT = 37;
export const UP = 38;
export const RIGHT = 39;
export const DOWN = 40;
export const ENTER = 13;
export const ESC = 27;
export const BACKSPACE = 8;
export const SPACE = 20;

export function getKeyboardEvent(e){
  const {keyCode, shiftKey} = e;
  switch(keyCode){
      case DOWN: return StateEvt.DOWN;
      case UP: return StateEvt.UP;
      case LEFT: return StateEvt.LEFT;
      case RIGHT: return StateEvt.RIGHT;
      case ENTER: return StateEvt.ENTER;
      case ESC: return StateEvt.ESC;
      case TAB: return shiftKey ? StateEvt.TAB_BWD : StateEvt.TAB;
      default:
        // if (key.match(/[a-z0-9]/i)){
          return StateEvt.TEXT
        // }
  }
}
