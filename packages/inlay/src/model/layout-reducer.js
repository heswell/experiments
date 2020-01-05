import {uuid} from '@heswell/utils';
import { getLayoutModel2 as getLayoutModel } from './layout-json';
import {
  layout as applyLayout,
} from './layoutModel';
import { containerOf, followPath, followPathToParent, nextStep } from './path-utils';
import { computeLayout, recomputeChildLayout } from './layout-utils';
import { collectStyles } from './stretch';
import { removeVisualStyles } from './css-properties';

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
    return dropLayoutIntoContainer(state, pos, source, target);
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

function dropLayoutIntoContainer(layoutModel, pos, source, target) {

  var targetContainer = followPathToParent(layoutModel, target.$path);

  if (absoluteDrop(target, pos.position)) {
      return transform(layoutModel, { insert: { source, target, pos } });
  } else if (target === layoutModel || isDraggableRoot(layoutModel, target)) {
      // Can only be against the grain...
      if (withTheGrain(pos, target)) {
          throw Error('How the hell did we do this');
      } else { //onsole.log('CASE 4A) Works');
          //return transform(layout, { wrap: {target, source, pos }, releaseSpace}); 
      }
  } else if (withTheGrain(pos, targetContainer)) {
      if (pos.position.SouthOrEast) { //onsole.log(`CASE 4B) Works. Insert into container 'with the grain'`);
          return transform(layoutModel, { insert: { source, after: target, pos } });
      } else { //onsole.log('CASE 4C) Works');
          return transform(layoutModel, { insert: { source, before: target, pos } });
      }
  } else if (againstTheGrain(pos, targetContainer)) { //onsole.log('CASE 4D) Works.');
      return transform(layoutModel, { wrap: { target, source, pos } });
  } else if (isContainer(targetContainer)) {
      return transform(layoutModel, { wrap: { target, source, pos } });
  } else {
      console.log('no support right now for position = ' + pos.position);
  }
  return layoutModel;

}

// TODO do we still need surface
function absoluteDrop(target, position) {
  return target.type === 'Surface' && position.Absolute;
}

function transform(layoutModel, options) {

  var nodeToBeInserted;
  var nodeAfterWhichToInsert;
  var nodeBeforeWhichToInsert;
  var targetContainer;
  var nodeSize;

  for (var op in options) {
      var opts = options[op];
      switch (op) {

      case 'insert':

          nodeToBeInserted = opts.source;

          nodeSize = opts.pos ? (opts.pos.width || opts.pos.height) : undefined;

          if (opts.before) {
              //onsole.log(`transform: insert before ` + opts.before.$path);
              nodeBeforeWhichToInsert = opts.before.$path;
          } else if (opts.after) {
              //onsole.log(`transform: insert after ` + opts.after.$path);
              nodeAfterWhichToInsert = opts.after.$path;
          } else {
              targetContainer = opts.target.$path;
          }

          break;

      case 'wrap':

          layoutModel = wrap(layoutModel, opts.source, opts.target, opts.pos);

          break;
      default:

      }
  }

  if (nodeToBeInserted) {
      layoutModel = insert(layoutModel, nodeToBeInserted, targetContainer, nodeBeforeWhichToInsert, nodeAfterWhichToInsert, nodeSize);
  }

  return layoutModel;

}

// this is replaceChild with extras
function wrap(model, source, target, pos) {
  const manualLayout = _wrap(model, source, target, pos);
  //return layout(manualLayout, model.computedStyle, model.$path)
  // Can we get away with just a recomputeVhild here or do we need to computeLayout ?
  const {width, height, top, left} = manualLayout.computedStyle;
  return computeLayout(manualLayout, width, height, top, left, model.$path)

}

function _wrap(model, source, target, pos){

  const { idx, finalStep } = nextStep(model.$path, target.$path);
  const children = model.children.slice();

  if (finalStep) {
      const { type, flexDirection } = getLayoutSpec(pos);
      const active = type === 'TabbedContainer' || pos.position.SouthOrEast ? 1 : 0;
      target = children[idx];

      // var style = { position: null, transform: null, transformOrigin: null, flex: hasSize ? null : 1, [dim]: hasSize? size : undefined };
    // TODO handle scenario where items have been resized, so have flexBasis values set
      const style = {
        ...removeVisualStyles(target.style),
        flexDirection
      };

      // source only has position attributes because of dragging
      const {style: {left: _1, top: _2, ...sourceStyle}} = source;
      var wrapper = {
          type,
          active,
          $id: uuid(),
          style,
          resizeable: target.resizeable,
          children: (pos.position.SouthOrEast || pos.position.Header)
              ? [{...target, style: {...target.style, flex: 1}, resizeable: true},
                  {...source, style: {...sourceStyle}, resizeable: true}]
              : [{...source, style: {...sourceStyle}, resizeable: true},
                  {...target, style: {...target.style, flex: 1}, resizeable: true}]
      };

      children.splice(idx, 1, wrapper);

  } else {
      children[idx] = _wrap(children[idx], source, target, pos);
  }

  return {...model, children};

}

//TODO how are we going to allow dgar containers to be defined ?
function isDraggableRoot(layout, component) {

  if (component.$path === '0') {
      return true;
  }

  var container = containerOf(layout, component);
  if (container) {
      return container.type === 'App';
  } else {
      debugger;
  }
}

// Note: withTheGrain is not the negative of againstTheGrain - the difference lies in the 
// handling of non-Flexible containers, the response for which is always false;
function withTheGrain(pos, container) {

  return pos.position.NorthOrSouth ? isTower(container)
      : pos.position.EastOrWest ? isTerrace(container)
          : false;
}

function againstTheGrain(pos, layout) {

  return pos.position.EastOrWest ? isTower(layout) || isTabset(layout)
      : pos.position.NorthOrSouth ? isTerrace(layout) || isTabset(layout)
          : false;

}

function isTower(model) {
  return model.type === 'FlexBox' && model.style.flexDirection === 'column';
}

function isTerrace(model) {
  return model.type === 'FlexBox' && model.style.flexDirection !== 'column';
}

// maybe in layout-json ?
function getLayoutSpec(pos) {
  var type, flexDirection;

  if (pos.position.Header) {
      type = 'TabbedContainer';
      flexDirection = 'column';
  } else {
      type = 'FlexBox';
      if (pos.position.EastOrWest) {
          flexDirection = 'row';
      } else {
          flexDirection = 'column';
      }
  }

  return { type, flexDirection };
}
