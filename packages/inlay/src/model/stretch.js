import {
  isLayoutProperty,
  mapCSSProperties,
  deriveVisualBorderStyle
} from './css-properties';
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
const EMPTY_OBJECT = {};
const SURFACE_CHILD_STYLE = ({style}) => (style.width && style.height ? {position: 'absolute'}: undefined);
const NOOP = () => undefined;

export const getDisplay = () => Display;

export const stretchLoading = import(/* webpackChunkName: "stretch" */ 'stretch-layout').then(initStretch);

export function extendLayout(config, path='0', styleOverrides=EMPTY_OBJECT){

  // allow tabstrip to be specified, like header
  const [layoutStyle, visualStyle] = collectStyles(config.style, styleOverrides);

  const result = {
    ...config,
    $path: path === null ? undefined : path,
    header: extendHeader(config.header, layoutStyle),
    layoutStyle,
    visualStyle,
    children: expandChildren(config, path)
  };

  return result;
}

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


// format a header config, increase top padding on layoutStyle
function extendHeader(header, layoutStyle){
  if (header){
    increaseCSSMeasure(layoutStyle, 'paddingTop', header.style.height);  
    return adjustHeaderPosition(header, layoutStyle);
  }
}

export function adjustHeaderPosition(header, layoutStyle){
  if (header){
    const {borderTop, borderStart, borderEnd} = layoutStyle;
    if (borderTop || borderStart || borderEnd){
      const result = {
        ...header,
        style: {
          ...header.style
        }
      }
      if (borderTop) result.style.marginTop = borderTop;
      if (borderStart) result.style.marginLeft = borderStart;
      if (borderEnd) result.style.marginRight = borderEnd;
      return result;
      
    } else {
      return header;
    }  
  }

}

function expandChildren({type, active, style, children=ARRAY}, path){
    if (type === 'layout' || type === 'Splitter'){
      return undefined;
    } else {
      const {length: count, '0': child} = children;

      if (count === 0 || child.type === 'layout'){
        // do we need to exclude splitters, or do we assume these are always added automatically ?
        if (isContainer(type)){
          return [];
        } else {
          return [extendLayout({type: 'layout', style: {flex: 1}}, null)];
        }
      } else {
        const splitters = type === 'FlexBox'
          ? getSplitterPositions(children)
          : ARRAY;
  
        const styleOverrides =
          type === 'Surface' ? SURFACE_CHILD_STYLE :
          type === 'TabbedContainer' ? (_,i) => ({ flex: 1, display:  i === active ? 'block' : 'none'}) : 
          NOOP;
  
        return children.reduce((list, child, i) => {
            if (splitters[i]) {
                list.push({
                    type: 'Splitter',
                    style: {
                      flex: '0 0 6px',
                      cursor: style.flexDirection === 'column' ? 'ns-resize' : 'ew-resize'
                    }
                });
            }
            list.push(child);
            return list;
        },[]).map(
          (child,i) => extendLayout(child, `${path}.${i}`, styleOverrides(child,i))
        )
  
      }
    }
}


function increaseCSSMeasure(style, measure, value){
  if (measure === 'paddingTop'){
    if (style.paddingTop){
      // what about '%' values ?
      style.paddingTop += value;
    } else {
      style.paddingTop = value;
    }
  }
  return style;
}

function getSplitterPositions(children) {

  var ret = [];

  for (var i = 1; i < children.length; i++) {

      var thisFlexible = isFlexible(children[i]);
      var lastFlexible = isFlexible(children[i - 1]);

      if (isSplitter(children[i]) || isSplitter(children[i - 1])) {
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

function isSplitter(model){
  return model.type === 'Splitter';
}

function isFlexible(model){
  return model.resizeable;
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

// TODO move this into css-properties
export function collectStyles(style=EMPTY_OBJECT, overrides){
  let [layoutStyle, visualStyle] = overrides ? collectStyles(overrides) : [{}, {}]

  Object.entries(style).forEach(entry => {
    const [name, property] = entry;
    if (!isLayoutProperty(name)){
      if (visualStyle[name] === undefined){
        visualStyle[name] = property;
      }      
    } else {
      for (let i = 0, properties = mapCSSProperties(entry); i<properties.length; i+=2){
        if (isLayoutProperty(properties[i])){
          if (layoutStyle[properties[i]] === undefined){
            layoutStyle[properties[i]] = properties[i+1];
          }
        } else if (visualStyle[properties[i]] === undefined){
          visualStyle[properties[i]] = properties[i+1];
        }
      }
    }
  })

  for (let i=0, properties = deriveVisualBorderStyle(layoutStyle); i<properties.length; i+=2){
    visualStyle[properties[i]] = properties[i+1];
  }

  return [layoutStyle, visualStyle];
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

