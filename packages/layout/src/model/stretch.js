
import {
  Allocator,
  FlexDirection,
  AlignItems,
  JustifyContent,
  Node,
  PositionType,
  Display,
  waitUntilReady
} from '../stretch/stretch_layout';

import { extendLayoutModel} from './layout-json';

const BORDER_STYLES = {
    border: true,
    borderWidth: true,
    borderTopWidth: true,
    borderRightWidth: true,
    borderBottomWidth: true,
    borderLeftWidth: true
}

const LAYOUT_STYLES = {
    ...BORDER_STYLES,
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
}

const LAYOUT_LIST = Object.keys(LAYOUT_STYLES);

export function layoutStyleDiff(style1, style2){
    if (!style1 && !style2){
        return false;
    } else if (style1 && !style2){
        return LAYOUT_LIST.some(style => style1[style]);
    } else if (style2 && !style1){
        return LAYOUT_LIST.some(style => style2[style]);
    } else {
        return LAYOUT_LIST.some(style => style1[style] !== style2[style]);
    }
}

function defaultDimension(model, dimension){
    if (model && model.style){
        return model.style[dimension] || 'auto';
    } else {
        return 'auto';
    }
}

export function computeLayout(
    model, 
    width=defaultDimension(model,'width'), 
    height=defaultDimension(model,'height'), 
    top=0, 
    left=0, 
    path){

    const layoutModel = extendLayoutModel({
        ...model,
        style: {
            ...model.style,
            top,
            left,
            width,
            height    
        }
    }, path || model.$path);
    stretchLayout(layoutModel);

    return layoutModel;
}

export function recomputeChildLayout(model){
    stretchLayoutChildren(model);
    return model;
}

let allocator;

const ARRAY = [];

let ready = false;

export const isReady = () => ready;

export const getDisplay = () => Display;

//export const stretchLoading = import(/* webpackChunkName: "stretch" */ '../stretch/stretch_layout').then(initStretch);

export const stretchLoading = waitUntilReady.then(() => {
  allocator = new Allocator();
  ready = true;
})

export function stretchLayout(config) {
  // Note, when passed an absolute layoutStyle, top appears to be ignored
  const node = stretchNode(config);
  const layout = node.computeLayout();
  console.log({
    layout: {
      x: layout.x,
      y: layout.y,
      w: layout.width,
      h: layout.height
    }
  })
  node.free();
  setComputedStyle(config, layout);
  setChildStyles(config, layout);
}

export function stretchLayoutChildren(config) {
  const { computedStyle, layoutStyle } = config;
  const wrapper = {
    layoutStyle: {
      ...layoutStyle,
      ...computedStyle
    },
    children: config.children
  };

  const node = stretchNode(wrapper);
  const layout = node.computeLayout();
  node.free();
  setChildStyles(config, layout);
}


function setComputedStyle(config, { x: left, y: top, width, height }) {
  config.computedStyle = {
    ...config.visualStyle,
    position: 'absolute',
    left,
    top,
    width,
    height
  };
}

function setChildStyles(config, layout) {
  for (let i = 0, count = layout.childCount; i < count; i++) {
    const childConfig = config.children[i]
    console.log(config.children[i].type, {
      childLayout: {
        x: layout.child(i).x,
        y: layout.child(i).y,
        w: layout.child(i).width,
        h: layout.child(i).height
      }
    });
    setComputedStyle(childConfig, layout.child(i));
    setChildStyles(childConfig, layout.child(i));
  }
}


function stretchNode({ layoutStyle, children = ARRAY }) {
  const node = new Node(allocator, layoutStyle);
  children.forEach(child => node.addChild(stretchNode(child)));
  return node;
}


export const flexDirection = value => value === 'column'
  ? FlexDirection.Column
  : FlexDirection.Row;

export const alignItems = value =>
  value === 'stretch' ? AlignItems.Stretch :
    value === 'flex-start' ? AlignItems.FlexStart :
      value === 'flex-end' ? AlignItems.FlexEnd :
        value === 'baseline' ? AlignItems.Baseline :
          AlignItems.Center;


export const justifyContent = value =>
  value === 'center' ? JustifyContent.Center :
    value === 'flex-start' ? JustifyContent.FlexStart :
      value === 'flex-end' ? JustifyContent.FlexEnd :
        value === 'space-between' ? JustifyContent.SpaceBetween :
          value === 'space-around' ? JustifyContent.SpaceAround :
            value === 'space-evenly' ? JustifyContent.SpaceEvenly :
              -1;

export const positionType = value =>
  value === 'absolute' ? PositionType.Absolute : PositionType.None;

