import { getLayoutModel2 as getLayoutModel } from './layout-json';
import {
  layout as applyLayout,
} from './layoutModel';
import { followPath, nextStep } from './pathUtils';
import { recomputeChildLayout } from './layout-utils';

// These are stretch values, need to import (dynamically)
const Display = {
  Block: 0,
  None: 1
}

export const Action = {
  DRAG_START: 'drag-start',
  DRAG_DROP: 'drag-drop',
  INITIALIZE: 'initialize',
  REMOVE: 'remove',
  SPLITTER_RESIZE: 'splitter-resize',
  SWITCH_TAB: 'switch-tab'
}

// TODO move these to reducer utils
const MISSING_HANDLER = (state, action) => {
  console.warn(`layoutActionHandlers. No handler for action.type ${action.type}`);
  return state;
};

const MISSING_TYPE = undefined;

const MISSING_TYPE_HANDLER = (state) => {
  console.warn(`layoutActionHandlers. Invalid action:  missing attribute 'type'`);
  return state;
};

const handlers = {
  [Action.DRAG_START]: dragStart,
  [Action.DRAG_DROP]: dragDrop,
  [Action.INITIALIZE]: initialize,
  [Action.REMOVE]: removeChild,
  [Action.SPLITTER_RESIZE]: splitterResize,
  [Action.SWITCH_TAB]: switchTab,
  [MISSING_TYPE]: MISSING_TYPE_HANDLER
}

export const initModel = ({type ,props}) =>
    initialize(null, {type: Action.INITIALIZE, layoutType: type, props})

export default (state, action) => (handlers[action.type] || MISSING_HANDLER)(state, action);

function initialize(state, action) {
  return applyLayout(getLayoutModel(action.layoutType, action.props));
}

function switchTab(state, {path, nextIdx}){
  var target = followPath(state, path);
  const manualLayout = {
      ...target,
      active: nextIdx,
      children: target.children.map((child, i) => {
        if (i === target.active){
          return {
            ...child,
            layoutStyle: {
              ...child.layoutStyle,
              display: Display.None
            }
          }
        } else if (i === nextIdx){
          return {
            ...child,
            layoutStyle: {
              ...child.layoutStyle,
              display: Display.Block
            }
          }
        } else {
          return child;
        }
      })
  };
  return replaceChild(state, target, manualLayout);
}

function splitterResize(state, { layoutModel, dim, path, measurements }) {
  console.log(`%csplitterResize ${dim} ${path} ${measurements}`,'color: blue;font-weight: bold;')
  // is target always the same as state ?
  const target = followPath(state, path);

  const manualLayout = {
      ...layoutModel,
      children: layoutModel.children.map((child,i) => {
          const {type, style: {flex, [dim]: _, ...childStyle}, layoutStyle: {[dim]: _1, ...childLayoutStyle } } = child;
          const {flexBasis, flexShrink=1, flexGrow=1} = childLayoutStyle;
          const measurement = measurements[i];
          if (type === 'Splitter' || flexBasis === measurement){
              return child;
          } else {
              return {
                  ...child,
                  layoutStyle: {
                      ...childLayoutStyle,
                      flexBasis: measurement
                  },
                  style: {
                      ...childStyle,
                      flexBasis: measurement,
                      flexShrink,
                      flexGrow
                  }
              }                
          }
      })
  };

  return replaceChild(state, target, manualLayout);

}

function replaceChild(model, child, replacement) {
  if (replacement.$path === model.$path) {
      return recomputeChildLayout(replacement, model.computedStyle, model.$path)
  } else {
      const manualLayout = _replaceChild(model, child, replacement);
      return recomputeChildLayout(manualLayout, model.computedStyle, model.$path)
  }
}

function _replaceChild(model, child, replacement){
  const { idx, finalStep } = nextStep(model.$path, child.$path);
  const children = model.children.slice();

  if (finalStep) {
      // can replacement evcer be an array - there used to be provision for that here
      children[idx] = {
          ...replacement,
          layout: {...child.layout}
      };
  } else {
      children[idx] = _replaceChild(children[idx], child, replacement);
  }
  return {...model, children};
}

function dragDrop({drag, ...state}, action){

  const {component: source} = drag;
  const {dropTarget: {component: target, pos}} = action;

  console.log(`drop ${source.style.backgroundColor} onto ${target.style.backgroundColor}`)

  if (pos.position.header){
    console.log(` ...position header`)
  } else if (pos.position.Centre){
    console.log(` ...position center`)
  } else {
    console.log(` ...position docked`)
  }

  return state;
}

function dragStart(state, {dragRect, dragPos,  ...action}){
  return removeChild({...state, drag: {dragRect, dragPos, component: action.layoutModel}}, action);
}

function removeChild(state, {layoutModel: child}) {
  const manualLayout = _removeChild(state, child)
  return recomputeChildLayout(manualLayout, state.computedStyle, state.$path)
}

function _removeChild(model, child){
  const { idx, finalStep } = nextStep(model.$path, child.$path);
  let children = model.children.slice();

  if (finalStep) {

      if (idx > 0 && isSplitter(children[idx - 1])) {
          children.splice(idx - 1, 2);
      } else if (idx === 0 && isSplitter(children[1])) {
          children.splice(0, 2);
      } else {
          children.splice(idx, 1);
      }

      if (children.length === 1 && model.type.match(/FlexBox|TabbedContainer/)) {
          console.log(`removing the only child of ${model.type} ${model.$path}`);
          return children[0];
      } 

  } else {
      children[idx] = _removeChild(children[idx], child);
  }

  children = children.map((child, i) => {
      var $path = `${model.$path}.${i}`;
      return child.$path === $path ? child : {...child, $path };
  })
  return { ...model, children };
}

function isSplitter(model) {
  return model && model.type === 'Splitter';
}
