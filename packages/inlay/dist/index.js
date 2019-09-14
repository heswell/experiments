import React, { Component as Component$1 } from 'react';
import { uuid } from '@heswell/utils';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import { ContextMenu, MenuItem, Separator, PopupService } from '@heswell/ui-controls';
import yoga, { Node } from 'yoga-layout';
import Konva from 'konva';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

const _containers = {};
const ComponentRegistry = {};
function isContainer(className) {
  return _containers[className] === true;
}
function registerClass(className, component, isContainer) {
  ComponentRegistry[className] = component;

  if (isContainer) {
    _containers[className] = true;
  }
}

function typeOf(element) {
  var type;

  if (typeof element.type === 'function') {
    type = element.type.displayName || element.type.name;
  } else if (typeof element.type === 'string') {
    type = element.type;
  } else if (element.constructor) {
    type = element.constructor.displayName;
  } else {
    debugger;
  }

  return type;
} //TODO components should be able to register props here

const LayoutProps = {
  resizeable: true,
  header: true,
  title: true,
  active: true,
  tabstripHeight: true,
  dragStyle: true
};

function layoutProps({
  props
}) {
  const results = {};
  Object.entries(props).forEach(([key, value]) => {
    if (LayoutProps[key]) {
      results[key] = value;
    }
  });
  return results;
}

const getLayoutModel = component => ({
  type: typeOf(component),
  $id: component.props.id || uuid(),
  ...layoutProps(component),
  style: component.props.style,
  children: isLayout$1(component) ? getLayoutModelChildren(component) : []
});

function getLayoutModelChildren(component) {
  var {
    children,
    contentModel = null
  } = component.props; // TODO don't recurse into children of non-layout

  if (React.isValidElement(children)) {
    return [getLayoutModel(children)];
  } else if (Array.isArray(children)) {
    return children.filter(child => child).map(child => getLayoutModel(child));
  } else if (contentModel !== null) {
    return [contentModel];
  } else {
    return []; // is this safe ?
  }
}

function isLayout$1(element) {
  if (typeof element !== 'string') {
    element = element.type && element.type.displayName || element.constructor && element.constructor.displayName;
  }

  return isContainer(element);
}
// 	return type === 'FlexBox' || type === 'TabbedContainer';
// }

class ComponentHeader extends React.Component {
  render() {
    var {
      style,
      fixed,
      minimized,
      onMouseDown,
      menu = true
    } = this.props;
    return React.createElement("header", {
      className: "ComponentHeader",
      onMouseDown: onMouseDown,
      style: style
    }, React.createElement("span", {
      className: "title"
    }, this.props.title), fixed && !minimized ? React.createElement("span", {
      className: "icon-pushpin"
    }) : null, menu && React.createElement("button", {
      className: "icon-menu",
      "data-key": "menu",
      onClick: e => this.handleMenuClick(e)
    }));
  }

  handleMenuClick(e) {
    if (this.props.onAction) {
      this.props.onAction('menu', {
        left: e.clientX,
        top: e.clientY
      });
    }
  }

}

class ComponentContextMenu extends React.Component {
  render() {
    return React.createElement(ContextMenu, {
      doAction: this.props.doAction
    }, this.menuItems());
  }

  menuItems() {
    var {
      state,
      children: targetComponent
    } = this.props.component.props; // state is too vague

    var minimized = state === 1;
    var maximized = state === 2;
    var normal = !(maximized || minimized);
    console.log(`ComponentContextMenu.menuItems minimized=${minimized}`);
    var menuItems = []; // menuItems.push(	<MenuItem action="pin" label="Fix Size"/> );

    menuItems.push(React.createElement(MenuItem, {
      key: "remove",
      action: "remove",
      label: "Remove"
    }));

    if (normal) {
      menuItems.push(React.createElement(MenuItem, {
        key: "minimize",
        action: "minimize",
        label: "Minimize"
      }), React.createElement(MenuItem, {
        key: "maximize",
        action: "maximize",
        label: "Maximize"
      }));
    } else {
      menuItems.push(React.createElement(MenuItem, {
        key: "restore",
        action: "restore",
        label: "Restore"
      }));
    }

    var {
      contextMenuItems = []
    } = targetComponent.props;
    const componentMenuItems = contextMenuItems.map(({
      text,
      action
    }) => React.createElement(MenuItem, {
      key: action,
      action: action,
      label: text
    }));

    if (componentMenuItems.length) {
      menuItems.push(React.createElement(Separator, {
        key: "1"
      }), ...componentMenuItems);
    }

    menuItems.push(React.createElement(Separator, {
      key: "1"
    }), React.createElement(MenuItem, {
      key: "settings",
      action: "settings",
      label: "Settings"
    }));
    return menuItems;
  }

}

const LAYOUT_REMOVE = 'LAYOUT_REMOVE';
const LAYOUT_REPLACE = 'LAYOUT_REPLACE';
const LAYOUT_SWITCH_TAB = 'LAYOUT_SWITCH_TAB';
const remove = targetNode => ({
  type: LAYOUT_REMOVE,
  targetNode
});
const replace = (targetNode, replacementNode) => ({
  type: LAYOUT_REPLACE,
  targetNode,
  replacementNode
});
const switchTab = (path, idx, nextIdx) => ({
  type: LAYOUT_SWITCH_TAB,
  path,
  idx,
  nextIdx
});

var positionValues = {
  'north': 1,
  'east': 2,
  'south': 4,
  'west': 8,
  'header': 16,
  'centre': 32,
  'absolute': 64
};
var Position = Object.freeze({
  'North': _position('north'),
  'East': _position('east'),
  'South': _position('south'),
  'West': _position('west'),
  'Header': _position('header'),
  'Centre': _position('centre'),
  'Absolute': _position('absolute')
});

function _position(str) {
  return Object.freeze({
    offset: str === 'north' || str === 'west' ? 0 : str === 'south' || str === 'east' ? 1 : NaN,
    valueOf: function () {
      return positionValues[str];
    },
    toString: function () {
      return str;
    },
    North: str === 'north',
    South: str === 'south',
    East: str === 'east',
    West: str === 'west',
    Header: str === 'header',
    Centre: str === 'centre',
    NorthOrSouth: str === 'north' || str === 'south',
    EastOrWest: str === 'east' || str === 'west',
    NorthOrWest: str === 'north' || str === 'west',
    SouthOrEast: str === 'east' || str === 'south',
    Absolute: str === 'absolute'
  });
}

var NORTH = Position.North,
    SOUTH = Position.South,
    EAST = Position.East,
    WEST = Position.West,
    HEADER = Position.Header,
    CENTRE = Position.Centre;
class BoxModel {
  //TODO we should accept initial let,top offsets here
  static measure(model) {
    var measurements = {};
    addMeasurements(model, measurements, 0, 0, 0, 0, 0, 0);
    return measurements;
  }

  static smallestBoxContainingPoint(layout, measurements, x, y) {
    return smallestBoxContainingPoint(layout, measurements, x, y);
  }

  static pointPositionWithinRect(x, y, rect) {
    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    const posX = x - rect.left;
    const posY = y - rect.top;
    const pctX = posX / width;
    const pctY = posY / height;
    var closeToTheEdge;
    var position;
    const borderZone = 30;

    if (rect.header && containsPoint(rect.header, x, y)) {
      position = HEADER;
    } else {
      const w = width * 0.4;
      const h = height * 0.4;
      const centerBox = {
        left: rect.left + w,
        top: rect.top + h,
        right: rect.right - w,
        bottom: rect.bottom - h
      };

      if (containsPoint(centerBox, x, y)) {
        position = CENTRE;
      } else {
        const quadrant = (pctY < 0.5 ? 'north' : 'south') + (pctX < 0.5 ? 'west' : 'east');

        switch (quadrant) {
          case 'northwest':
            position = pctX > pctY ? NORTH : WEST;
            break;

          case 'northeast':
            position = 1 - pctX > pctY ? NORTH : EAST;
            break;

          case 'southeast':
            position = pctX > pctY ? EAST : SOUTH;
            break;

          case 'southwest':
            position = 1 - pctX > pctY ? WEST : SOUTH;
            break;

          default:
        }
      }
    } // Set closeToTheEdge even when we have already established that we are in a Header.
    // When we use position to walk the containment hierarchy, building the chain of
    // dropTargets, the Header loses significance after the first dropTarget, but
    // closeToTheEdge remains meaningful.


    {
      // var closeToTheEdge = 0;
      if (posX < borderZone) closeToTheEdge += 8;
      if (posX > width - borderZone) closeToTheEdge += 2;
      if (posY < borderZone) closeToTheEdge += 1;
      if (posY > height - borderZone) closeToTheEdge += 4;
    } // we might want to also know if we are in the center - this will be used to allow
    // stack default option


    return {
      position,
      x,
      y,
      pctX,
      pctY,
      closeToTheEdge
    };
  }

}

function addMeasurements(model, measurements, x, y, preX, posX, preY, posY) {
  var componentMeasurements;

  if (model) {
    //onsole.log(`\naddMeasurements			x:${x}	y:${y}	preX:${preX}	posX:${posX}	preY:${preY}	posY:${posY}   ${model.type} ${model.type === 'FlexBox' ? model.style.flexDirection :''} ${model.$path}`);
    componentMeasurements = addClientMeasurements(model, measurements, x, y, preX, posX, preY, posY);

    if (model.children) {
      collectChildMeasurements(model, measurements, model.layout.left + x, model.layout.top + y, preX, posX, preY, posY);
    }
  }

  return componentMeasurements;
}

function addClientMeasurements(model, measurements, x, y, preX, posX, preY, posY) {
  var {
    $path,
    header
  } = model;
  var {
    top,
    left,
    width,
    height
  } = model.layout;
  left = x + left - preX;
  top = y + top - preY;
  var right = preX + left + width + posX;
  measurements[$path] = {
    top,
    left,
    right,
    bottom: preY + top + height + posY
  };

  if (header || model.type === 'TabbedContainer') {
    //TODO don't assume headerheight = 34
    measurements[$path].header = {
      top,
      left,
      right,
      bottom: top + 34
    };

    if (model.type === 'TabbedContainer') {
      console.log(`measuring a tabbedContainer ${$path}`);
      const start = performance.now();
      const tabMeasurements = measureTabs($path);
      const end = performance.now();
      console.log(`took ${end - start}ms to measure tabs`);
      measurements[$path].tabs = tabMeasurements;
    }
  }

  return measurements[$path];
}

function isSplitter(model) {
  return model && model.type === 'Splitter';
}

function collectChildMeasurements(model, measurements, x, y, preX, posX, preY, posY) {
  //onsole.log(`   collectChildMeasurements	x:${x}	y:${y}	preX:${preX}	posX:${posX}	preY:${preY}	posY:${posY}`);
  var components = model.children.reduce((arr, child, idx, all) => {
    // generate a 'local' splitter adjustment for children adjacent to splitters
    var localPreX = 0;
    var localPosX = 0;
    var localPreY = 0;
    var localPosY = 0;

    if (child.type !== 'Splitter') {
      if (model.type === 'FlexBox') {
        var flexDirection = model.style.flexDirection;
        var prev = all[idx - 1];
        var next = all[idx + 1];
        var n = all.length - 1;

        if (flexDirection === 'row') {
          localPreX = idx === 0 ? preX : isSplitter(prev) ? prev.layout.width / 2 : 0;
          localPosX = idx === n ? posX : isSplitter(next) ? next.layout.width / 2 : 0;
          localPreY = preY;
          localPosY = posY;
        } else if (flexDirection === 'column') {
          localPreX = preX;
          localPosX = posX;
          localPreY = idx === 0 ? preY : isSplitter(prev) ? prev.layout.height / 2 : 0;
          localPosY = idx === n ? posY : isSplitter(next) ? next.layout.height / 2 : 0;
        }
      } else {
        localPreX = preX;
        localPosX = posX;
        localPreY = preY;
        localPosY = posY;
      }

      arr.push(addMeasurements(child, measurements, x, y, localPreX, localPosX, localPreY, localPosY));
    }

    return arr;
  }, []).filter(c => c); // the dragging component will return undefined, unrendered tabbed children
  // .sort(byPosition);

  if (components.length) {
    measurements[model.$path].children = components;
  }
}

function smallestBoxContainingPoint(layout, measurements, x, y) {
  //onsole.log('smallestBoxContainingPoint in ' + component.constructor.displayName);
  var rect = measurements[layout.$path];
  if (!containsPoint(rect, x, y)) return null;

  if (!layout.children) {
    return layout;
  }

  if (rect.header && containsPoint(rect.header, x, y)) {
    return layout;
  }

  var subLayout;
  var children = layout.children;

  for (var i = 0; i < children.length; i++) {
    if (layout.type === 'TabbedContainer' && layout.active !== i) {
      continue;
    }

    if (subLayout = smallestBoxContainingPoint(children[i], measurements, x, y)) {
      return subLayout;
    }
  }

  return layout;
}

function containsPoint(rect, x, y) {
  //	if (component.props.isHidden || component.props.dragging === true) return false;
  if (rect) {
    return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
  }
} // function byPosition(c1, c2) {
//     if (c1.top < c2.top || c1.left < c2.left) return -1;
//     if (c1.top > c2.top || c1.left > c2.left) return 1;
//     return 0;
// }


function measureTabs(id) {
  // Note the :scope selector is not supported on IE 
  return Array.from(document.getElementById(id).querySelectorAll(`:scope > .Tabstrip > .tabstrip-inner-sleeve > .tabstrip-inner > .Tab`)).map(tab => tab.getBoundingClientRect()).map(({
    left,
    right
  }) => ({
    left,
    right
  }));
}

function followPath(model, path) {
  if (path.indexOf(model.$path) !== 0) {
    throw Error(`pathUtils.followPath path ${path} is not within model.path ${model.$path}`);
  }

  var route = path.slice(model.$path.length + 1);

  if (route === '') {
    return model;
  }

  var paths = route.split('.');

  for (var i = 0; i < paths.length; i++) {
    if (model.children === undefined) {
      console.log(`model at 0.${paths.slice(0, i).join('.')} has no children, so cannot fulfill rest of path ${paths.slice(i).join('.')}`);
      return;
    }

    model = model.children[paths[i]];

    if (model === undefined) {
      console.log(`model at 0.${paths.slice(0, i).join('.')} has no children that fulfill next step of path ${paths.slice(i).join('.')}`);
      return;
    }
  }

  return model;
}
function followPathToParent(layout, path) {
  if (path === '0') return null;
  if (path === layout.$path) return null;
  return followPath(layout, path.replace(/.\d+$/, ''));
}

function nextStep(pathSoFar, targetPath) {
  if (pathSoFar === targetPath) {
    return {
      idx: -1,
      finalStep: true
    };
  }

  var regex = new RegExp(`^${pathSoFar}.`); // check that pathSoFar startsWith targetPath and if not, throw

  var paths = targetPath.replace(regex, '').split('.').map(n => parseInt(n, 10));
  return {
    idx: paths[0],
    finalStep: paths.length === 1
  };
}

const SURFACE = 'Surface';
const TABBED_CONTAINER = 'TabbedContainer';

const NO_CHILDREN = [];
const NO_STYLE = {};
const CSS_DIGIT = '(\\d+)(?:px)?';
const CSS_MEASURE = `^(?:${CSS_DIGIT}(?:\\s${CSS_DIGIT}(?:\\s${CSS_DIGIT}(?:\\s${CSS_DIGIT})?)?)?)$`;
const CSS_REX = new RegExp(CSS_MEASURE);
const BORDER_REX = /^(?:(\d+)(?:px)\ssolid\s([a-zA-Z,0-9().]+))$/;
const ROW = 'row';
const COLUMN = 'column';
const FLEX_DIRECTION = {
  [ROW]: yoga.FLEX_DIRECTION_ROW,
  [COLUMN]: yoga.FLEX_DIRECTION_COLUMN
};
const LAYOUT = 'layout';
const FLEXBOX = 'FlexBox';
const SPLITTER = 'Splitter';
const BORDER_STYLES = {
  border: true,
  borderWidth: true,
  borderTopWidth: true,
  borderRightWidth: true,
  borderBottomWidth: true,
  borderLeftWidth: true
};
const BORDER_LIST = Object.keys(BORDER_STYLES);
const LAYOUT_STYLES = { ...BORDER_STYLES,
  margin: true,
  marginTop: true,
  marginRight: true,
  marginBottom: true,
  marginLeft: true,
  padding: true,
  paddingTop: true,
  paddingRight: true,
  paddingBottom: true,
  paddingLeft: true
};
const LAYOUT_LIST = Object.keys(LAYOUT_STYLES);
function layoutStyleDiff(style1, style2) {
  if (!style1 && !style2) {
    return false;
  } else if (style1 && !style2) {
    return LAYOUT_LIST.some(style => style1[style]);
  } else if (style2 && !style1) {
    return LAYOUT_LIST.some(style => style2[style]);
  } else {
    return LAYOUT_LIST.some(style => style1[style] !== style2[style]);
  }
}
function computeLayout(model, width, height, top = 0, left = 0, path) {
  const tree = createTree(model, path || model.$path);
  const layoutModel = createYogaTree(tree);
  layoutModel.node.calculateLayout(width, height, yoga.DIRECTION_LTR);
  setLayout(layoutModel);
  layoutModel.node.freeRecursive();

  if (left !== 0) {
    layoutModel.layout.left += left;
  }

  if (top !== 0) {
    layoutModel.layout.top += top;
  }

  return layoutModel;
}

function createTree(model, path = '0') {
  return { ...model,
    $path: path,
    // TODO normalize style
    style: normalizeLayoutStyles(model.style),
    // style: expandStyle(model.style),
    children: expandChildren(model, path)
  };
}

function expandChildren({
  type,
  children
}, path) {
  if (children) {
    var splitters = type === FLEXBOX ? getSplitterPositions(children) : NO_CHILDREN;
    return children.reduce((list, child, i) => {
      if (splitters[i]) {
        list.push({
          type: 'Splitter',
          $path: `${path}.${list.length}`,
          style: {
            flex: '0 0 6px',
            backgroundColor: 'black'
          }
        });
      }

      list.push(createTree(child, `${path}.${list.length}`));
      return list;
    }, []);
  }
}

function normalizeLayoutStyles({
  margin,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  padding,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  ...style
} = NO_STYLE) {
  if (typeof margin === 'number') {
    style.marginTop = style.marginRight = style.marginBottom = style.marginLeft = margin;
  } else if (typeof margin === 'string') {
    const match = CSS_REX.exec(margin);

    if (match === null) {
      console.error(`Invalid css value for margin '${margin}'`);
    } else {
      const [, pos1, pos2, pos3, pos4] = match;
      const pos123 = pos1 && pos2 && pos3;

      if (pos123 && pos4) {
        style.marginTop = parseInt(pos1, 10);
        style.marginRight = parseInt(pos2, 10);
        style.marginBottom = parseInt(pos3, 10);
        style.marginLeft = parseInt(pos4, 10);
      } else if (pos123) {
        style.marginTop = parseInt(pos1, 10);
        style.marginRight = style.marginLeft = parseInt(pos2, 10);
        style.marginBottom = parseInt(pos3, 10);
      } else if (pos1 && pos2) {
        style.marginTop = style.marginBottom = parseInt(pos1, 10);
        style.marginRight = style.marginLeft = parseInt(pos2, 10);
      } else {
        style.marginTop = style.marginRight = style.marginBottom = style.marginLeft = parseInt(pos1, 10);
      }
    }
  }

  if (typeof marginTop === 'number') style.marginTop = marginTop;
  if (typeof marginRight === 'number') style.marginRight = marginRight;
  if (typeof marginBottom === 'number') style.marginBottom = marginBottom;
  if (typeof marginLeft === 'number') style.marginLeft = marginLeft;

  if (typeof padding === 'number') {
    style.paddingTop = style.paddingRight = style.paddingBottom = style.paddingLeft = padding;
  } else if (typeof padding === 'string') {
    const match = CSS_REX.exec(padding);

    if (match === null) {
      console.error(`Invalid css value for padding '${padding}'`);
    } else {
      const [, pos1, pos2, pos3, pos4] = match;
      const pos123 = pos1 && pos2 && pos3;

      if (pos123 && pos4) {
        style.paddingTop = parseInt(pos1, 10);
        style.paddingRight = parseInt(pos2, 10);
        style.paddingBottom = parseInt(pos3, 10);
        style.paddingLeft = parseInt(pos4, 10);
      } else if (pos123) {
        style.paddingTop = parseInt(pos1, 10);
        style.paddingRight = style.paddingLeft = parseInt(pos2, 10);
        style.paddingBottom = parseInt(pos3, 10);
      } else if (pos1 && pos2) {
        style.paddingTop = style.paddingBottom = parseInt(pos1, 10);
        style.paddingRight = style.paddingLeft = parseInt(pos2, 10);
      } else {
        style.paddingTop = style.paddingRight = style.paddingBottom = style.paddinggLeft = parseInt(pos1, 10);
      }
    }
  }

  if (typeof paddingTop === 'number') style.paddingTop = paddingTop;
  if (typeof paddingRight === 'number') style.paddingRight = paddingRight;
  if (typeof paddingBottom === 'number') style.paddingBottom = paddingBottom;
  if (typeof paddingLeft === 'number') style.paddingLeft = paddingLeft;
  return normalizeBorderStyle(style);
}

function normalizeBorderStyle(style = NO_STYLE) {
  if (BORDER_LIST.some(bs => style[bs])) {
    let match;
    let {
      border,
      borderWidth,
      borderTopWidth,
      borderRightWidth,
      borderBottomWidth,
      borderLeftWidth,
      borderColor,
      ...rest
    } = style;

    if (border || borderWidth || borderTopWidth || borderRightWidth || borderBottomWidth || borderLeftWidth) {
      if (typeof border === 'string' && (match = BORDER_REX.exec(border))) {
        // what if both border and borderWidth are specified ?
        [, borderWidth, borderColor] = match;
      }

      if (borderWidth) {
        borderTopWidth = borderTopWidth === undefined ? borderWidth : borderTopWidth;
        borderRightWidth = borderRightWidth === undefined ? borderWidth : borderRightWidth;
        borderBottomWidth = borderBottomWidth === undefined ? borderWidth : borderBottomWidth;
        borderLeftWidth = borderLeftWidth === undefined ? borderWidth : borderLeftWidth;
      }

      borderColor = borderColor || 'black';
      const boxShadow = `
                ${borderColor} ${borderLeftWidth || 0}px ${borderTopWidth || 0}px 0 0 inset, 
                ${borderColor} ${-borderRightWidth || 0}px ${-borderBottomWidth || 0}px 0 0 inset`;
      return { ...rest,
        boxShadow,
        borderColor,
        borderStyle: 'solid',
        borderTopWidth,
        borderRightWidth,
        borderBottomWidth,
        borderLeftWidth
      };
    } else {
      return style;
    }
  } else {
    return style;
  }
}

const DEFAULT_HEADER = {
  height: 32,
  style: {
    backgroundColor: 'brown'
  } // we may mutate the tree in here

};

function createYogaTree(model, parent, idx) {
  let {
    style = NO_STYLE,
    children = NO_CHILDREN
  } = model;
  const {
    type,
    layout = null
  } = model;
  const {
    flexDirection = null,
    left = null,
    top = null,
    width = null,
    height = null,
    flex = null
  } = style;
  const parentIsTabbedContainer = parent && parent.type === TABBED_CONTAINER;
  const parentIsSurface = parent && parent.type === SURFACE;
  const header = model.header === true ? DEFAULT_HEADER : typeof model.header === 'object' ? { ...DEFAULT_HEADER,
    ...model.header
  } : null;

  if (type !== LAYOUT && type !== SPLITTER && children.length === 0 && !isContainer(type)) {
    style = { ...style,
      display: 'flex',
      flexDirection: 'column' // children has to be created inline as it will be mutated by yoga

    };
    model.children = children = [{
      type: LAYOUT,
      style: {
        flex: 1
      }
    }];
  } else if (children.length === 1 && children[0].type === LAYOUT) {
    style = { ...style,
      display: 'flex',
      flexDirection: 'column' // children has to be created inline as it will be mutated by yoga

    };
    model.children = children = [{
      type: LAYOUT,
      style: {
        flex: 1
      }
    }];
  }

  let node = Node.create();

  if (header) {
    //TODO we need to have normalized the css before we do this, otw a padding string value will ignore the paddingtop
    style = increaseCSSMeasure(style, 'padding', header.height, 'top');
  }

  setCSSMeasure(node, style, 'margin');
  setCSSMeasure(node, style, 'border');
  setCSSMeasure(node, style, 'padding');

  if (flexDirection !== null) {
    node.setDisplay(yoga.DISPLAY_FLEX);
    node.setFlexDirection(FLEX_DIRECTION[flexDirection]);
    node.setAlignItems(yoga.ALIGN_STRETCH); //TODO allow this to be overridden
  } else if (type === TABBED_CONTAINER) {
    node.setDisplay(yoga.DISPLAY_FLEX);
    node.setFlexDirection(yoga.FLEX_DIRECTION_ROW);
    node.setAlignItems(yoga.ALIGN_STRETCH);
  }

  if (parentIsTabbedContainer) {
    const {
      active = 0
    } = parent;

    if (idx !== active) {
      node.setDisplay(yoga.DISPLAY_NONE);
    } else {
      node.setFlexGrow(1);
      node.setFlexShrink(1);
      node.setFlexBasis(0);
      node.setMargin(yoga.EDGE_TOP, 34);
    }
  }
  /*else if (parentHasHeader){
    node.setMargin(yoga.EDGE_TOP,32); // how do we determine the header height
  }*/


  if (layout !== null && !parentIsSurface) {
    // if we already have a layout, we reapply it, by transforming it into a style specification. This allows us to
    // manipulate the layout outside and preserve changes when we resize. If size has not changed, there is no need
    // to re-compute layout
    const {
      width: w,
      height: h
    } = layout;

    if (model.type === 'Splitter') {
      node.setFlexGrow(0);
      node.setFlexShrink(0);
      node.setFlexBasis(6);
    } else {
      node.setFlexGrow(1);
      node.setFlexShrink(1);
      node.setFlexBasis(getFlexDirection(parent) === ROW ? w : h); // need to know parent orientation
    }
  } else if (flex !== null) {
    // TODO how do we default the flex values
    if (typeof flex === 'string') {
      const [flexGrow, flexShrink, flexBasis] = flex.split(' ');
      node.setFlexGrow(parseInt(flexGrow, 0));
      node.setFlexShrink(parseInt(flexShrink, 0));
      node.setFlexBasis(parseInt(flexBasis, 0));
    } else if (typeof flex === 'number') {
      node.setFlexGrow(flex);
      node.setFlexShrink(flex);
      node.setFlexBasis(0);
    }
  } else {
    if (parentIsSurface) {
      node.setPositionType(yoga.POSITION_TYPE_ABSOLUTE);
    }

    if (top !== null && left !== null) {
      node.setPosition(yoga.EDGE_TOP, top);
    }

    if (left !== null) {
      node.setPosition(yoga.EDGE_START, left);
    }

    if (width !== null) {
      node.setWidth(width);
    }

    if (height !== null) {
      node.setHeight(height);
    }
  }

  children.forEach((child, i) => {
    const expandedChild = createYogaTree(child, model, i);
    node.insertChild(expandedChild.node, i);
  });
  model.node = node;
  return model;
}

function getFlexDirection(model) {
  const style = model && model.style || NO_STYLE;
  return style.flexDirection || ROW;
}

function getSplitterPositions(children) {
  var ret = [];

  for (var i = 1; i < children.length; i++) {
    var thisFlexible = isFlexible(children[i]);
    var lastFlexible = isFlexible(children[i - 1]);

    if (isSplitter$1(children[i]) || isSplitter$1(children[i - 1])) {
      ret[i] = false;
    } else if (thisFlexible && lastFlexible) {
      ret[i] = true;
    } else if (!(thisFlexible || lastFlexible)) {
      ret[i] = false;
    } else if (lastFlexible && children.slice(i + 1).some(isFlexible)) {
      ret[i] = true;
    } else if (thisFlexible && children.slice(0, i).some(isFlexible)) {
      ret[i] = true;
    } else {
      ret[i] = false;
    }
  }

  return ret;
}

function isSplitter$1(model) {
  return model.type === 'Splitter';
}

function isFlexible(model) {
  return model.resizeable;
}
function setLayout(model) {
  model.layout = model.node.getComputedLayout();
  model.children && model.children.forEach(child => setLayout(child));
}
const CSS_MEASURE_SETTERS = {
  'margin': 'setMargin',
  'padding': 'setPadding',
  'border': 'setBorder'
};
const CSS_MEASURES = {
  border: {
    measureTop: 'borderTopWidth',
    measureRight: 'borderRightWidth',
    measureBottom: 'borderBottomWidth',
    measureLeft: 'borderLeftWidth'
  },
  margin: {
    measureTop: 'marginTop',
    measureRight: 'marginRight',
    measureBottom: 'marginBottom',
    measureLeft: 'marginLeft'
  },
  padding: {
    measureTop: 'paddingTop',
    measureRight: 'paddingRight',
    measureBottom: 'paddingBottom',
    measureLeft: 'paddingLeft'
  }
};

function increaseCSSMeasure(style, measure, value, edge) {
  if (measure === 'padding') {
    if (edge === 'top') {
      if (style.paddingTop) {
        style = { ...style,
          paddingTop: style.paddingTop + value
        };
      } else if (typeof style.padding === 'number') {
        const {
          padding,
          ...rest
        } = style;
        style = { ...rest,
          paddingTop: padding + value,
          paddingRight: padding,
          paddingBottom: padding,
          paddingLeft: padding
        };
      } else {
        style = { ...style,
          paddingTop: value
        };
      }
    }
  }

  return style;
}

function setCSSMeasure(node, style, measure) {
  const setMeasure = CSS_MEASURE_SETTERS[measure];
  const value = style[measure];

  if (typeof value === 'number') {
    node[setMeasure](yoga.EDGE_ALL, value);
  } else if (typeof value === 'string') {
    const match = CSS_REX.exec(value);

    if (match === null) {
      console.error(`Invalid css value for ${measure} '${value}'`);
    } else {
      const [, pos1, pos2, pos3, pos4] = match;
      const pos123 = pos1 && pos2 && pos3;

      if (pos123 && pos4) {
        node[setMeasure](yoga.EDGE_TOP, parseInt(pos1, 10));
        node[setMeasure](yoga.EDGE_END, parseInt(pos2, 10));
        node[setMeasure](yoga.EDGE_BOTTOM, parseInt(pos3, 10));
        node[setMeasure](yoga.EDGE_START, parseInt(pos4, 10));
      } else if (pos123) {
        node[setMeasure](yoga.EDGE_TOP, parseInt(pos1, 10));
        node[setMeasure](yoga.EDGE_START, parseInt(pos2, 10));
        node[setMeasure](yoga.EDGE_END, parseInt(pos2, 10));
        node[setMeasure](yoga.EDGE_BOTTOM, parseInt(pos3, 10));
      } else if (pos1 && pos2) {
        node[setMeasure](yoga.EDGE_TOP, parseInt(pos1, 10));
        node[setMeasure](yoga.EDGE_BOTTOM, parseInt(pos1, 10));
        node[setMeasure](yoga.EDGE_START, parseInt(pos2, 10));
        node[setMeasure](yoga.EDGE_END, parseInt(pos2, 10));
      } else {
        node[setMeasure](yoga.EDGE_ALL, parseInt(pos1, 10));
      }
    }
  } else {
    const {
      measureTop,
      measureRight,
      measureBottom,
      measureLeft
    } = CSS_MEASURES[measure];
    if (style[measureTop]) node[setMeasure](yoga.EDGE_TOP, style[measureTop]);
    if (style[measureRight]) node[setMeasure](yoga.EDGE_END, style[measureRight]);
    if (style[measureBottom]) node[setMeasure](yoga.EDGE_BOTTOM, style[measureBottom]);
    if (style[measureLeft]) node[setMeasure](yoga.EDGE_START, style[measureLeft]);
  }
}

const EMPTY_OBJECT = {};
function containerOf(layout, target) {
  if (target === layout) {
    return null;
  } else {
    let {
      idx,
      finalStep
    } = nextStep(layout.$path, target.$path);

    if (finalStep) {
      return layout;
    } else if (layout.children === undefined || layout.children[idx] === undefined) {
      return null;
    } else {
      return containerOf(layout.children[idx], target);
    }
  }
}
function handleLayout(model, command, options) {
  // This is called during splitter resize to resize children of model
  if (command === 'resize') {
    return resizeLayout(model, options);
  } else if (command === 'replace') {
    return replaceChild(model, options.targetNode, options.replacementNode);
  } else if (command === 'remove') {
    const result = removeChild(model, options.targetNode);
    return result;
  } // else if (command === 'config-change'){
  //     return Layout.config(layout, options);
  // }
  else if (command === 'switch-tab') {
      return switchTab$1(model, options);
    } // else if (command === 'minimize'){
    //     return Layout.minimize(layout, options);
    // }
    // else if (command === 'maximize'){
    //     return Layout.maximize(layout, options);
    // }
    // else if (command === 'restore'){
    //     return Layout.restore(layout, options);
    //}
    else if (command === 'drop') {
        return drop(model, options);
      }
}
function layout(model, position = {}, path = '0', visibility = 'visible', force = false, active) {
  function firstNumber(n1, n2, n3) {
    return typeof n1 === 'number' ? Math.round(n1) : typeof n2 === 'number' ? n2 : n3;
  }

  function firstDefined(n1, n2, n3) {
    return n1 !== undefined ? typeof n1 === 'number' ? Math.round(n1) : n1 : n2 !== undefined ? n2 : n3;
  }

  var style = model.style || {};
  var top = firstNumber(position.top, style.top, 0);
  var left = firstNumber(position.left, style.left, 0);
  var width = firstDefined(position.width, style.width, 0);
  var height = firstDefined(position.height, style.height, 0);
  var {
    layout,
    ...m
  } = model;

  if (layout && force !== true) {
    if (path === model.$path && width === layout.width && height === layout.height && top === layout.top && left === layout.left && (visibility === undefined || visibility === model.style.visibility) && (active === undefined || active === model.active)) {
      return model;
    }
  } //TODO how do we make this model pluggable


  switch (model.type) {
    case 'FlexBox':
      return flexLayout(m, path, top, left, width, height, visibility, active);

    case 'TabbedContainer':
      return flexLayout(m, path, top, left, width, height, visibility, active);

    case 'Surface':
      return flexLayout(m, path, top, left, width, height, visibility, active);

    default:
      return flexLayout(m, path, top, left, width, height, visibility, active);
  }
}

function flexLayout(model, path, top, left, width, height, visibility, active) {
  if (typeof active === 'number' && active !== model.isActive) {
    model = { ...model,
      active
    };
  }

  return computeLayout(model, width, height, top, left, path);
}

function switchTab$1(layoutModel, {
  path,
  nextIdx
}) {
  var container = followPath(layoutModel, path); // var content = container.children.slice();
  // we need to set height of selected child, even if it is not needed for 
  // rendering - children will inherit the value;
  // content[nextIdx] = content[nextIdx].set({height: content[idx].height});
  // content[idx] = content[idx].set({height:0});

  var {
    $path,
    visibility = 'visible'
  } = container;
  var newContainer = layout(container, container.layout, $path, visibility, false, nextIdx);
  return replaceChild(layoutModel, container, newContainer);
}

function drop(layoutModel, options) {
  var {
    draggedComponent: source,
    dropTarget: {
      component: target,
      pos,
      tabIndex = -1
    }
  } = options;

  if (pos.position.Header) {
    if (target.type === 'TabbedContainer') {
      //onsole.log('CASE 2 Works)');
      let before, after;

      if (tabIndex === -1) {
        after = target.children[target.children.length - 1];
      } else {
        before = target.children[tabIndex];
      }

      return transform(layoutModel, {
        insert: {
          source,
          before,
          after
        }
      });
    } else {
      //onsole.log('CASE 2B Works)'); 
      return transform(layoutModel, {
        wrap: {
          target,
          source,
          pos
        }
      });
    }
  } else if (pos.position.Centre) {
    //onsole.log(JSON.stringify(source,null,2))
    // source = clone(source, {style:{position:null,transform:null,transformOrigin:null}});
    return replaceChild(layoutModel, followPath(layoutModel, target.$path), source);
  } else {
    return dropLayoutIntoContainer(layoutModel, pos, source, target);
  }
}

function dropLayoutIntoContainer(layoutModel, pos, source, target) {
  var targetContainer = followPathToParent(layoutModel, target.$path);

  if (absoluteDrop(target, pos.position)) {
    return transform(layoutModel, {
      insert: {
        source,
        target,
        pos
      }
    });
  } else if (target === layoutModel || isDraggableRoot(layoutModel, target)) {
    // Can only be against the grain...
    if (withTheGrain(pos, target)) {
      throw Error('How the hell did we do this');
    }
  } else if (withTheGrain(pos, targetContainer)) {
    if (pos.position.SouthOrEast) {
      //onsole.log(`CASE 4B) Works. Insert into container 'with the grain'`);
      return transform(layoutModel, {
        insert: {
          source,
          after: target,
          pos
        }
      });
    } else {
      //onsole.log('CASE 4C) Works');
      return transform(layoutModel, {
        insert: {
          source,
          before: target,
          pos
        }
      });
    }
  } else if (againstTheGrain(pos, targetContainer)) {
    //onsole.log('CASE 4D) Works.');
    return transform(layoutModel, {
      wrap: {
        target,
        source,
        pos
      }
    });
  } else if (isContainer$1(targetContainer)) {
    return transform(layoutModel, {
      wrap: {
        target,
        source,
        pos
      }
    });
  } else {
    console.log('no support right now for position = ' + pos.position);
  }

  return layoutModel;
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
        nodeSize = opts.pos ? opts.pos.width || opts.pos.height : undefined;

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
    layoutModel = insert(layoutModel, nodeToBeInserted, targetContainer, nodeBeforeWhichToInsert, nodeAfterWhichToInsert);
  }

  return layoutModel;
}

function insert(model, source, into, before, after, size) {
  const target = before || after || into;
  let {
    $path,

    /*active,*/
    type,
    style,
    children
  } = model;
  let {
    idx,
    finalStep
  } = nextStep($path, target); // One more step needed when we're inserting 'into' a container

  var oneMoreStepNeeded = finalStep && into && idx !== -1;

  if (finalStep && !oneMoreStepNeeded) {
    const flexBox = type === 'FlexBox';
    const dim = flexBox && (style.flexDirection === 'row' ? 'width' : 'height');

    if (type === 'Surface' && idx === -1) {
      children = children.concat(source);
    } else {
      children = children.reduce((arr, child, i
      /*, all*/
      ) => {
        // idx of -1 means we just insert into end 
        if (idx === i) {
          if (flexBox) {
            var size = (child.layout[dim] - 6) / 2;
            child = { ...child,
              layout: { ...child.layout,
                [dim]: size
              }
            };
            const flex = source.style.flex === undefined ? 1 : source.style.flex;
            source = { ...source,
              layout: { ...source.layout,
                [dim]: size
              },
              style: { ...source.style,
                flex,
                position: null,
                transform: null,
                transformOrigin: null
              }
            };
          } else {
            source = { ...source,
              style: { ...source.style,
                position: null,
                transform: null,
                transformOrigin: null
              }
            };
          }

          if (before) {
            arr.push(source, child);
          } else {
            arr.push(child, source);
          }
        } else {
          arr.push(child);
        }

        return arr;
      }, []);
    }
  } else {
    children = model.children.slice();
    children[idx] = insert(children[idx], source, into, before, after);
  }

  const {
    layout: modelLayout
  } = model;
  return layout({ ...model,
    children
  }, modelLayout, model.$path);
} // this is replaceChild with extras


function wrap(model, source, target, pos) {
  var {
    idx,
    finalStep
  } = nextStep(model.$path, target.$path);
  var children = model.children.slice();

  if (finalStep) {
    var {
      type,
      flexDirection
    } = getLayoutSpec(pos); // roll dim into this

    var dim = flexDirection === 'row' ? 'width' : 'height';
    var active = type === 'TabbedContainer' || pos.position.SouthOrEast ? 1 : 0;
    var $path = `${model.$path}.${idx}`;
    target = children[idx];
    var style = {
      position: null,
      transform: null,
      transformOrigin: null,
      flex: 1
    };
    var size = (target.layout[dim] - 6) / 2;
    var childLayout = {
      [dim]: size
    };
    var wrapperStyle = {
      flexDirection
    };

    if (target.style.flex) {
      wrapperStyle.flex = target.style.flex;
    } // need to roll resizeable into the layoutModel. else we lose it here


    var wrapper = layout({
      type,
      $path,
      active,
      $id: uuid(),
      style: wrapperStyle,
      layout: target.layout,
      resizeable: target.resizeable,
      children: pos.position.SouthOrEast || pos.position.Header ? [{ ...target,
        $path: `${$path}.0`,
        style: { ...target.style,
          ...style
        },
        layout: childLayout
      }, { ...source,
        $path: `${$path}.1`,
        style: { ...source.style,
          ...style
        },
        layout: childLayout
      }] : [{ ...source,
        $path: `${$path}.0`,
        style: { ...source.style,
          ...style
        },
        layout: childLayout
      }, { ...target,
        $path: `${$path}.1`,
        style: { ...target.style,
          ...style
        },
        layout: childLayout
      }]
    }, target.layout, $path, 'visible', true);
    children.splice(idx, 1, wrapper);
  } else {
    children[idx] = wrap(children[idx], source, target, pos);
  }

  const {
    layout: modelLayout
  } = model; // we call layout too many times by invoking it at this level

  return layout({ ...model,
    children
  }, modelLayout, model.$path);
}

function resizeLayout(model, {
  path,
  measurements,
  dimension
}) {
  const target = followPath(model, path);
  const position = dimension === 'width' ? 'left' : 'top';
  let shift = 0;
  const resizedTarget = layout({ ...model,
    children: model.children.map((child, i) => {
      const {
        layout
      } = child;
      const measurement = measurements[i];
      const {
        [dimension]: dim
      } = layout;

      if (dim === measurement && shift === 0) {
        return child;
      } else {
        const newLayout = { ...layout,
          [dimension]: measurement,
          [position]: layout[position] + shift
        };
        shift += measurement - dim;
        return { ...child,
          layout: newLayout
        };
      }
    })
  }, model.layout, model.$path);
  return replaceChild(model, target, resizedTarget);
}

function simpleClone(o1, o2, unversioned) {
  if (o2 === undefined) {
    return o1;
  }

  var result = {};
  var value1;
  var value2;
  var property;
  var versionIncrement = unversioned === true ? 0 : 1; // copy forward existing properties, making replacements and deletions...

  for (property in o1) {
    value1 = o1[property];
    value2 = o2[property];

    if (property === '$version') {
      result.$version = value1 + versionIncrement;
    } else if (property === 'style') {
      result.style = simpleClone(value1, value2);
    } else if (value2 !== null) {
      if (typeof value2 !== 'undefined') {
        result[property] = value2;
      } else {
        result[property] = o1[property];
      }
    }
  } /// ...then add new properties 


  for (property in o2) {
    if (o2[property] !== null && typeof result[property] === 'undefined') {
      result[property] = o2[property];
    }
  }

  return result;
}

function clone(model, overrides, unversioned) {
  var {
    /*type, $version,*/
    style: s1,
    ...rest1
  } = model;
  var {
    style: s2 = EMPTY_OBJECT,
    ...rest2
  } = overrides;

  if (noEffectiveOverrides(s1, s2) && noEffectiveOverrides(rest1, rest2)) {
    return model;
  }

  return simpleClone(model, overrides, unversioned);
}

function noEffectiveOverrides(source, overrides) {
  var properties = Object.getOwnPropertyNames(overrides);

  for (var i = 0; i < properties.length; i++) {
    if (overrides[properties[i]] !== source[properties[i]]) {
      return false;
    }
  }

  return true;
}

function removeChild(model, child) {
  var {
    idx,
    finalStep
  } = nextStep(model.$path, child.$path);
  var children = model.children.slice();

  if (finalStep) {
    if (idx > 0 && isSplitter$2(children[idx - 1])) {
      children.splice(idx - 1, 2);
    } else if (idx === 0 && isSplitter$2(children[1])) {
      children.splice(0, 2);
    } else {
      children.splice(idx, 1);
    }

    var {
      layout: modelLayout,
      $path
      /*, active */

    } = model;

    if (children.length === 1 && model.type.match(/FlexBox|TabbedContainer/)) {
      // certain style attributes from the parent must be passed down to the 
      // replacement child, eg flex - are there others ?
      const {
        flex
      } = model.style;
      return layout(clone(children[0], {
        style: {
          flex
        }
      }, true), modelLayout, $path);
    } else {
      var {
        top,
        left,
        width,
        height
      } = modelLayout; // var props = {};
      //var nowActive = active;
      // if (active === children.length) {
      //     nowActive = props.active = active - 1;
      // }

      const result = layout({ ...model,
        children
      }, {
        top,
        left,
        width,
        height
      }, model.$path);
      return result;
    }
  } else {
    children[idx] = removeChild(children[idx], child);
  }

  children = children.map((child, i) => {
    var $path = `${model.$path}.${i}`;
    return child.$path === $path ? child : clone(child, {
      $path
    });
  });
  return clone(model, {
    children
  });
}

function replaceChild(model, child, replacement) {
  if (replacement.$path === model.$path) {
    return replacement;
  }

  var {
    idx,
    finalStep
  } = nextStep(model.$path, child.$path);
  var children = model.children.slice();

  if (finalStep) {
    if (Array.isArray(replacement)) ; else {
      children[idx] = { ...replacement,
        layout: { ...child.layout
        }
      };
    }
  } else {
    children[idx] = replaceChild(children[idx], child, replacement);
  }

  return layout({ ...model,
    children
  }, model.layout, model.$path);
} // Note: withTheGrain is not the negative of againstTheGrain - the difference lies in the 
// handling of non-Flexible containers, the response for which is always false;


function withTheGrain(pos, container) {
  return pos.position.NorthOrSouth ? isTower(container) : pos.position.EastOrWest ? isTerrace(container) : false;
}

function againstTheGrain(pos, layout) {
  return pos.position.EastOrWest ? isTower(layout) || isTabset(layout) : pos.position.NorthOrSouth ? isTerrace(layout) || isTabset(layout) : false;
}

function absoluteDrop(target, position) {
  return target.type === 'Surface' && position.Absolute;
}

function isSplitter$2(model) {
  return model && model.type === 'Splitter';
}

function isContainer$1(model) {
  return model.type === 'Container' || model.type === 'DynamicContainer';
}

function isTabset(model) {
  return model.type === 'TabbedContainer';
}

function isTower(model) {
  return model.type === 'FlexBox' && model.style.flexDirection === 'column';
}

function isTerrace(model) {
  return model.type === 'FlexBox' && model.style.flexDirection === 'row';
}

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

  return {
    type,
    flexDirection
  };
}

const DEFAULT_HEADER_SPEC = {
  height: 32,
  menu: true
};
class LayoutItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      layoutModel: props.layoutModel || layout(getLayoutModel(this), {
        width: props.style.width,
        height: props.style.height
      })
    };
    this.handleLayout = this.handleLayout.bind(this);
  }

  render() {
    const {
      children,
      title = '',
      state,
      dragging,
      header: _,
      ...props
    } = this.props;
    const {
      layoutModel
    } = this.state;
    const [{
      layout: childLayout
    }] = layoutModel.children;
    var {
      $path,
      layout
    } = layoutModel;
    var isSelected = this.props.isSelected;
    var className = cx('LayoutItem', {
      'minimized': state === 1,
      'maximized': state === 2,
      'active': isSelected,
      'dragging': dragging
    });
    const header = !layoutModel.header ? false : layoutModel.header === true ? DEFAULT_HEADER_SPEC : { ...DEFAULT_HEADER_SPEC,
      ...layoutModel.header
    };
    var headerHeight = header ? header.height : 0;
    const style = {
      backgroundColor: layoutModel.style.backgroundColor,
      boxShadow: layoutModel.style.boxShadow
    };
    const componentStyle = {
      // backgroundColor: props.style.backgroundColor,
      position: 'absolute',
      top: headerHeight,
      border: 0,
      padding: 0,
      margin: 0,
      // ...childStyle,
      ...childLayout
    };
    console.log(`LayoutItem
            style ${JSON.stringify(componentStyle)}
        
            props.style ${JSON.stringify(this.props.style)}
            layout.style ${JSON.stringify(layoutModel.style)}
        
        `);
    return React.createElement("div", {
      id: $path,
      className: className,
      style: {
        position: 'absolute',
        ...style,
        ...layout
      }
    }, header && React.createElement(ComponentHeader, {
      ref: "header",
      title: `${title}`,
      style: {
        height: header.height
      },
      menu: header.menu,
      onMouseDown: e => this.handleMousedown(e),
      onAction: (key, opts) => this.handleAction(key, opts),
      state: state
    }), children.type === 'div' ? React.cloneElement(children, {
      style: { ...componentStyle,
        ...childLayout
      }
    }) : React.cloneElement(children, { ...props,
      style: componentStyle,
      // we may need to merge style attributes from props
      width: childLayout.width,
      height: childLayout.height,
      onLayout: this.handleLayout
    }));
  }

  componentDidMount() {
    const self = this;

    if (this.context && this.context.store) {
      const {
        store
      } = this.context; //TODO sort out this mess
      // be careful the context of store change notification is not 'this'

      this.unsubscribe = store.subscribe(() => {
        const myState = self.getState();

        if (myState && myState !== self.state.c) {
          // console.log(`LayoutItem receives store change notification - ITS FOR ME and it has changed 
          // ${JSON.stringify(myState)}
          //${JSON.stringify(self.state.c)}`);
          self.setState({
            c: myState
          });
        } // else if (myState && myState === self.state.c){
        // console.log(`LayoutItem receives store change notification - it's for me BUT it hasn't changed`);
        // }
        // else {
        // console.log(`LayoutItem receives store change notification - it's Not for me :-(`);
        // }

      });
    }
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  componentWillReceiveProps(nextProps) {
    const {
      layoutModel,
      style
    } = nextProps; // look out for a style change that will require a layout, we will reset layout in state and call
    // onLayout prop to pass this up chain of command

    if (style && style.flexGrow !== this.props.style.flexGrow) {
      var fixed = style.flexGrow === 0;
      this.setState({
        fixed,
        header: {
          title: this.props.title,
          fixed
        }
      });
    }

    if (layoutModel && layoutModel !== this.state.layoutModel) {
      this.setState({
        layoutModel
      });
    } else if (layoutStyleDiff(this.props.style, style)) {
      // TODO test this code
      const {
        $path,
        layout: layout$1
      } = this.state.layoutModel;
      const {
        marginTop = 0,
        marginRight = 0,
        marginBottom = 0,
        marginLeft = 0
      } = this.props.style;
      const {
        top,
        left,
        width,
        height
      } = layout$1;
      this.setState({
        layoutModel: layout({ ...this.state.layoutModel,
          style
        }, {
          top,
          left,
          width: width + marginLeft + marginRight,
          height: height + marginTop + marginBottom
        }, $path, true // FORCE_LAYOUT
        )
      }, () => {
        this.props.onLayout('replace', {
          model: this.state.layoutModel
        });
      });
    }
  }

  dispatch(action) {
    if (typeof action === 'function') {
      return this.context.store.dispatch(action);
    } else {
      const {
        id,
        componentId,
        ...options
      } = action;

      if (id && action.type === 'SAVE_CONFIG') {
        this.context.store.dispatch({
          type: 'SAVE_CONFIG',
          config: { ...options.config,
            targetId: this.props.layoutModel.$id
          },
          componentId: id
        });
      } else if (componentId) {
        this.context.store.dispatch({ ...options,
          componentId
        });
      } else {
        this.context.store.dispatch({ ...options,
          componentId: this.props.layoutModel.$id
        });
      }
    }
  }

  handleLayout(command, options) {
    if (command === 'remove' && options === undefined) {
      // TODO call onLayout
      this.dispatch(remove(this.props.layoutModel));
    } else {
      this.props.onLayout(command, options);
    }
  }

  handleAction(key, opts) {
    if (key === 'menu') {
      var {
        left,
        top
      } = opts; // the ComponentContextMenu will reach into the hostedComponent to get MenuItems, we should do that here

      var contextMenu = React.createElement(ComponentContextMenu, {
        component: this,
        doAction: action => this.handleContextMenuAction(action)
      });
      PopupService.showPopup({
        left,
        top,
        component: contextMenu
      });
    } else if (key === 'pin') {
      var fixed = this.state.fixed;
      this.setState({
        fixed: !fixed
      });
      this.props.onConfigChange(this, {
        fixed: !fixed
      });
    }
  }

  handleMousedown(e) {
    if (this.props.onMouseDown) {
      this.props.onMouseDown({
        model: this.props.layoutModel,
        evt: e,
        position: ReactDOM.findDOMNode(this).getBoundingClientRect()
      });
    } else {
      this.props.onLayout('drag-start', {
        model: this.props.layoutModel,
        evt: e,
        position: ReactDOM.findDOMNode(this).getBoundingClientRect()
      });
    }
  }

  handleContextMenuAction(action
  /*, data*/
  ) {
    if (action === 'pin') {
      var fixed = this.state.fixed;
      this.setState({
        fixed: !fixed
      });
      this.props.onConfigChange(this, {
        fixed: !fixed
      });
    } else if (action === 'remove') {
      this.dispatch(remove(this.props.layoutModel)); // this.props.onLayout('remove', {model:this.props.layoutModel});
    } else if (action === 'minimize') {
      this.props.onLayout('minimize', {
        /*path*/
      });
    } else if (action === 'maximize') {
      this.props.onLayout('maximize', {
        /*path*/
      });
    } else if (action === 'restore') {
      this.props.onLayout('restore', {
        /*path*/
      });
    } else if (action === 'settings') ; else if (typeof action === 'object') {
      this.dispatch(action);
    } else {
      console.log(`LayoutItem.handleContextMenuAction unknown action ${action}`);
    }
  }

}
LayoutItem.displayName = 'LayoutItem';
LayoutItem.defaultProps = {
  onConfigChange: () => {},
  style: {},
  visibility: 'visible'
};

const COLOURS = ['red', 'green', 'blue', 'yellow']; // Konva properties
class DropMenu {
  constructor({
    layer,
    hover
  }) {
    this._group = new Konva.Group();

    this._group.on('mouseleave', () => hover(null));

    layer.add(this._group);

    this.visible = isVisible => this._group.visible(isVisible);

    this.addPaths = paths => {
      paths.forEach(({
        path,
        dropTarget
      }) => {
        this._group.add(path);

        path.on('mouseenter', () => hover(dropTarget));
      });
    };
  }

  computeMenuPosition(dropTarget, measurements, offsetTop = 0, offsetLeft = 0) {
    const {
      component,
      pos
    } = dropTarget;
    const box = measurements[component.$path];
    const dropTargets = getDropTargets(dropTarget);
    const [x, y] = menuPosition(pos, box, dropTargets.length, offsetTop, offsetLeft);

    this._group.position({
      x,
      y
    });

    const paths = dropTargets.map((dropTarget, i) => ({
      path: new Konva.Path({
        strokeWidth: 0,
        fill: COLOURS[i],
        data: pathPosition(pos, i)
      }),
      dropTarget
    })); // do we have to care about removing eventlisteners ? Probably not

    this._group.removeChildren();

    this.addPaths(paths);
  }

}

function pathPosition(pos, idx) {
  const unit = 30;
  const depth = 32;

  const lo = i => i === 0 ? -unit / 2 : i > 0 ? -1 * (unit / 2 + idx * unit) : unit / 2 + (-idx - 1) * unit;

  const [top, left, width, height] = pos.position.West ? [lo(idx), 0, depth, unit] : pos.position.East ? [lo(idx), -depth, depth, unit] : pos.position.South ? [-depth, lo(idx), unit, depth] :
  /* North | Header */
  [0, lo(idx), unit, depth]; // For pos 0 we draw just one item (the central item), for others we double up	

  return `M${left},${top}h${width}v${height}h-${width}v-${height}${idx > 0 ? pathPosition(pos, -idx) : ''}`;
}

function menuPosition(pos, box, count, offsetTop, offsetLeft) {
  return pos.position.West ? [box.left - offsetLeft + 26, pos.y - offsetTop] : pos.position.South ? [pos.x - offsetLeft, box.bottom - offsetTop - 26] : pos.position.East ? [box.right - offsetLeft - 26, pos.y - offsetTop]
  /* North | Header*/
  : [pos.x - offsetLeft, box.top - offsetTop + 26];
} // This might be a method on dropTarget ?


function getDropTargets(dropTarget) {
  const dropTargets = [dropTarget];

  while (dropTarget = dropTarget.nextDropTarget) {
    dropTargets.push(dropTarget);
  }

  return dropTargets;
}

const NORTH$1 = Position.North;
const SOUTH$1 = Position.South;
const EAST$1 = Position.East;
const WEST$1 = Position.West;
const HEADER$1 = Position.Header;
let _dropTarget = null;
let _multiDropOptions = false;

let _currentDropTarget;

let _dropMenu = false;

let _stage;

let _layer;

let _konvaDropMenu;

let _hoverDropTarget = null;
let _dropTargetIsTabstrip = false;

let _currentTabIndex = -1;

let _shiftedTab = null;
class DropTargetCanvas {
  constructor() {
    const canvas = document.createElement('canvas');
    canvas.className = 'fullscreen';
    let container = document.getElementById('thecanvas');
    let sketchpad;

    if (!container) {
      const root = document.getElementById('root');
      container = document.createElement('div');
      container.id = 'thecanvas';
      document.body.insertBefore(container, root);
      sketchpad = document.createElement('div');
      sketchpad.id = 'sketchpad';
      this.sketchpad = sketchpad;
      document.body.insertBefore(sketchpad, root);
    }

    container.appendChild(canvas);
    this.canvas = canvas;
    this.t = 0;
    this.l = 0;
    this.w = document.body.clientWidth;
    this.h = document.body.clientHeight;
    window.addEventListener('resize', () => {
      this.w = document.body.clientWidth;
      this.h = document.body.clientHeight;
    });
    _stage = new Konva.Stage({
      container: 'sketchpad',
      // id of container <div>
      width: this.w,
      height: this.h
    }); //then create layer

    _layer = new Konva.Layer();
    _konvaDropMenu = new DropMenu({
      layer: _layer,
      hover: dropTarget => _hoverDropTarget = dropTarget
    });

    _stage.add(_layer);
  }

  prepare(position) {
    if (position) {
      const {
        left: l,
        top: t,
        right: r,
        bottom: b
      } = position;
      const w = r - l;
      const h = b - t;
      this.t = t;
      this.l = l;
      this.w = w;
      this.h = h;
      const cssText = `top:${t}px;left:${l}px;width:${w}px;height:${h}px;z-index:100`;
      this.canvas.style.cssText = cssText;
      this.sketchpad.style.cssText = cssText;

      _stage.setWidth(w);

      _stage.setHeight(h);
    }

    this.canvas.classList.add("ready");
    document.body.classList.add("drawing");
    _currentDropTarget = null;
  }

  clear() {
    document.body.classList.remove("drawing");
    this.canvas.classList.remove("ready");

    if (_dropMenu) {
      PopupService.hidePopup();
      _dropMenu = false;
    }
  }

  get hoverDropTarget() {
    return _hoverDropTarget;
  }

  get dropTargetIsTabstrip() {
    return _dropTargetIsTabstrip;
  }

  get currentTabIndex() {
    return _currentTabIndex;
  }

  draw(dropTarget, measurements, x, y) {
    const SameDropTarget = _dropTarget !== null && !_dropTargetIsTabstrip && _dropTarget.component === dropTarget.component && _dropTarget.pos.position === dropTarget.pos.position && _dropTarget.pos.closeToTheEdge === dropTarget.pos.closeToTheEdge;
    const wasMultiDrop = _multiDropOptions;

    if (_hoverDropTarget !== null) {
      this.drawTarget(_hoverDropTarget, measurements, x, y);
    } else if (SameDropTarget === false) {
      _dropTarget = dropTarget;
      _currentDropTarget = null;
      _multiDropOptions = dropTarget.nextDropTarget != null; //onsole.log('draw, _multiDropOptions = ' + _multiDropOptions);
      // if (_dropMenu){
      //     PopupService.hidePopup();
      //     _dropMenu = false;
      // }

      this.drawTarget(dropTarget, measurements, x, y);
    }

    if (_hoverDropTarget !== null) ; else if (_multiDropOptions) {
      if (!wasMultiDrop) {
        // onsole.log('show the drop menu');
        _konvaDropMenu.visible(true);
      }

      drawDropOptions(this.canvas, dropTarget, measurements, this.w, this.h, this.t, this.l);
    } else if (_konvaDropMenu.visible()) {
      // onsole.log('clear the drop menu');
      _konvaDropMenu.visible(false);

      _layer.draw();
    }
  }

  drawTarget(dropTarget, measurements, x, y) {
    const {
      canvas,
      w,
      h,
      t: offsetTop,
      l: offsetLeft
    } = this;
    setWidth(canvas, w, h);
    var ctx = canvas.getContext('2d');

    if (_currentDropTarget) {
      _currentDropTarget.active = false;
    } //onsole.log('activate drop target',dropTarget);	    


    _currentDropTarget = dropTarget;
    dropTarget.active = true;
    var rect = measurements[dropTarget.component.$path];
    var header = rect.header || rect.tabstrip;
    var pos = dropTarget.pos;

    if (pos.position === HEADER$1 && header) {
      // this is wrong, only needed because we're manipulating the tabs here
      const $id = dropTarget.component.$path;
      drawTabbedOutline(ctx, rect, w, h, offsetTop, offsetLeft, x, y, $id);
    } else {
      drawOutline(ctx, pos, rect, w, h, offsetTop, offsetLeft);
    }
  }

}

function setWidth(canvas, w, h) {
  canvas.width = w;
  canvas.height = h;
}

function drawTabbedOutline(ctx, rect, w, h, offsetTop, offsetLeft, mouseX, mouseY, $id) {
  // This is completely the wrong place to be identifying the target tab, should be done in
  // BoxModel.identifyDropTarget
  const {
    tabs
  } = rect;
  const tabCount = tabs ? tabs.length : 0;
  let tab = tabs && tabs.find(({
    left,
    right
  }) => mouseX >= left && mouseX <= right);

  if (tab) {
    _currentTabIndex = tabs.indexOf(tab);
  } else {
    const lastTab = tabs && tabs[tabs.length - 1];

    if (lastTab) {
      tab = {
        left: lastTab.right
      };
      _currentTabIndex = tabs.length;
    } else {
      tab = {
        left: rect.left
      };
      _currentTabIndex = -1;
    }
  } //====================================== EXPERIMENT


  if (_currentTabIndex > -1 && _currentTabIndex < tabCount) {
    const selector = `:scope > .Tabstrip > .tabstrip-inner-sleeve > .tabstrip-inner > .Tab:nth-child(${_currentTabIndex + 1})`;
    const tab = document.getElementById($id).querySelector(selector);

    if (tab && tab !== _shiftedTab) {
      if (_shiftedTab) {
        _shiftedTab.style.cssText = '';
      }

      tab.style.cssText = 'transition:margin-left .4s ease-out;margin-left: 80px';
      _shiftedTab = tab;
    }
  } else if (_shiftedTab) {
    _shiftedTab.style.cssText = '';
    _shiftedTab = null;
  } //====================================== EXPERIMENT


  _dropTargetIsTabstrip = rect.tabs && rect.tabs.length;
  var header = rect.header;
  var t = Math.round(header.top - offsetTop),
      l =
  /*header.name === 'Tabstrip' ? Math.round(header.tabRight) :*/
  Math.round(header.left - offsetLeft),
      r = Math.round(header.right - offsetLeft),
      b = Math.round(header.bottom - offsetTop),
      tabLeft = Math.round(tab.left - offsetLeft),
      tabRight = Math.round(tab.left + 60 - offsetLeft);
  ctx.beginPath();
  var lineWidth = 6;
  var inset = 0; // var headOffset = (header.top - rect.top) + header.height;

  var gap = Math.round(lineWidth / 2) + inset;
  var {
    top,
    left,
    right,
    bottom
  } = rect;
  setCanvasStyles(ctx, {
    lineWidth: lineWidth,
    strokeStyle: 'yellow'
  });
  drawTab(ctx, l + gap, t + gap, r, b, top, left - offsetLeft + gap, right - offsetLeft - gap, bottom - offsetTop - gap, tabLeft, tabRight);
  ctx.stroke();
}

function drawTab(ctx, l, t, r, b, top, left, right, bottom, tabLeft, tabRight) {
  var radius = 6; // var x = l;

  var y = t + 3; // var width = 100;

  var height = b - t;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(tabLeft + radius, y);
  ctx.lineTo(tabRight - radius, y);
  ctx.quadraticCurveTo(tabRight, y, tabRight, y + radius);
  ctx.lineTo(tabRight, y + height);
  ctx.lineTo(right, y + height);
  ctx.lineTo(right, bottom);
  ctx.lineTo(left, bottom);
  ctx.lineTo(left, y + height);
  ctx.lineTo(tabLeft, y + height);
  ctx.lineTo(tabLeft, y + radius);
  ctx.quadraticCurveTo(tabLeft, y, tabLeft + radius, y); //   ctx.moveTo(x, y + height);
  //   ctx.lineTo(x, y + radius);
  //   ctx.quadraticCurveTo(x,y,x + radius, y);
  //   ctx.lineTo(x + width - radius, y);
  //   ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  //   ctx.lineTo(x + width, y + height);
  //   ctx.lineTo(right, y + height);
  //   ctx.lineTo(right, bottom);
  //   ctx.lineTo(left, bottom);
  //   ctx.lineTo(left, y+height);

  ctx.closePath();

  {
    ctx.stroke();
  }
}

function drawOutline(ctx, pos, rect, w, h, offsetTop = 0, offsetLeft = 0) {
  var targetPosition = pos.position;
  var size = null; //onsole.log(`layout=${JSON.stringify(layout)}`);

  if (pos.width) {
    size = {
      width: pos.width
    };
  } else if (pos.height) {
    size = {
      height: pos.height
    };
  }

  var t = Math.round(rect.top - offsetTop),
      l = Math.round(rect.left - offsetLeft),
      r = Math.round(rect.right - offsetLeft),
      b = Math.round(rect.bottom - offsetTop);
  var lineWidth = 6;
  setCanvasStyles(ctx, {
    lineWidth: lineWidth,
    strokeStyle: 'yellow'
  });
  ctx.beginPath();
  var inset = 0;
  var gap = Math.round(lineWidth / 2) + inset;

  switch (targetPosition) {
    case NORTH$1:
    case HEADER$1:
      var halfHeight = Math.round((b - t) / 2);
      var sizeHeight = size && size.height ? size.height : 0;
      var height = sizeHeight ? Math.min(halfHeight, Math.round(sizeHeight)) : halfHeight;
      drawRect(ctx, l + gap, t + gap, r - gap, t + gap + height);
      break;

    case WEST$1:
      var halfWidth = Math.round((r - l) / 2);
      var sizeWidth = size && size.width ? size.width : 0;
      var width = sizeWidth ? Math.min(halfWidth, Math.round(sizeWidth)) : halfWidth;
      drawRect(ctx, l + gap, t + gap, l + gap + width, b - gap);
      break;

    case EAST$1:
      // var halfWidth = Math.round((r - l) / 2);
      // var sizeWidth = (size && size.width) ? size.width : 0;
      // var width = sizeWidth ? Math.min(halfWidth, Math.round(sizeWidth)) : halfWidth;
      drawRect(ctx, r - gap - width, t + gap, r - gap, b - gap);
      break;

    case SOUTH$1:
      // var halfHeight = Math.round((b - t) / 2);
      // var sizeHeight = (size && size.height) ? size.height : 0;
      // var height = sizeHeight ? Math.min(halfHeight, Math.round(sizeHeight)) : halfHeight;
      drawRect(ctx, l + gap, b - gap - height, r - gap, b - gap);
      break;

    default:
      console.log('DropTargetCanvas what are we doing here ?');
  }

  ctx.closePath();
  ctx.stroke(); // if (dropTarget.pos.closeToTheEdge == dropTarget.pos.position){
  // 	var zone = 30;
  //     ctx.beginPath();
  //     ctx.fillStyle = 'rgba(0,0,0,.25)';
  //     //TODO if op is 'insert' we may not be at the edge - may be 
  //     // somewhere in middle of a tower or terrace - look at index
  //     var g = 6;
  //     zone = zone - gap;
  //     console.log(_dropTarget.pos.position , dropTarget.pos.position);
  //     switch (_dropTarget.pos.position ){
  //         case NORTH: drawRect(ctx,l+g,t+g,r-g,t+g+zone); break;
  //         case SOUTH: drawRect(ctx,l+g,b-g-zone,r-g,b-g); break;
  //         case EAST: drawRect(ctx,r-g-zone,t+g,r-g,b-g); break;
  //         case WEST: drawRect(ctx,l+g,t+g,l+zone,b-g); break;
  //     }
  //     ctx.closePath();
  //     ctx.fill();
  // }
}

function drawDropOptions(canvas, dropTarget, measurements, w, h, offsetTop, offsetLeft) {
  // PopupService.showPopup({component : (
  //         <DropMenu dropTarget={dropTarget} measurements={measurements}
  //             onMouseOver={handleMouseOver(canvas, measurements, w, h)} /> )});
  // _dropMenu = true;
  _konvaDropMenu.computeMenuPosition(dropTarget, measurements, offsetTop, offsetLeft);

  _layer.draw();
} // function handleMouseOver(canvas, measurements, w, h) {
//     return function (dropTarget) {
//         draw(canvas, dropTarget, measurements, w, h, 0, 0, true);
//     };
// }


function setCanvasStyles(ctx, styles) {
  ctx.strokeStyle = styles.strokeStyle || 'black';
  ctx.lineWidth = styles.lineWidth || 2;
  ctx.fillStyle = styles.fillStyle || 'rgba(255,0,0,.5)'; // if (_multiDropOptions){
  // 	ctx.setLineDash([15,10]);
  // }
}

function drawRect(ctx, x1, y1, x2, y2) {
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x1, y2);
}

class DropTarget {
  constructor({
    component,
    pos
    /*, closeToTheEdge*/
    ,
    nextDropTarget
  }) {
    this.component = component;
    this.pos = pos;
    this.nextDropTarget = nextDropTarget;
    this.active = false;
  }

  activate() {
    this.active = true;
    return this;
  }

  static getActiveDropTarget(dropTarget) {
    return dropTarget.active ? dropTarget : DropTarget.getActiveDropTarget(dropTarget.nextDropTarget);
  } // Initial entry to this method is always via the app (may be it should be *on* the app)


  static identifyDropTarget(x, y, model, dragState, measurements) {
    let dropTarget = null; //onsole.log('Draggable.identifyDropTarget for component  ' + box.name + ' (' + box.nestedBoxes.length + ' children)') ;
    // this could return all boxes containing point, which would make getNextDropTarget almost free
    // Also, if we are over  atabstrip, it could include the actual tab

    var component = BoxModel.smallestBoxContainingPoint(model, measurements, x, y);

    if (component) {
      // onsole.log(`%cidentifyDropTarget target path ${component.$path}
      //     position: ${JSON.stringify(component.$position)}
      //     measurements : ${JSON.stringify(_measurements[component.$path])}
      //     `,'color:cornflowerblue;font-weight:bold;');
      const pos = BoxModel.pointPositionWithinRect(x, y, measurements[component.$path]);
      const nextDropTarget = getNextDropTarget(model, component, pos, dragState.constraint.zone, measurements, x, y);
      dropTarget = new DropTarget({
        component,
        pos,
        nextDropTarget
      }).activate(); // onsole.log('%c'+printDropTarget(dropTarget),'color:green');
    } //onsole.log(`\n${printDropTarget(dropTarget)}`);


    return dropTarget;
  }

} // must be cleared when we end the drag
// layout never changes
// component never changes
// pos neve changes
// zone enver changes
// measurements never change

function getNextDropTarget(layout, component, pos, zone, measurements, x, y) {
  const {
    north,
    south,
    east,
    west
  } = positionValues;
  const eastwest = east + west;
  const northsouth = north + south;
  return next();

  function next(container = containerOf(layout, component)) {
    if (pos.position.Header || pos.closeToTheEdge) {
      let nextDropTarget = false; // experiment...

      let containerPos = BoxModel.pointPositionWithinRect(x, y, measurements[container.$path]);

      while (container && positionedAtOuterContainerEdge(container, pos, component, measurements)) {
        //onsole.log(`${component.type} positioned at outer edge of container ${container.type}`);
        // if its a VBox and we're close to left or right ...
        if ((isVBox(container) || isTabbedContainer(container)) && pos.closeToTheEdge & eastwest) {
          nextDropTarget = true;
          containerPos.width = 120;
        } // if it's a HBox and we're close to top or bottom ...
        else if ((isHBox(container) || isTabbedContainer(container)) && (pos.position.Header || pos.closeToTheEdge & northsouth)) {
            nextDropTarget = true;
            containerPos.height = 120;
          }

        if (nextDropTarget) {
          if (containerPos.position.Header) {
            containerPos = { ...containerPos,
              position: north
            };
          } // For each DropTarget, specify which drop operations are appropriate


          return new DropTarget({
            component: container,
            pos: containerPos,
            // <<<<  a local pos for each container
            nextDropTarget: next(containerOf(layout, container))
          });
        }

        container = containerOf(layout, container);
      }
    }
  }
}

function positionedAtOuterContainerEdge(containingComponent, {
  closeToTheEdge,
  position
}, component, measurements) {
  const containingBox = measurements[containingComponent.$path];
  const box = measurements[component.$path];
  const closeToTop = closeToTheEdge & positionValues.north;
  const closeToRight = closeToTheEdge & positionValues.east;
  const closeToBottom = closeToTheEdge & positionValues.south;
  const closeToLeft = closeToTheEdge & positionValues.west;
  if ((closeToTop || position.Header) && box.top === containingBox.top) return true;
  if (closeToRight && box.right === containingBox.right) return true;
  if (closeToBottom && box.bottom === containingBox.bottom) return true;
  if (closeToLeft && box.left === containingBox.left) return true;
  return false;
}

function isTabbedContainer({
  type
}) {
  return type === 'TabbedContainer';
}

function isVBox({
  type,
  style: {
    flexDirection
  }
}) {
  return type === 'FlexBox' && flexDirection === "column";
}

function isHBox({
  type,
  style: {
    flexDirection
  }
}) {
  return type === 'FlexBox' && flexDirection === "row";
} // const w = '  ';
// function printDropTarget(dropTarget, s=w){
// 	const {pos} = dropTarget;
// 	const ctte = pos.closeToTheEdge ? `=>${printClose(pos.closeToTheEdge)}<=` : '';
//     const size = pos.width ? ` width:${pos.width} ` : pos.height ? ` height:${pos.height} ` : '';
//     var str = `<${dropTarget.component.type}> ${ctte} ${size} $${dropTarget.component.$path}`;
//     if (dropTarget.nextDropTarget != null){
//         str += `\n${s} ${printDropTarget(dropTarget.nextDropTarget,s+w)}` 
//     }
//     return str;
// }
// function printClose(val){
// 	var s = '';
// 	if (val & 1) s+= 'N';
// 	if (val & 4) s+= 'S';
// 	if (val & 2) s+= 'E';
// 	if (val & 8) s += 'W';
// 	return s;
// }

var SCALE_FACTOR = 0.4;
class DragState {
  constructor(zone, mouseX, mouseY, measurements) {
    this.init(zone, mouseX, mouseY, measurements);
  }

  init(zone, mouseX, mouseY, rect) {
    var {
      left: x,
      top: y
    } = rect;
    var mousePosition = BoxModel.pointPositionWithinRect(mouseX, mouseY, rect); // We are applying a scale factor of 0.4 to the draggee. This is purely a visual
    // effect - the actual box size remains the original size. The 'leading' values 
    // represent the difference between the visual scaled down box and the actual box.

    var scaleFactor = SCALE_FACTOR;
    var leadX = mousePosition.pctX * rect.width;
    var trailX = rect.width - leadX;
    var leadY = mousePosition.pctY * rect.height;
    var trailY = rect.height - leadY; // When we assign position to rect using css. positioning units are applied to the 
    // unscaled shape, so we have to adjust values to take scaling into account.

    var scaledWidth = rect.width * scaleFactor,
        scaledHeight = rect.height * scaleFactor;
    var scaleDiff = 1 - scaleFactor;
    var leadXScaleDiff = leadX * scaleDiff;
    var leadYScaleDiff = leadY * scaleDiff;
    var trailXScaleDiff = trailX * scaleDiff;
    var trailYScaleDiff = trailY * scaleDiff;
    this.constraint = {
      zone: {
        x: {
          lo: zone.left,
          hi: zone.right
        },
        y: {
          lo: zone.top,
          hi: zone.bottom
        }
      },
      pos: {
        x: {
          lo:
          /* left */
          zone.left - leadXScaleDiff,
          hi:
          /* right */
          zone.right - rect.width + trailXScaleDiff
        },
        y: {
          lo:
          /* top */
          zone.top - leadYScaleDiff,
          hi:
          /* bottom */
          zone.bottom - rect.height + trailYScaleDiff
        }
      },
      mouse: {
        x: {
          lo:
          /* left */
          zone.left + scaledWidth * mousePosition.pctX,
          hi:
          /* right */
          zone.right - scaledWidth * (1 - mousePosition.pctX)
        },
        y: {
          lo:
          /* top */
          zone.top + scaledHeight * mousePosition.pctY,
          hi:
          /* bottom */
          zone.bottom - scaledHeight * (1 - mousePosition.pctY)
        }
      }
    }; //onsole.log(JSON.stringify(this.constraint,null,2));

    this.x = {
      pos: x,
      lo: false,
      hi: false,
      mousePos: mouseX,
      mousePct: mousePosition.pctX
    };
    this.y = {
      pos: y,
      lo: false,
      hi: false,
      mousePos: mouseY,
      mousePct: mousePosition.pctY
    };
  }

  outOfBounds() {
    return this.x.lo || this.x.hi || this.y.lo || this.y.hi;
  }

  inBounds() {
    return !this.outOfBounds();
  }

  dropX() {
    return dropXY.call(this, 'x');
  }

  dropY() {
    return dropXY.call(this, 'y');
  }
  /*
   *  diff = mouse movement, signed int
   *  xy = 'x' or 'y'
   */
  //todo, diff can be calculated in here


  update(xy, mousePos) {
    var state = this[xy],
        mouseConstraint = this.constraint.mouse[xy],
        posConstraint = this.constraint.pos[xy],
        previousPos = state.pos;
    var diff = mousePos - state.mousePos; //xy==='x' && console.log(`update: state.lo=${state.lo}, mPos=${mousePos}, mC.lo=${mouseConstraint.lo}, prevPos=${previousPos}, diff=${diff} `  );

    if (diff < 0) {
      if (state.lo) ; else if (mousePos < mouseConstraint.lo) {
        state.lo = true;
        state.pos = posConstraint.lo;
      } else if (state.hi) {
        if (mousePos < mouseConstraint.hi) {
          state.hi = false;
          state.pos += diff;
        }
      } else {
        state.pos += diff;
      }
    } else if (diff > 0) {
      if (state.hi) ; else if (mousePos > mouseConstraint.hi) {
        state.hi = true;
        state.pos = posConstraint.hi;
      } else if (state.lo) {
        if (mousePos > mouseConstraint.lo) {
          state.lo = false;
          state.pos += diff;
        }
      } else {
        state.pos += diff;
      }
    }

    state.mousePos = mousePos;
    return previousPos !== state.pos;
  }

}

function dropXY(dir) {
  var pos = this[dir],
      rect = this.constraint.zone[dir]; // why not do the rounding +/- 1 on the rect initially - this is all it is usef for

  return pos.lo ? Math.max(rect.lo, pos.mousePos) : pos.hi ? Math.min(pos.mousePos, Math.round(rect.hi) - 1) : pos.mousePos;
}

var _dragCallback;

var _dragStartX;

var _dragStartY;

var _dragContainer;

var _dragState;

var _dragThreshold = 5;
var _dropTarget$1 = null;

var _measurements;

var _simpleDrag;

var _dropTargetCanvas = new DropTargetCanvas();

var _dragContainers = [];
var SCALE_FACTOR$1 = 0.4;
class DragContainer {
  static register(path) {
    // need to decide how to store these
    _dragContainers.push(path);
  }

  static unregister()
  /*path*/
  {}

}

function getDraggable(component) {
  var target;
  var header = component.refs.header || component.tabstrip;

  if (header && header.props.draggable) {
    target = header;
  } else if (component.props.draggable) {
    target = component;
  }

  return target;
}

var Draggable = {
  // bound to target components when called
  componentDidMount() {
    // // can we always rely on dragContainer being available at this point ?
    // // Might we have to wait for layout ?
    // if (this.props.dragContainer === true){
    //     DragContainer.register(this);
    // }
    var draggable = getDraggable(this);

    if (draggable) {
      this.mouseDownHandler = Draggable.handleMousedown.bind(this);
      ReactDOM.findDOMNode(draggable).addEventListener('mousedown', this.mouseDownHandler, false);
    }
  },

  componentWillUnmount() {
    var draggable = getDraggable(this);

    if (draggable) {
      ReactDOM.findDOMNode(draggable).removeEventListener('mousedown', this.mouseDownHandler, false);
      this.mouseDownHandler = null;
    }
  },

  // bound to Draggable Component
  handleMousedown(e, dragStartCallback) {
    _dragCallback = dragStartCallback;
    _dragStartX = e.clientX;
    _dragStartY = e.clientY;
    window.addEventListener('mousemove', preDragMousemoveHandler, false);
    window.addEventListener('mouseup', preDragMouseupHandler, false);
    e.preventDefault();
  },

  initDrag(e, layoutModel, path, {
    top,
    left,
    right,
    bottom
  }, dragHandler) {
    _dragCallback = dragHandler;
    return initDrag(e, layoutModel, path, {
      top,
      left,
      right,
      bottom
    });
  }

};

function preDragMousemoveHandler(e) {
  let x_diff =  e.clientX - _dragStartX ;
  let y_diff =  e.clientY - _dragStartY ;
  let mouseMoveDistance = Math.max(Math.abs(x_diff), Math.abs(y_diff)); // when we do finally move the draggee, we are going to 'jump' by the amount of the drag threshold, should we
  // attempt to animate this ?    

  if (mouseMoveDistance > _dragThreshold) {
    window.removeEventListener('mousemove', preDragMousemoveHandler, false);
    window.removeEventListener('mouseup', preDragMouseupHandler, false);

    if (_dragCallback(e, x_diff, y_diff) !== false) {
      window.addEventListener('mousemove', dragMousemoveHandler, false);
      window.addEventListener('mouseup', dragMouseupHandler, false);
    }
  }
}

function preDragMouseupHandler() {
  window.removeEventListener('mousemove', preDragMousemoveHandler, false);
  window.removeEventListener('mouseup', preDragMouseupHandler, false);
}

function getDragContainer(layoutModel, path) {
  var pathToContainer = '';
  var maxSteps = 0; // If the model has no path (i.e. it hasn't been dragged out of the existing layout)
  // hiow do we decide the dragContainer to use (assuming there may be more than 1)

  if (path === undefined) {
    pathToContainer = _dragContainers[0];
  } else {
    // find the longest container path that matches path (ie the smallest enclosing container); 
    for (var i = 0; i < _dragContainers.length; i++) {
      if (path.indexOf(_dragContainers[i]) === 0) {
        var steps = _dragContainers[i].split('.').length;

        if (steps > maxSteps) {
          maxSteps = steps;
          pathToContainer = _dragContainers[i];
        }
      }
    }
  }

  return followPath(layoutModel, pathToContainer);
}

function initDrag(evt, layoutModel, path, dragRect) {
  _dragContainer = getDragContainer(layoutModel, path);
  var start = window.performance.now(); // translate the layout $position to drag-oriented co-ordinates, ignoring splitters

  _measurements = BoxModel.measure(layoutModel);
  var end = window.performance.now();
  console.log(`initDrag taking measurements took ${end - start} ms dragContainer version ${_dragContainer.$version}`);
  var {
    type,
    $path
  } = _dragContainer;
  var dragZone = _measurements[$path];
  _dragState = new DragState(dragZone, evt.clientX, evt.clientY, dragRect);
  var pctX = Math.round(_dragState.x.mousePct * 100);
  var pctY = Math.round(_dragState.y.mousePct * 100);

  if (type === 'Surface') {
    _simpleDrag = true;
    return {};
  } else {
    _simpleDrag = false;

    _dropTargetCanvas.prepare(dragZone);

    return {
      draggableWidth: dragRect.right - dragRect.left,
      draggableHeight: dragRect.bottom - dragRect.top,
      transform: `scale(${SCALE_FACTOR$1},${SCALE_FACTOR$1})`,
      transformOrigin: pctX + "% " + pctY + "%"
    };
  }
}

function dragMousemoveHandler(evt) {
  const x = evt.clientX;
  const y = evt.clientY;
  const dragState = _dragState;
  var currentDropTarget = _dropTarget$1;
  var dropTarget;
  var newX, newY;

  if (dragState.update('x', x)) {
    newX = dragState.x.pos;
  }

  if (dragState.update('y', y)) {
    newY = dragState.y.pos;
  }

  if (newX === undefined && newY === undefined) ; else {
    _dragCallback.drag(newX, newY);
  }

  if (_simpleDrag) {
    return;
  }

  if (dragState.inBounds()) {
    dropTarget = DropTarget.identifyDropTarget(x, y, _dragContainer, dragState, _measurements);
  } else {
    dropTarget = DropTarget.identifyDropTarget(dragState.dropX(), dragState.dropY(), _dragContainer, dragState, _measurements);
  } // did we have an existing droptarget which is no longer such ...


  if (currentDropTarget) {
    if (dropTarget == null || dropTarget.box !== currentDropTarget.box) {
      _dropTarget$1 = null;
    }
  }

  if (dropTarget) {
    _dropTargetCanvas.draw(dropTarget, _measurements, x, y);

    _dropTarget$1 = dropTarget; // if (currentDropTarget && 
    //     currentDropTarget.component === dropTarget.component &&
    //     currentDropTarget.pos.position === dropTarget.pos.position &&
    //     // experiment...
    //     currentDropTarget.pos.closeToTheEdge === dropTarget.pos.closeToTheEdge){
    //     // no change from last turn, don't assign to _dropTarget, we might lose settings
    //     //onsole.log('%cSame Drop Target/Position','color:green');
    //     // BUT, we are going to want to reposition the dropmenu ... 
    // }
    // else {
    //     // redraw position marker
    //     //onsole.log('%cNew Drop Target/Position','color:red;font-weight:bold;');
    //     _dropTargetCanvas.draw(dropTarget, _measurements);
    //     _dropTarget = dropTarget;
    // }
  }
}

function dragMouseupHandler(evt) {
  onDragEnd();
}

function onDragEnd() {
  if (_dropTarget$1) {
    const dropTarget = _dropTargetCanvas.hoverDropTarget || DropTarget.getActiveDropTarget(_dropTarget$1);

    if (_dropTargetCanvas.dropTargetIsTabstrip) {
      dropTarget.tabIndex = _dropTargetCanvas.currentTabIndex; // EXPERIMENT ----------- What is this trying to do ? (cos it's not working)

      const selector = `:scope > .Tabstrip > .tabstrip-inner-sleeve > .tabstrip-inner > .Tab:nth-child(${dropTarget.tabIndex + 1})`;
      const tabstrip = document.getElementById(dropTarget.component.$path);

      if (tabstrip) {
        const tab = tabstrip.querySelector(selector);

        if (tab) {
          tab.style.cssText = '';
        }
      } else {
        console.log(`dropTarget indicated to be Tabstrip, but is not`);
      } //----------------------

    } // looking into eliminating this call altogether. We don't need it if we set the dragging index via
    // top-level layout state


    _dragCallback.drop(dropTarget, _measurements);

    _dropTarget$1 = null;
  } else {
    _dragCallback.drop({
      component: _dragContainer,
      pos: {
        position: Position.Absolute
      }
    });
  }

  _dragCallback = null;
  _dragContainer = null;

  _dropTargetCanvas.clear();

  window.removeEventListener('mousemove', dragMousemoveHandler, false);
  window.removeEventListener('mouseup', dragMouseupHandler, false);
}

class Container extends React.Component {
  constructor(props) {
    super(props);
    const layoutModel = this.getLayoutModel();
    this.state = {
      layoutModel,
      ...this.getState()
    };
    this.handleLayout = this.handleLayout.bind(this);
  }

  getState() {
    return {};
  }

  isLayoutRoot() {
    return this.props.layoutModel === undefined;
  }

  render() {
    var {
      style
    } = this.props;
    var layoutModel = this.getLayoutModel();
    var {
      layout,
      $position = layout
    } = layoutModel;
    return React.createElement("div", {
      className: layoutModel.type,
      style: { ...style,
        position: 'absolute',
        ...$position
      }
    }, layoutModel.children.map((child, idx) => this.renderChild(child, idx)));
  }

  renderChild(layoutModel) {
    const {
      children: child,
      onLayout
    } = this.props;
    const {
      style
    } = child.props;
    let props = {
      layoutModel,
      onLayout
    };
    const id = props.layoutModel.$id;
    props.id = id;
    props.key = id;
    props.style = { ...style,
      ...props.style
    };

    if (isLayout(layoutModel.type)) {
      return React.cloneElement(child, props);
    } else {
      return React.createElement(LayoutItem, _extends({}, child.props, props), child);
    }
  }

  componentDidMount() {
    const {
      layoutModel = null,
      onLayoutModel
    } = this.props;

    if (layoutModel === null && onLayoutModel) {
      onLayoutModel(this.state.layoutModel);
    }
  }

  shouldComponentUpdate(nextProps) {
    // if the Application passes down the dragging flag, do not render, the only rendering
    // to take place happens on the DragSurface.
    // if (nextProps.dragging){
    // onsole.log(`Container ${this.props.layoutModel.type} dragging  so don't update`);
    // }
    return nextProps.dragging !== true;
  }

  getLayoutModel() {
    if (this.isLayoutRoot()) {
      const layoutModel = getLayoutModel(this);
      console.log(`%c${JSON.stringify(layoutModel, null, 2)}`, 'color:blue;font-weight: bold;');
      const l = layout(layoutModel);
      console.log(`%c${JSON.stringify(l, null, 2)}`, 'color:brown;font-weight: bold;');
      return l; // return applyLayout(getLayoutModel(this));
    } else {
      return this.props.layoutModel;
    } // let {layoutModel/*,style*/} = this.props;
    // if (layoutModel === undefined){
    //     // console.log(`getRootLayoutModel for ${typeOf(this)}`);
    //     return applyLayout(getLayoutModel(this));
    // } /*else if (layoutModel.children && layoutModel.children.length === 0){
    //     alert('it happens')
    //     console.log(`mutating (appending) layoutModel children. Can this be avoided ?`)
    //     var children = getLayoutModelChildren(this);
    //     [].push.apply(layoutModel.children, children);
    //     var VISIBLE = style.visibility || 'visible';
    //     var FORCE_LAYOUT = true;
    //     var width;
    //     var height;
    //     var $position = layoutModel.$position;
    //     if (typeof style.width === 'number' && typeof style.height === 'number'){
    //         width = style.width;
    //         height = style.height;
    //     } else if ($position && $position.width !== undefined && $position.height !== undefined){
    //         width = $position.width;
    //         height = $position.height;
    //     } else {
    //         console.error(`Container.getLayoutModel attempting to initialize a ${layoutModel.type} layoutModel with no sizing attributes`)
    //     }
    //     console.log(`apply layout, WITH CHILDREN`)
    //     var layoutModel2 = applyLayout(layoutModel, {width,height}, layoutModel.$path, VISIBLE, FORCE_LAYOUT);
    //     layoutModel.children = layoutModel2.children;
    // } */
    // return layoutModel;

  }

  getManagedDimension() {
    return null;
  }

  handleLayout(command, options) {
    // is there some other way we can nominate the layout as a root, other than $path === '0'
    if (this.state.layoutModel && this.state.layoutModel.$path === '0'
    /*&& !this.props.layoutModel*/
    ) {
        // This is a top=level layout and the owner has not taken responsibility for layout, so we need to
        // Note: this will currently work only when the top-level container maintains its layoutModel in 
        // state (FlexBox and TabbedContainer)- other containers CAN be nested. 
        if (command === 'drag-start') {
          if (this.handleDragStart) {
            Draggable.handleMousedown(options.evt, this.handleDragStart.bind(this, options));
          }
        } else {
          let layoutModel;

          if (command === 'replace') {
            const {
              model: replacementNode
            } = options;
            const targetNode = followPath(this.state.layoutModel, replacementNode.$path);
            layoutModel = handleLayout(this.state.layoutModel, command, {
              targetNode,
              replacementNode
            });
          } else if (command === 'switch-tab') {
            layoutModel = handleLayout(this.state.layoutModel, 'switch-tab', options);
          } else if (command === 'drop') {
            layoutModel = handleLayout(this.state.layoutModel, 'drop', options);
          } else {
            throw Error(`Container: don't know how to handle command ${command}`);
          }

          if (layoutModel !== this.state.layoutModel) {
            this.setState({
              layoutModel
            });

            if (this.props.onLayoutModel) {
              this.props.onLayoutModel(layoutModel);
            }
          }
        }
      } else if (this.props.onLayout) {
      this.props.onLayout(command, options);
    }
  }

}
Container.defaultProps = {
  style: {
    flex: 1
  }
};
registerClass('Container', Container, true);

var _splitter,
    _direction;

class Splitter extends React.Component {
  render() {
    const {
      layout
    } = this.props.layoutModel;
    var {
      top,
      left,
      width,
      height
    } = layout; // onsole.log(`%c     Splitter ${top},${left},${width},${height}`,`background-color:brown;color:lime;`);

    var className = cx('Splitter', this.props.className);
    var style = {
      position: 'absolute',
      top,
      left,
      width,
      height,
      cursor: this.props.cursor
    };
    return React.createElement("div", {
      className: className,
      style: style
    });
  }

  componentDidMount() {
    this._mouseDownHandler = this.handleMousedown.bind(this);
    ReactDOM.findDOMNode(this).addEventListener('mousedown', this._mouseDownHandler, false);
  }

  componentWillUnmount() {
    ReactDOM.findDOMNode(this).removeEventListener('mousedown', this._mouseDownHandler, false);
    this._mouseDownHandler = null;
  }

  handleMousedown(e) {
    _splitter = this;
    initDrag$1.call(this, e);
    window.addEventListener("mousemove", mouseMoved, false);
    window.addEventListener("mouseup", mouseUp, false);
    e.preventDefault();
  }

}
Splitter.defaultProps = {
  style: {}
};

function mouseMoved(evt) {
  return onDrag.call(_splitter, evt);
}

function mouseUp(evt) {
  return onDragEnd$1.call(_splitter, evt);
}

function initDrag$1(e) {
  _direction = this.props.direction;
  var vertical = _direction === "vertical"; // var dim = vertical ? "height" : "width";

  this.lastPos = vertical ? e.clientY : e.clientX;
  this.props.onDragStart(this.props.absIdx);
}

function onDrag(evt) {
  var clientPos
  /*,
  dimension*/
  ;

  if (_direction === 'vertical') {
    clientPos = "clientY"; // dimension = "height";
  } else {
    clientPos = "clientX"; // dimension = "width";
  }

  var pos = evt[clientPos],
      diff = pos - this.lastPos; // we seem to get a final value of zero

  if (pos && pos !== this.lastPos) {
    this.props.onDrag(diff);
  }

  this.lastPos = pos;
}

function onDragEnd$1() {
  _splitter = null;
  window.removeEventListener("mousemove", mouseMoved, false);
  window.removeEventListener("mouseup", mouseUp, false);
  this.props.onDragEnd();
}

const NO_STYLE$1 = {};
class FlexBox extends Container {
  render() {
    var {
      style = NO_STYLE$1,
      isSelected,
      title
    } = this.props;
    var {
      layout,
      header,
      style: {
        boxShadow
      }
    } = this.state.layoutModel;

    if (this.state.layoutModel.$id === 'col-picker') {
      console.log(`FlexBox.render layout ${JSON.stringify(this.state.layoutModel, null, 2)}`);
    }

    const {
      backgroundColor,
      visibility
    } = style;
    var className = cx(style.flexDirection === 'row' ? 'Terrace' : 'Tower', this.props.className, isSelected ? 'active' : null);

    if (visibility === 'hidden') {
      return null;
    }

    const position = this.isLayoutRoot() ? 'relative' : 'absolute';
    return React.createElement("div", {
      className: className,
      style: {
        position,
        ...layout,
        backgroundColor,
        boxShadow
      }
    }, header && React.createElement(ComponentHeader, {
      title: `${title}`,
      onMouseDown: e => this.handleMouseDown(e),
      style: {
        height: header.height
      },
      menu: header.menu
    }), this.renderFlexibleChildren());
  }

  renderFlexibleChildren() {
    var {
      style: {
        flexDirection
      },
      visibility
    } = this.props;
    var cursor = flexDirection === 'column' ? 'ns-resize' : 'ew-resize';
    var splitterIdx = 0;
    var {
      children: layoutChildren
    } = this.state.layoutModel;
    const propChildren = Array.isArray(this.props.children) ? this.props.children.filter(child => child) : [this.props.children];
    var results = [];

    for (var idx = 0, childIdx = 0; idx < layoutChildren.length; idx++) {
      var childLayoutModel = layoutChildren[idx];

      if (childLayoutModel.type === 'Splitter') {
        //TODO do we still need the refs ?
        results.push(React.createElement(Splitter, {
          ref: 'splitter-' + splitterIdx,
          key: 'splitter-' + childIdx,
          idx: childIdx,
          absIdx: idx,
          direction: flexDirection === 'column' ? 'vertical' : 'horizontal',
          cursor: cursor,
          onDragStart: this.splitterDragStart.bind(this),
          onDrag: this.splitterMoved.bind(this),
          onDragEnd: () => this.handleSplitterDragEnd(),
          onLayout: this.handleLayout,
          layoutModel: childLayoutModel
        }));
        splitterIdx += 1;
      } else {
        var child = propChildren[childIdx];
        var {
          style = {},
          ...childProps
        } = child.props;
        var id = childLayoutModel.$id;
        var props = {
          id,
          key: id,
          idx: childIdx,
          absIdx: idx,
          onLayout: this.handleLayout,
          onConfigChange: this.handleConfigChange.bind(this),
          layoutModel: childLayoutModel
        };
        style = { ...style,
          visibility
        };

        if (props.dragContainer === true && child.type.displayName !== 'Container') {
          //onsole.log(`FlexBox wrapping ${child.type.displayName} with Container `);
          const {
            width,
            height
          } = props.layoutModel.$position; // IS HTIS RIGHT ?

          results.push(React.createElement(Container, _extends({}, childProps, props, {
            style: {
              flex: style.flex,
              width,
              height,
              visibility
            }
          }), child));
        } else if (isLayout$1(child)) {
          results.push(React.cloneElement(child, { ...props,
            style
          }));
        } else {
          results.push(React.createElement(LayoutItem, _extends({}, childProps, props, {
            style: style
          }), child));
        }

        childIdx += 1;
      }
    }

    return results;
  }

  componentWillReceiveProps(nextProps) {
    var {
      layoutModel
    } = nextProps;

    if (layoutModel && layoutModel !== this.state.layoutModel) {
      this.setState({
        layoutModel
      });
    } else if (this.state.layoutModel.$path === '0') {
      // detact changes to style that will affect layout
      if (layoutStyleDiff(this.props.style, nextProps.style)) {
        const {
          width,
          height
        } = nextProps.style;
        const VISIBLE = nextProps.style.visibility || 'visible';
        const FORCE_LAYOUT = true;
        this.setState({
          layoutModel: layout({ ...this.state.layoutModel,
            style: nextProps.style
          }, {
            width,
            height
          }, this.state.layoutModel.$path, VISIBLE, FORCE_LAYOUT)
        });
      }
    }
  }

  getManagedDimension() {
    var {
      style: {
        flexDirection
      }
    } = this.state.layoutModel;
    return flexDirection === 'row' ? 'width' : 'height';
  }

  getDragPermission(component) {
    if (component.constructor.displayName === 'Splitter') {
      return this.props.style.flexDirection === 'row' ? {
        y: false,
        x: true
      } : {
        x: false,
        y: true
      };
    } else {
      return {
        x: true,
        y: true
      };
    }
  } // copied from layoutItem


  handleMouseDown(e) {
    if (this.props.onMouseDown) {
      this.props.onMouseDown({
        model: this.props.layoutModel,
        evt: e,
        position: ReactDOM.findDOMNode(this).getBoundingClientRect()
      });
    } else {
      this.props.onLayout('drag-start', {
        model: this.state.layoutModel,
        evt: e,
        position: ReactDOM.findDOMNode(this).getBoundingClientRect()
      });
    }
  }

  splitterDragStart(idx) {
    this.splitChildren = this.identifySplitChildren(idx);
  }

  splitterMoved(distance) {
    const [idx1,, idx2] = this.splitChildren;
    const dim = this.getManagedDimension();
    let layoutModel = this.state.layoutModel;
    const measurements = layoutModel.children.map(child => child.layout[dim]);
    measurements[idx1] += distance;
    measurements[idx2] -= distance;
    const RESIZE = 'resize';
    var options = {
      path: layoutModel.$path,
      measurements,
      dimension: dim
    };
    layoutModel = handleLayout(layoutModel, RESIZE, options);
    this.setState({
      layoutModel
    });
  }

  identifySplitChildren(splitterIdx) {
    const children = this.state.layoutModel.children;
    let idx1 = splitterIdx - 1;
    let idx2 = splitterIdx + 1;
    let child;

    while ((child = children[idx1]) && !child.resizeable) idx1--;

    while ((child = children[idx2]) && !child.resizeable) idx2++;

    return [idx1, splitterIdx, idx2];
  }

  handleSplitterDragEnd() {
    this.handleLayout('replace', {
      model: this.state.layoutModel
    });
    this.splitChildren = null;
  }

  handleConfigChange(component, {
    fixed
  }) {
    if (fixed !== 'undefined') {
      //TODO we don't need to do this if it has been done already
      this.props.onLayout('config-change', {
        dimensions: this.assignExplicitSizeToFlexElements(),
        fixed,
        component: component.props.json,
        container: this.props.json
      });
    }
  }

}
FlexBox.displayName = 'FlexBox';
FlexBox.defaultProps = {
  style: {
    flexDirection: 'column'
  }
};
registerClass('FlexBox', FlexBox, true);

const OVERFLOW_WIDTH = 24;

function handleClick(e, idx, onClick) {
  e.preventDefault();
  onClick(idx);
}

const Tab = ({
  idx,
  text,
  isSelected,
  onClick,
  onMouseDown
}) => React.createElement("li", {
  className: cx('Tab', {
    'active': isSelected
  }),
  onClick: e => handleClick(e, idx, onClick),
  onMouseDown: onMouseDown
}, React.createElement("a", {
  href: "#",
  className: "tab-caption",
  "data-idx": idx
}, text));

const TabstripOverflow = ({
  onClick
}) => React.createElement("div", {
  className: "TabstripOverflow",
  onClick: onClick
});

class Tabstrip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      overflowing: false
    };
    this.el = null;
  }

  render() {
    const {
      style,
      children,
      onMouseDown,
      selected = 0
    } = this.props;
    const {
      overflowing
    } = this.state;
    const className = cx('Tabstrip', this.props.className, {
      overflowing
    });
    const tabs = children.map((child, idx) => {
      return React.cloneElement(child, {
        idx,
        isSelected: selected === idx,
        onClick: i => this.handleTabClick(i)
      });
    });
    return React.createElement("div", {
      className: className,
      style: style,
      onMouseDown: onMouseDown,
      ref: el => this.el = el
    }, React.createElement("div", {
      className: "tabstrip-inner-sleeve"
    }, React.createElement("ul", {
      className: "tabstrip-inner"
    }, tabs)), overflowing && React.createElement(TabstripOverflow, {
      onClick: () => this.showOverflow()
    }));
  }

  componentDidMount() {
    this.checkOverflowState();
  }

  componentDidUpdate() {
    this.checkOverflowState(); // only necesary if selection has changed or tabstrip has resized
    // make sure selected tab is in view 

    this.ensureSelectedTabisVisible();
  }

  checkOverflowState() {
    const freeSpace = this.measureFreeSpace();
    const {
      overflowing
    } = this.state;

    if (freeSpace < 0 && overflowing === false) {
      this.setState({
        overflowing: true
      });
    } else if (freeSpace >= 0 && overflowing === true) {
      this.setState({
        overflowing: false
      });
    }
  }

  handleTabClick(selectedIdx) {
    if (selectedIdx !== this.props.selected) {
      this.props.onSelectionChange(this.props.selected, selectedIdx);
    }
  }

  ensureSelectedTabisVisible() {
    const tabstripInner = this.el.querySelector('.tabstrip-inner');
    const activeTab = tabstripInner.querySelector('.active.Tab');

    if (!activeTab) {
      // eg if dragging;
      return;
    }

    const tsBox = this.el.getBoundingClientRect();
    const tbBox = activeTab.getBoundingClientRect();
    const ulBox = tabstripInner.getBoundingClientRect();
    const tbOffStageRight = Math.floor(tsBox.right - tbBox.right);
    const ulOffStageLeft = Math.floor(ulBox.left - tsBox.left);
    const overflowing = ulBox.right > tbBox.right;
    let translateX;

    if (ulOffStageLeft === 0 && tbOffStageRight < 0) {
      translateX = ulOffStageLeft + tbOffStageRight - OVERFLOW_WIDTH;
      tabstripInner.style.transform = `translate(${translateX}px,0px)`;
    } else if (ulOffStageLeft < 0 && tbOffStageRight === OVERFLOW_WIDTH) ; else if (ulOffStageLeft < 0 && tbOffStageRight < OVERFLOW_WIDTH) {
      translateX = ulOffStageLeft + tbOffStageRight - OVERFLOW_WIDTH;
      tabstripInner.style.transform = `translate(${translateX}px,0px)`;
    } else if (overflowing && tbOffStageRight < OVERFLOW_WIDTH) {
      translateX = tbOffStageRight - OVERFLOW_WIDTH;
      tabstripInner.style.transform = `translate(${translateX}px,0px)`;
    } else if (ulOffStageLeft < 0) {
      translateX = Math.min(0, ulOffStageLeft + tbOffStageRight - OVERFLOW_WIDTH);
      tabstripInner.style.transform = `translate(${translateX}px,0px)`;
    }
  }

  measureFreeSpace() {
    const tabstripInner = this.el.querySelector('.tabstrip-inner');
    return this.el.clientWidth - tabstripInner.clientWidth;
  }

  showOverflow() {
    const overflow = this.el.querySelector('.TabstripOverflow');
    const {
      right,
      bottom
    } = overflow.getBoundingClientRect();
    const {
      children: tabs
    } = this.props;
    const menuItems = tabs.map(({
      props: {
        text
      }
    }) => React.createElement(MenuItem, {
      key: text,
      action: "setActiveTab",
      label: text,
      data: text
    }));
    PopupService.showPopup({
      left: right,
      top: bottom,
      position: 'top-bottom-right-right',
      component: React.createElement(ContextMenu, {
        component: this,
        doAction: (action, data) => this.handleContextMenuAction(action, data),
        left: "auto",
        bottom: "auto",
        right: 0,
        top: 0
      }, menuItems)
    });
  }

  handleContextMenuAction(action, data) {
    if (action === 'setActiveTab') {
      const idx = this.props.children.findIndex(tab => tab.props.text === data);

      if (idx !== -1) {
        this.handleTabClick(idx);
      }
    }
  }

}

const DEFAULT_TABSTRIP_HEIGHT = 34;
class TabbedContainer extends Container {
  constructor(props) {
    super(props);
    this.tabstrip = null;
  }

  render() {
    var {
      style,
      tabstripHeight,
      children
    } = this.props;
    const {
      layoutModel
    } = this.state;
    var {
      $path,
      layout,
      $position = layout,
      active
    } = layoutModel; // Don't allow either the tabs or the tabstrip itself to be dragged unless it is inside
    // the DragZone. We might further config-enable this eg. allow tabs but not the tabstrip
    // to be dragged when the TabbedContainer IS the DragZOne.

    var isDraggable = true; // Note: if key is not assigned here, we will get a React warning, even though it is assigned in Tabstrip !

    var tabs = children.map((child, idx) => {
      return React.createElement(Tab, {
        key: idx,
        text: titleFor(child),
        onMouseDown: e => this.handleMouseDown(e, layoutModel.children[idx])
      });
    });
    var className = cx('TabbedContainer', this.props.className);
    return React.createElement("div", {
      id: $path,
      className: className,
      style: { ...style,
        position: 'absolute',
        ...$position
      }
    }, React.createElement(Tabstrip, {
      className: "header",
      ref: component => this.tabstrip = component,
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: $position.width,
        height: tabstripHeight
      },
      draggable: isDraggable,
      selected: active,
      dragging: this.state.dragging,
      onMouseDown: e => this.handleMouseDown(e),
      onSelectionChange: (selected, idx) => this.handleTabSelection(selected, idx)
    }, tabs), this.renderChildren());
  }

  renderChildren() {
    const {
      children,
      onLayout
    } = this.props;
    const {
      layoutModel: {
        active = 0,
        children: layoutChildren
      }
    } = this.state;
    const child = children[active];
    var childLayoutModel = layoutChildren[active];
    var {
      title,
      style = {},
      ...childProps
    } = child.props;
    var id = childLayoutModel.$id;
    style = { ...style,
      ...childLayoutModel.style
    }; // TODO shouldn't layoutModel be the sole source of tryth for style ?

    var props = {
      id,
      key: id,
      container: this,
      onLayout,
      onConfigChange: this.handleConfigChange,
      title: title,
      layoutModel: childLayoutModel
    };

    if (isLayout$2(child)) {
      return React.cloneElement(child, { ...props,
        style
      });
    } else {
      return React.createElement(LayoutItem, _extends({}, childProps, props, {
        style: style
      }), child);
    }
  } // duplicated from flexBox as an experiment, wh can't this be moved entirely to Container


  componentWillReceiveProps(nextProps) {
    var {
      layoutModel
    } = nextProps;

    if (layoutModel && layoutModel !== this.state.layoutModel) {
      this.setState({
        layoutModel
      });
    } else if (this.state.layoutModel.$path === '0') {
      // special handling if we are at the root of a layout
      // should handle this in Container
      const {
        style: {
          width,
          height,
          visibility
        }
      } = nextProps;
      const {
        style
      } = this.props;

      if (width !== style.width || height !== style.height || visibility !== style.visibility) {
        const VISIBLE = visibility || 'visible';
        const FORCE_LAYOUT = true;
        this.setState({
          layoutModel: layout(this.state.layoutModel, {
            width,
            height
          }, this.state.layoutModel.$path, VISIBLE, FORCE_LAYOUT)
        });
      }
    }
  }

  getDragPermission()
  /* component */
  {
    return {
      x: true,
      y: true
    };
  } // getDragBoundingRect(){
  //     debugger;
  //     var {top, left, width, height,right, bottom} = ReactDOM.findDOMNode(this).getBoundingClientRect();
  //     var tabstripHeight = this.tabstrip.getDOMNode().clientHeight;
  //     if (this.props.dragContainer === true){
  //         return {top: top+tabstripHeight, left, width, height: height-tabstripHeight, right, bottom};
  //     } else {
  //         return {top, left, width, height, right, bottom};
  //     }
  // }


  handleTabSelection(selected, idx) {
    const {
      onLayout = this.handleLayout
    } = this.props;
    const {
      layoutModel
    } = this.state;
    onLayout('switch-tab', {
      path: layoutModel.$path,
      idx: this.props.active,
      nextIdx: idx
    });

    if (this.props.onTabSelectionChanged) {
      this.props.onTabSelectionChanged(idx);
    }
  }

  handleMouseDown(e, model = this.state.layoutModel) {
    e.stopPropagation();
    const {
      onLayout = this.handleLayout
    } = this.props;
    onLayout('drag-start', {
      model,
      evt: e,
      position: ReactDOM.findDOMNode(this).getBoundingClientRect()
    });
  }

}
TabbedContainer.displayName = 'TabbedContainer';
TabbedContainer.defaultProps = {
  tabstripHeight: DEFAULT_TABSTRIP_HEIGHT
};
registerClass('TabbedContainer', TabbedContainer, true);

function titleFor(component) {
  var {
    title,
    config
  } = component.props;
  return title || config && config.title || 'Tab X';
}

function isLayout$2(element) {
  return element.type.displayName === 'FlexBox' || element.type.displayName === 'TabbedContainer' || element.type.displayName === 'DynamicContainer';
}

// and vis managing Flexible container

class Component extends React.Component {
  render() {
    const className = cx('Component');
    const {
      children,
      id,
      flexible,
      onLayout,
      position,
      _style,
      onClick,
      ...props
    } = this.props;
    return React.createElement("div", {
      className: className,
      style: this.props.style,
      onClick: onClick
    }, children && React.isValidElement(children) && !isHtmlType(children) ? React.cloneElement(children, { ...props
    }) : children);
  }

}
Component.defaultProps = {
  style: {},
  position: {},
  _style: {},
  onClick: () => {}
};

function isHtmlType(element) {
  const {
    type
  } = element;
  return typeof type === 'string' && type[0] === type[0].toLowerCase();
}

class PlaceHolder extends React.Component {
  render() {
    var className = cx("PlaceHolder", this.props.className);
    var style = { ...this.props.style,
      backgroundColor: 'rgb(60,60,60)'
    };
    return React.createElement("div", {
      className: className,
      style: style
    }, React.createElement("div", {
      className: "close icon-arrow",
      onClick: this.handleClose.bind(this)
    }, React.createElement("span", null, "Close")));
  }

  handleClose() {
    this.props.onLayout('remove');
  }

}
PlaceHolder.defaultProps = {
  layout: {
    ready: false
  }
};

registerClass('PlaceHolder', PlaceHolder);
registerClass('LayoutItem', LayoutItem);
registerClass('Component', Component);
function renderDynamicLayout(container, props, layoutModel) {
  var {
    children,
    dragContainer,
    ...remainingProps
  } = container.props;
  var {
    style: propStyle,
    ...rest
  } = props;
  var {
    active,
    style: layoutStyle = {}
  } = layoutModel;
  var finalProps = { ...remainingProps,
    active,
    ...rest,
    layoutModel,
    style: { ...layoutStyle,
      ...propStyle
    }
  }; //onsole.log('renderDynamicContainer about to create a new component (fom json) which will be cloned)',layout,finalProps);

  return React.cloneElement(componentFromLayout(layoutModel), finalProps);
}
function componentFromLayout(layout) {
  //onsole.log(`%ccomponentFromLayout\n${JSON.stringify(json,null,2)}`,'background-color:ivory;color:brown;')
  return _componentFromLayout(layout);
}

function notSplitterOrLayout(model) {
  return model.type !== 'Splitter' && model.type !== 'layout';
}

function _componentFromLayout(layoutModel) {
  if (Array.isArray(layoutModel)) {
    return layoutModel.map(_componentFromLayout);
  } else if (layoutModel == null) {
    return null;
  }

  const {
    $id,
    $path,
    type,
    ...props
  } = layoutModel;
  const [ReactType, reactBuiltIn] = getComponentType(type);
  let children;

  if (type === 'Container') {
    children = null;
  } else {
    children = layoutModel.children && layoutModel.children.length ? layoutModel.children.filter(notSplitterOrLayout).map(_componentFromLayout) : null;
    if (children && children.length === 1) children = children[0];
  }

  return reactBuiltIn ? React.createElement(ReactType, _extends({}, props, {
    key: $id
  }), children) : React.createElement(ReactType, _extends({}, props, {
    key: $id,
    layoutModel: layoutModel
  }), children);
}

function getComponentType(type) {
  if (ComponentRegistry[type]) {
    return [ComponentRegistry[type], false];
  } else if (type === type.toLowerCase()) {
    return [type, true];
  }

  throw Error('componentFromLayout: unknown component type: ' + type);
}

class DynamicContainer extends Container {
  componentDidMount() {
    super.componentDidMount();
    DragContainer.register(this.state.layoutModel.$path);
  }

  renderChild(layoutModel, idx) {
    var {
      layoutModel: {
        $version
      },
      onLayout
    } = this.props;

    if ($version === 1 && this.props.children) {
      // WHAT wa sthis for ?
      return super.renderChild(layoutModel, idx);
    }

    var props = {
      layoutModel,
      onLayout
    };
    props.key = props.id = layoutModel.$id;

    if (isLayout$1(layoutModel.type)) {
      return this.renderFromLayout(this, props, layoutModel);
    } else {
      return React.createElement(LayoutItem, _extends({}, props, {
        layout: layoutModel
      }), this.renderFromLayout(this, props, layoutModel));
    }
  }

  getState() {
    return {
      dragging: -1
    };
  } // not currently called from FlexBox, but might need to be
  // routinely called by top-level Container of Application


  renderFromLayout(element, props, layout) {
    return renderDynamicLayout(element, props, layout);
  }

  getLayoutModelChildren() {
    if (this.props.contentModel) {
      return [this.props.contentModel];
    } else {
      return super.getLayoutModelChildren();
    }
  }

  drop(component, dropTarget) {
    this.setState({
      dragging: -1,
      tempDimensions: undefined
    });
  }

}
DynamicContainer.displayName = 'DynamicContainer';
DynamicContainer.defaultProps = {
  style: {
    flex: 1
  },
  config: {}
};
registerClass('DynamicContainer', DynamicContainer, true);

const NO_CHILDREN$1 = [];
const EMPTY_OBJECT$1 = {};
class Surface extends DynamicContainer {
  constructor(props) {
    super(props);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  getState() {
    return {
      dragging: false,
      draggedIcon: null,
      draggedComponent: null
    };
  }

  render() {
    var className = cx(this.props.className, 'rect-layout', 'rect-container', 'Surface');
    const {
      layoutModel: {
        children = NO_CHILDREN$1
      },
      draggedComponent
    } = this.state;
    const childrenToRender = draggedComponent ? [...children, draggedComponent] : children;
    return React.createElement("div", {
      id: this.state.id,
      className: className,
      style: this.props.style
    }, childrenToRender.map((child, idx) => this.renderChild(child, idx)));
  }

  renderChild(layoutModel, idx) {
    const {
      children
    } = this.props;
    const child = React.isValidElement(children) && idx === 0 ? children : Array.isArray(children) && children[idx] ? children[idx] : componentFromLayout(layoutModel);
    const props = {
      key: layoutModel.$id,
      onLayout: this.handleLayout,
      layoutModel
    };
    const dragging = layoutModel === this.state.draggedComponent;
    const style = { ...child.props.style,
      boxSizing: 'content-box'
    };

    if (isLayout$1(child)) {
      return React.cloneElement(child, { ...props,
        style
      });
    } else {
      return React.createElement(LayoutItem, _extends({
        dragging: dragging
      }, props, {
        style: style
      }), child);
    }
  }

  componentWillReceiveProps(nextProps) {
    const {
      layoutModel
    } = nextProps;

    if (layoutModel && layoutModel !== this.state.layoutModel) {
      this.setState({
        layoutModel
      });
    }
  }

  renderChildren() {
    return null;
  }

  getDragPermission()
  /*component*/
  {
    return {
      x: true,
      y: true
    };
  }

  handleDragStart({
    model,
    position,
    instructions = EMPTY_OBJECT$1
  }, e) {
    var {
      top,
      left
    } = position; // Can we find a better way than these clumsy instructions

    const layoutModel = !instructions.DoNotRemove ? handleLayout(this.state.layoutModel, 'remove', {
      targetNode: model
    }) : this.state.layoutModel;
    const {
      draggableWidth: width,
      draggableHeight: height,
      ...dragTransform
    } = Draggable.initDrag(e, layoutModel, model.$path, position, {
      drag: this.handleDrag,
      drop: this.handleDrop
    });
    var {
      $path,
      layout: modelLayout,
      style,
      dragAsIcon,
      ...rest
    } = model;
    const layout = modelLayout ? {
      width,
      height,
      ...modelLayout,
      top,
      left
    } : {
      top,
      left,
      width,
      height
    };
    var draggedIcon = dragAsIcon ? componentFromLayout({
      type: 'ComponentIcon',
      color: 'red',
      style: { ...style,
        position: 'absolute',
        width: 120,
        height: 45,
        visibility: 'visible'
      },
      layout
    }) : undefined; // what if draggedComponent is a Layout ?    

    var draggedComponent = dragAsIcon ? {
      $id: uuid(),
      $path,
      layout,
      style,
      ...rest
    } : { ...rest,
      style: { ...style,
        position: 'absolute',
        ...(!instructions.DoNotTransform && dragTransform),
        visibility: 'visible'
      },
      layout,
      children: [{
        type: 'layout',
        style: {},
        layout: { ...layout,
          top: 0,
          left: 0
        }
      }]
    }; // don't set dragging yet, it will suppress the final render of app with draggedComonent
    // removed.

    this.setState({
      dragX: left,
      dragY: top,
      draggedIcon,
      draggedComponent,
      layoutModel
    });
    return true;
  }

  handleDrag(x, y) {
    const {
      draggedComponent
    } = this.state;
    let {
      layout,
      style
    } = draggedComponent;

    if (typeof x === 'number' && x !== layout.left) {
      layout = { ...layout,
        left: x
      };
      style = { ...style,
        left: x
      };
    }

    if (typeof y === 'number' && y !== layout.top) {
      layout = { ...layout,
        top: y
      };
      style = { ...style,
        top: y
      };
    }

    if (layout !== draggedComponent.layout) {
      this.setState({
        dragging: true,
        draggedComponent: { ...draggedComponent,
          style,
          layout
        }
      });
    }
  }

  handleDrop(dropTarget) {
    const {
      draggedComponent
    } = this.state;
    this.setState({
      draggedComponent: undefined,
      draggedIcon: undefined,
      dragging: false
    }); // TODO need somehow to animate dropped component to final resting place

    /* 
        perhaps rerender new layout, bt mke new component a placeholder
        measure new position
        animate dragged component to new location
        show new component & hide draggee
        -- becomes a lot more efficient if we render all to a flat plane
    */

    this.handleLayout('drop', {
      draggedComponent,
      dropTarget
    });
  }

}
Surface.displayName = 'Surface';
registerClass('Surface', Surface, true);

function DragSurface(props) {
  var {
    style,
    children: child,
    x,
    y
  } = props;
  var draggedComponent = null;
  var visibility = child ? 'visible' : 'hidden';

  if (child) {
    let {
      style: childStyle
      /*, ...rest */

    } = child.props;
    var layoutModel = child.props.layoutModel;
    let childProps = {
      key: layoutModel.$id,
      layoutModel
    };
    childStyle = { // ...rest ?
      ...childStyle,
      borderWidth: 3,
      borderStyle: 'solid',
      borderColor: '#ccc',
      boxSizing: 'content-box'
    };

    if (y !== undefined && x !== undefined) {
      childProps.layoutModel = { ...layoutModel,
        layout: { ...layoutModel.layout,
          top: y,
          left: x
        }
      };
    }

    draggedComponent = React.createElement(LayoutItem, _extends({}, childProps, {
      style: childStyle
    }), child);
  }

  var className = cx('DragSurface', 'rect-layout', 'rect-container', 'Surface', props.className);
  return React.createElement("div", {
    className: className,
    style: { ...style,
      visibility
    }
  }, draggedComponent);
}

class ComponentIcon extends Component$1 {
  render() {
    const {
      color,
      text,
      style
    } = this.props;
    const className = cx('ComponentIcon', this.props.className);
    console.log(`ComponentIcon color=${color}`);
    return React.createElement("div", {
      className: className,
      style: { ...style,
        backgroundColor: color
      }
    }, React.createElement("span", null, text), this.props.children);
  }

}
registerClass('ComponentIcon', ComponentIcon);

const getLayoutModel$1 = state => state.layoutModel;

// import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
// import componentState from './redux/componentReducer';
// import thunk from 'redux-thunk';

const NO_STYLE$2 = {};
class Application extends React.Component {
  constructor(props) {
    super(props);
    var {
      width: appWidth,
      height: appHeight,
      dialogs = [],
      style: {
        width = appWidth,
        height = appHeight,
        backgroundColor
      } = NO_STYLE$2
    } = props;
    this.resizeListener = this.resizeListener.bind(this); // const reduxDevTools = window.devToolsExtension ? window.devToolsExtension() : f => f;
    // const reducers = combineReducers({
    //     ...this.props.reducers,
    //     componentState,
    //     layoutModel
    // });
    // this.store = createStore(
    //     reducers,
    //     compose(applyMiddleware(thunk/*, logger*/), reduxDevTools)
    // );
    // this.store.subscribe(this.handleChange);

    this.state = {
      height,
      width,
      backgroundColor,
      content: this.props.layout,
      // REALLY ???
      draggedComponent: null,
      dialogs,
      hasError: false // layoutModel: this.getLayoutModel(width, height)

    }; // this.props.bootstrap(this.store.dispatch);
  }

  componentDidCatch(error, info) {
    console.log(`error`, error);
    this.setState({
      hasError: true
    });
  }

  render() {
    // dragging will suppress render in all children except the DragSurface
    const {
      width,
      height,
      backgroundColor,
      dragging,
      hasError
    } = this.state;
    const style = {
      position: 'absolute',
      top: 0,
      left: 0,
      width,
      height,
      backgroundColor
    };
    const className = cx('Application', this.props.className); //TODO make the default Container a Surface, which can host dialogs/popups as well
    // as root layout. Default style will be 100% x 100%
    //TODO maybe DragSurface should be part of Surface ?
    // TRY scrap the DragSurface. pass dragging to each child. If it is set and they do not
    // match do not render. So dialogs can be moved without dom removal. Layout items 
    // will be transplanted to Surface. Means every container and LayoutItem will have to
    // implement this in shouldComponentUpdate
    // if (nextProps.dragOperation && nextProps.dragOperation.draggedComponent !== this)
    // we want something like 
    // <Surface dragOperation={{draggedComponent,x,y}}

    if (hasError) {
      return React.createElement("div", {
        style: style,
        className: className
      }, "Error");
    }

    return React.createElement("div", {
      style: style,
      className: className
    }, React.createElement(Surface, {
      layoutModel: this.props.layoutModel,
      style: {
        width,
        height
      },
      dragging: dragging,
      onLayout: (command, options) => this.handleLayout(command, options),
      onLayoutModel: this.props.onLayoutModel
    }, this.getContent()));
  }

  getContent() {
    var {
      children
    } = this.props;
    var {
      dialogs
    } = this.state;

    if (React.isValidElement(children)) {
      if (dialogs.length === 0) {
        return children;
      } else {
        children = [children];
      }
    }

    return children.concat(dialogs);
  } // handleChange = () => {
  //     const layoutModel = getLayoutModel(this.store.getState());
  //     // console.log(`Application.handleChange 
  //     // 	state version ${this.state ? this.state.layoutModel.$version : 'null'}
  //     // 	store version ${layoutModel ? layoutModel.$version : 'null'}`);
  //     if (layoutModel !== null && layoutModel !== this.state.layoutModel){
  //         //onsole.log(`Application:store change triggers setState EXPECT RENDER`);
  //         this.setState({layoutModel});
  //     }
  // }


  getLayoutModel(width, height, id = uuid()) {
    console.log(`%cApplication.getLayoutModel width ${width} height ${height} id ${id}`, 'color:blue;font-weight:bold');
    return {
      type: 'Surface',
      // Should it be 'Application' ?
      $id: id,
      $path: '0',
      $version: 1,
      style: {
        position: 'absolute',
        width,
        height
      },
      layout: {
        top: 0,
        left: 0,
        width,
        height
      },
      children: []
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.resizeListener, false); // this.store.dispatch(initializeLayoutModel(this.state.layoutModel));
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeListener, false);
  }

  componentWillReceiveProps(nextProps) {
    const {
      dialogs
    } = nextProps;

    if (dialogs !== this.props.dialogs) {
      // could this mess with dialogs already in state ?
      this.setState({
        dialogs
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    var {
      width,
      height
    } = this.state;
    return nextState.width !== width || nextState.height !== height || nextState.draggedComponent !== undefined || nextState.dialogs !== this.state.dialogs || nextState.layoutModel !== this.state.layoutModel;
  }

  resizeListener() {// var {width, height} = document.body.getBoundingClientRect();
    // if (width !== this.state.width || height !== this.state.height){
    //     const {layoutModel} = this.state;
    //     this.store.dispatch(initializeLayoutModel(layout(layoutModel, {top:0,left:0,width,height}, layoutModel.$path, 'visible', true)));
    //     this.setState({	width, height });
    // }
  }

  handleLayout(command, options) {
    if (command === 'dialog') {
      // const dialog = componentFromLayout(layout(options.component));
      const {
        dialogs
      } = this.state;
      this.setState({
        dialogs: dialogs.concat(options.component)
      });
    } else {
      var layoutModel = getLayoutModel$1(this.store.getState());

      if (command === 'replace') {
        this.store.dispatch(replace(followPath(layoutModel, options.model.$path), options.model));
      } else if (command === 'switch-tab') {
        const {
          path,
          idx,
          nextIdx
        } = options;
        this.store.dispatch(switchTab(path, idx, nextIdx));
      } else {
        console.error(`Application.handleLayout dont't know what to do with ${command}`);
      }
    }
  } // TODO where does this belong


  getComponentState(componentId) {
    const {
      componentState
    } = this.store.getState();
    return componentState[componentId];
  }

}
Application.defaultProps = {
  reducers: {},
  bootstrap: () => {}
};

export { Application, Component, Container, DragSurface, DynamicContainer, FlexBox, LayoutItem, Surface, TabbedContainer, registerClass };
//# sourceMappingURL=index.js.map
