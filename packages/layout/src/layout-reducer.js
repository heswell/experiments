import React from "react";
import { uuid } from "@heswell/utils";
import { Action } from "./layout-action";
import {
  containerOf,
  followPath,
  followPathToParent,
  nextStep,
  resetPath,
  typeOf
} from "./utils";
import { getManagedDimension } from "./layoutUtils";
import { ComponentRegistry, isContainer } from "./registry/ComponentRegistry";

const MISSING_TYPE = undefined;

const MISSING_HANDLER = (state, action) => {
  console.warn(
    `layoutActionHandlers. No handler for action.type ${action.type}`
  );
  return state;
};

const MISSING_TYPE_HANDLER = (state) => {
  console.warn(
    `layoutActionHandlers. Invalid action:  missing attribute 'type'`
  );
  return state;
};

const handlers = {
  [Action.DRAG_STARTED]: dragStart,
  [Action.DRAG_DROP]: dragDrop,
  [Action.SPLITTER_RESIZE]: splitterResize,
  [Action.REMOVE]: removeChild,
  [Action.SWITCH_TAB]: switchTab,
  [MISSING_TYPE]: MISSING_TYPE_HANDLER
};

export default (state, action) => {
  return (handlers[action.type] || MISSING_HANDLER)(state, action);
};

function switchTab(state, { path, nextIdx }) {
  var target = followPath(state, path);
  let replacement;
  if (React.isValidElement(target)) {
    replacement = React.cloneElement(target, { active: nextIdx });
  } else {
    replacement = {
      ...target,
      active: nextIdx
    };
  }
  return swapChild(state, target, replacement);
}

function splitterResize(state, { path, sizes }) {
  const target = followPath(state, path);
  let replacement;
  if (React.isValidElement(target)) {
    const children = target.props.children.map((child, i) => {
      const dim =
        target.props.style.flexDirection === "column" ? "height" : "width";
      const {
        style: { [dim]: size, flexBasis }
      } = child.props;
      if (size === sizes[i] || flexBasis === sizes[i]) {
        return child;
      } else {
        return React.cloneElement(child, {
          style: applySize(child.props.style, dim, sizes[i])
        });
      }
    });
    replacement = React.cloneElement(target, null, children);
  } else {
    replacement = {
      ...target,
      children: target.children.map((child, i) => {
        const dim =
          target.style.flexDirection === "column" ? "height" : "width";
        const {
          style: { [dim]: size, flexBasis }
        } = child.props;
        if (size === sizes[i] || flexBasis === sizes[i]) {
          return child;
        } else {
          return React.cloneElement(child, {
            style: applySize(child.props.style, dim, sizes[i])
          });
        }
      })
    };
  }
  return swapChild(state, target, replacement);
}

function applySize(style, dim, newSize) {
  const hasSize = typeof style[dim] === "number";
  const { flexShrink = 1, flexGrow = 1 } = style;
  return {
    ...style,
    [dim]: hasSize ? newSize : "auto",
    flexBasis: hasSize ? "auto" : newSize,
    flexShrink,
    flexGrow
  };
}

function swapChild(model, child, replacement) {
  if (model === child) {
    return replacement;
  } else {
    if (React.isValidElement(model)) {
      const { idx, finalStep } = nextStep(model.props.path, child.props.path);
      const children = model.props.children.slice();
      if (finalStep) {
        children[idx] = replacement;
      } else {
        children[idx] = swapChild(children[idx], child, replacement);
      }
      return React.cloneElement(model, null, children);
    } else {
      const { idx, finalStep } = nextStep(model.path, child.props.path);
      const children = model.children.slice();
      if (finalStep) {
        children[idx] = replacement;
      } else {
        children[idx] = swapChild(children[idx], child, replacement);
      }
      return { ...model, children };
    }
  }
}

/**
 *  We will be passed a component to drag (with instructions)
 * OR a path, which indicates that a component within the layout
 * is to be extracted and dragged to a new position.
 */
function dragStart(
  state,
  { component, dragRect, dragPos, instructions, path }
) {
  if (React.isValidElement(state)) {
    var draggable = component || followPath(state, path);

    const newState = React.cloneElement(state, {
      drag: { dragRect, dragPos, dragPath: path, draggable }
    });

    if (instructions && instructions.DoNotRemove) {
      return newState;
    } else {
      return _removeChild(newState, draggable);
    }
  } else {
    console.log(`layout-reducer: dragStart, expected React element`);
  }
}

function dragDrop(state, action) {
  const { draggable: source } = state.props.drag;
  const {
    dropTarget: { component: target, pos },
    targetRect,
    targetPosition
  } = action;

  if (pos.position.Header) {
    if (typeOf(target) === "Stack") {
      let before, after;
      const tabIndex = pos.tab.index;
      if (pos.tab.index === -1 || tabIndex >= target.props.children.length) {
        ({
          props: { path: after }
        } = target.props.children[target.props.children.length - 1]);
      } else {
        ({
          props: { path: before }
        } = target.props.children[tabIndex]);
      }
      return insert(state, source, null, before, after);
    } else {
      return wrap(state, source, target, pos);
    }
  } else if (pos.position.Centre) {
     console.log("REPLACE");
    // return replaceChild(state, {
    //   target: followPath(state, target.$path),
    //   replacement: source
    // });
  } else {
    return dropLayoutIntoContainer(
      state,
      pos,
      source,
      target,
      targetPosition,
      targetRect
    );
  }

  return React.cloneElement(state, {
    drag: null
  });
}

function removeChild(state, { path }) {
  var target = followPath(state, path);
  return _removeChild(state, target);
}

function _removeChild(model, child) {
  if (React.isValidElement(model)) {
    let { active, path } = model.props;
    const { idx, finalStep } = nextStep(model.props.path, child.props.path);
    const type = typeOf(model);
    let children = model.props.children.slice();
    if (finalStep) {
      children.splice(idx, 1);
      if (active !== undefined && active >= idx) {
        active = Math.max(0, active - 1);
      }

      if (children.length === 1 && type.match(/Flexbox|Stack/)) {
        return unwrap(model, children[0]);
      }
    } else {
      children[idx] = _removeChild(children[idx], child);
    }
    children = children.map((child, i) => resetPath(child, `${path}.${i}`));
    return React.cloneElement(model, { active }, children);
  } else {
    // TODO see if we can eliminate this branch. It's when we process a root
    // which is not DraggableLayout
    const { idx, finalStep } = nextStep(model.path, child.props.path);
    let children = model.children.slice();
    let { active, path, type } = model;

    if (finalStep) {
      children.splice(idx, 1);

      if (active !== undefined && active >= idx) {
        active = Math.max(0, active - 1);
      }

      if (children.length === 1 && type.match(/Flexbox|Stack/)) {
        return unwrap(model, children[0]);
      }
    } else {
      children[idx] = _removeChild(children[idx], child);
    }

    children = children.map((child, i) => resetPath(child, `${path}.${i}`));

    return { ...model, active, children };
  }
}

function unwrap(state, child) {
  const type = typeOf(state);
  const {
    path,
    drag,
    style: { flexBasis, flexGrow, flexShrink, width, height }
  } = state.props;

  let unwrappedChild = resetPath(child, path);
  if (path === "0") {
    unwrappedChild = React.cloneElement(unwrappedChild, {
      drag,
      style: {
        ...child.style,
        width,
        height
      }
    });
  } else if (type === "Flexbox") {
    const dim =
      state.props.style.flexDirection === "column" ? "height" : "width";
    const {
      style: { [dim]: size, ...style }
    } = unwrappedChild.props;
    // Need to overwrite key
    unwrappedChild = React.cloneElement(unwrappedChild, {
      // Need to assign key
      drag,
      style: {
        ...style,
        flexGrow,
        flexShrink,
        flexBasis
      }
    });
  }
  return unwrappedChild;
}

function dropLayoutIntoContainer(
  layoutModel,
  pos,
  source,
  target,
  targetPosition,
  targetRect
) {
  if (target.props.path === "0") {
    if (typeOf(target) === "Surface") {
      const { style, layoutStyle, computedStyle } = source;
      const { left, top } = targetPosition;
      return {
        ...layoutModel,
        children: layoutModel.children.concat({
          ...source,
          style: { ...style, left, top },
          layoutStyle: { ...layoutStyle, left, top },
          computedStyle: { ...computedStyle, left, top }
        })
      };
    } else {
      return wrap(layoutModel, source, target, pos);
    }
  } else {
    var targetContainer = followPathToParent(layoutModel, target.props.path);

    if (absoluteDrop(target, pos.position)) {
      return insert(
        layoutModel,
        source,
        target.props.path,
        null,
        null,
        pos.width || pos.height
      );
    } else if (target === layoutModel || isDraggableRoot(layoutModel, target)) {
      // Can only be against the grain...
      if (withTheGrain(pos, target)) {
        throw Error("How the hell did we do this");
      } else {
        //onsole.log('CASE 4A) Works');
        //return transform(layout, { wrap: {target, source, pos }, releaseSpace});
      }
    } else if (withTheGrain(pos, targetContainer)) {
      if (pos.position.SouthOrEast) {
        return insert(
          layoutModel,
          source,
          null,
          null,
          target.props.path,
          pos.width || pos.height,
          targetRect
        );
      } else {
        return insert(
          layoutModel,
          source,
          null,
          target.props.path,
          null,
          pos.width || pos.height,
          targetRect
        );
      }
    } else if (againstTheGrain(pos, targetContainer)) {
      return wrap(layoutModel, source, target, pos, targetRect);
    } else if (isContainer(targetContainer)) {
      return wrap(layoutModel, source, target, pos, targetRect);
    } else {
      console.log("no support right now for position = " + pos.position);
    }
  }

  return layoutModel;
}

// this is replaceChild with extras
function wrap(model, source, target, pos, targetRect) {
  return target.props.path === model.props.path
    ? _wrapRoot(model, source, pos, targetRect)
    : _wrap(model, source, target, pos, targetRect);
}

function _wrapRoot(model, source, pos, targetRect) {
  const { type, flexDirection } = getLayoutSpec(pos);
  const style = {
    ...model.props.style,
    flexDirection,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0
  };
  // source only has position attributes because of dragging
  const {
    style: { left: _1, top: _2, ...sourceStyle }
  } = source.props;
  const active = type === "Stack" || pos.position.SouthOrEast ? 1 : 0;
  const [dim] = getManagedDimension(style);
  const sourceFlex =
    typeof pos[dim] === "number"
      ? { flexGrow: 0, flexShrink: 0, flexBasis: pos[dim] }
      : { flex: 1 };

  const targetFirst = pos.position.SouthOrEast || pos.position.Header;

  const nestedSource = React.cloneElement(source, {
    style: { ...sourceStyle, ...sourceFlex },
    resizeable: true
  });

  const nestedTarget = React.cloneElement(model, {
    style: {
      ...model.props.style,
      flexBasis: 0,
      flexGrow: 1,
      flexShrink: 1,
      width: "auto",
      height: "auto"
    },
    resizeable: true
  });
  var wrapper = React.createElement(
    ComponentRegistry[type],
    {
      layoutId: uuid(),
      path: "0",
      active,
      dispatch: model.props.dispatch,
      style,
      resizeable: true
    },
    targetFirst
      ? [resetPath(nestedTarget, "0.0"), resetPath(nestedSource, "0.1")]
      : [resetPath(nestedSource, "0.0"), resetPath(nestedTarget, "0.1")]
  );
  return wrapper;
}

function _wrap(model, source, target, pos, targetRect) {
  const { idx, finalStep } = nextStep(model.props.path, target.props.path);
  const children = model.props.children.slice();

  if (finalStep) {
    const { type, flexDirection } = getLayoutSpec(pos);
    const active = type === "Stack" || pos.position.SouthOrEast ? 1 : 0;
    target = children[idx];

    // TODO handle scenario where items have been resized, so have flexBasis values set
    const style = {
      ...target.props.style,
      flexDirection
    };

    // This assumes flexBox ...
    const flexStyles = {
      flexBasis: 0,
      flexGrow: 1,
      flexShrink: 1,
      width: "auto",
      height: "auto"
    };
    const targetFirst = pos.position.SouthOrEast || pos.position.Header;
    const nestedSource = React.cloneElement(source, {
      path: `${target.props.path}.${targetFirst ? 1 : 0}`,
      style: {
        ...source.props.style,
        ...flexStyles
      }
    });
    const nestedTarget = React.cloneElement(target, {
      path: `${target.props.path}.${targetFirst ? 0 : 1}`,
      style: {
        ...target.props.style,
        ...flexStyles
      }
    });

    const id = uuid();
    var wrapper = React.createElement(
      ComponentRegistry[type],
      {
        active,
        dispatch: target.props.dispatch,
        layoutId: id,
        key: id,
        path: target.props.path,
        // TODO we should be able to configure this in setDefaultLayoutProps
        splitterSize:
          type === "Flexbox" && typeOf(model) === "Flexbox"
            ? model.props.splitterSize
            : undefined,
        style,
        resizeable: target.props.resizeable
      },
      targetFirst ? [nestedTarget, nestedSource] : [nestedSource, nestedTarget]
    );

    children.splice(idx, 1, wrapper);
  } else {
    children[idx] = _wrap(children[idx], source, target, pos, targetRect);
  }
  return React.cloneElement(model, null, children);
}

function insert(model, source, into, before, after, size, targetRect) {
  const type = typeOf(model);
  let { active } = model.props;
  const { path } = model.props;
  const target = before || after || into;
  let { idx, finalStep } = nextStep(path, target);
  let children;

  // One more step needed when we're inserting 'into' a container
  var oneMoreStepNeeded = finalStep && into && idx !== -1;

  if (finalStep && !oneMoreStepNeeded) {
    const isFlexBox = type === "Flexbox";

    if (type === "Surface" && idx === -1) {
      children = model.children.concat(source);
    } else {
      const [dim] = getManagedDimension(model.props.style);
      //TODO how do we identify splitter width
      //TODO checj reiizeable to make sure a splitter will be present
      function assignSizes(rect, dim, size) {
        if (typeof size === "number") {
          return [size, rect[dim] - size - 11];
        } else {
          const measurement = (targetRect[dim] - 11) / 2;
          return [measurement, measurement];
        }
      }

      children = model.props.children.reduce((arr, child, i) => {
        if (idx === i) {
          if (isFlexBox) {
            const [sourceMeasurement, childMeasurement] = assignSizes(
              targetRect,
              dim,
              size
            );
            // TODO if size is supplied, it must be respected
            source = assignFlexDimension(source, dim, sourceMeasurement);
            child = assignFlexDimension(child, dim, childMeasurement);
          } else {
            const {
              style: {
                left: _1,
                top: _2,
                flex: _3,
                width,
                height,
                transform: _4,
                transformOrigin: _5,
                ...style
              }
            } = source.props;
            const dimensions = source.props.resizeable ? {} : { width, height };
            source = React.cloneElement(source, {
              style: { ...style, ...dimensions }
            });
          }
          if (before) {
            arr.push(source, child);
          } else {
            arr.push(child, source);
          }
        } else {
          // arr.push(assignFlexDimension(child, dim, measurement));
          arr.push(child);
        }
        return arr;
      }, []);

      const insertedIdx = children.indexOf(source);
      if (type === "Stack") {
        active = insertedIdx;
      }

      children = children.map((child, i) =>
        i < insertedIdx ? child : resetPath(child, `${path}.${i}`)
      );
    }
  } else {
    children = model.props.children.slice();
    children[idx] = insert(
      children[idx],
      source,
      into,
      before,
      after,
      size,
      targetRect
    );
  }
  return React.cloneElement(model, { ...model.props, active }, children);
}

function assignFlexDimension(model, dim, size = 0) {
  const {
    style: { flex, flexBasis, height, width, ...otherStyles }
  } = model.props;
  const { [dim]: currentSize } = { height, width };

  if ((flexBasis === "auto" && currentSize === size) || flexBasis === size) {
    return model;
  }

  const style = {
    ...otherStyles,
    [dim]: "auto",
    flexBasis: size,
    flexGrow: 0,
    flexShrink: 0
  };

  return React.cloneElement(model, {
    style
  });
}

// TODO do we still need surface
function absoluteDrop(target, position) {
  return typeOf(target) === "Surface" && position.Absolute;
}

//TODO how are we going to allow dgar containers to be defined ?
function isDraggableRoot(layout, component) {
  if (component.props.path === "0") {
    return true;
  }

  var container = containerOf(layout, component);
  if (container) {
    return typeOf(container) === "App";
  } else {
    debugger;
  }
}

// Note: withTheGrain is not the negative of againstTheGrain - the difference lies in the
// handling of non-Flexible containers, the response for which is always false;
function withTheGrain(pos, container) {
  return pos.position.NorthOrSouth
    ? isTower(container)
    : pos.position.EastOrWest
    ? isTerrace(container)
    : false;
}

function againstTheGrain(pos, layout) {
  return pos.position.EastOrWest
    ? isTower(layout) || isStacket(layout)
    : pos.position.NorthOrSouth
    ? isTerrace(layout) || isStacket(layout)
    : false;
}

function isTower(model) {
  return (
    typeOf(model) === "Flexbox" && model.props.style.flexDirection === "column"
  );
}

function isTerrace(model) {
  return (
    typeOf(model) === "Flexbox" && model.props.style.flexDirection !== "column"
  );
}

function isStacket(model) {
  return typeOf(model) === "Stack";
}

// maybe in layout-json ?
function getLayoutSpec(pos) {
  var type, flexDirection;

  if (pos.position.Header) {
    type = "Stack";
    flexDirection = "column";
  } else {
    type = "Flexbox";
    if (pos.position.EastOrWest) {
      flexDirection = "row";
    } else {
      flexDirection = "column";
    }
  }

  return { type, flexDirection };
}
