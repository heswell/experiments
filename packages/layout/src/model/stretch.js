import { isContainer } from '../component-registry';

let FlexDirection;
let AlignItems;
let JustifyContent;
let PositionType;
let Display;

let stretch;
let allocator;
let ready = false;

export const isReady = () => ready;

const ARRAY = [];

export const getDisplay = () => Display;

export const stretchLoading = import(/* webpackChunkName: "stretch" */ '@heswell/stretch').then(initStretch);

export function initStretch(stretchModule){
  stretch = stretchModule;
  allocator = new stretch.Allocator();
  ({
    Display,
    FlexDirection,
    AlignItems,
    JustifyContent,
    PositionType
  } = stretch);
  console.log(`STRETCH LOADED`)
  return ready = true;
}

export function stretchLayout(config){
  // Note, when passed an absolute layoutStyle, top appears to be ignored
  const node = stretchNode(config);
  const layout = node.computeLayout();
  node.free();
  setComputedStyle(config, layout);
  setChildStyles(config, layout);
}

export function stretchLayoutChildren(config){
  const {computedStyle, layoutStyle} = config;
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


function setComputedStyle(config, {x:left,y:top,width,height}){
  config.computedStyle = {
    ...config.visualStyle,
    position: 'absolute',
    left,
    top,
    width,
    height
  };
}

function setChildStyles(config, layout){
  for (let i=0, count=layout.childCount;i<count;i++){
    const childConfig = config.children[i]
    setComputedStyle(childConfig, layout.child(i));
    setChildStyles(childConfig, layout.child(i));
  }
}


function stretchNode({layoutStyle, children=ARRAY}){
  const node = new stretch.Node(allocator, layoutStyle);
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

