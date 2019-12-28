import {
  normalize as normalizeCSSPropertyName,
  isLayoutProperty,
  singleDimensionProperty,
  dimension,
  flexProperties,
  parseBorder,
  parseCompositeDimension
} from './css-properties';
import { isContainer } from '../component-registry';

let FlexDirection;
let AlignItems;
let JustifyContent;
let PositionType;
let Display;

let stretch;
let allocator;

const ARRAY = [];
const NO_OVERRIDES = {};
const SURFACE_CHILD_STYLE = ({style}) => (style.width && style.height ? {position: 'absolute'}: undefined);
const NOOP = () => undefined;

const stretchLoading = new Promise(resolve => import('stretch-layout').then(s => resolve(s)));

export function extendLayout(config, path='0', styleOverrides=NO_OVERRIDES){

  // alow tabstrip to be specified, like header
  const {style, header, ...rest} = config;
  const [layoutStyle, visualStyle] = collectStyles(style, styleOverrides);

  const result = {
    ...rest,
    $path: path === null ? undefined : path,
    header: extendHeader(header, layoutStyle),
    layoutStyle,
    visualStyle,
    children: expandChildren(config, path)
  };

  return result;
}

// format a header config, increase top padding on layoutStyle
function extendHeader(header, layoutStyle){
  if (header){
    increaseCSSMeasure(layoutStyle, 'paddingTop', header.style.height);  
    const {borderTop, borderStart, borderEnd} = layoutStyle;
    if (borderTop) header.style.marginTop = borderTop;
    if (borderStart) header.style.marginLeft = borderStart;
    if (borderEnd) header.style.marginRight = borderEnd;
  }

  return header;
}

function expandChildren({type, active, style, children=ARRAY}, path){
    if (type === 'layout' || type === 'Splitter'){
      return undefined;
    } else if (children.length === 0){
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
        type === 'TabbedContainer' ? (_,i) => ({ flex: 1, display:  i === active ? Display.Flex : Display.None}) : 
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

export default async function layout(){
  initStretch(await stretchLoading)
  return stretchLayout;
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
}

export function stretchLayout(config){
  const node = stretchNode(config);
  const layout = node.computeLayout();
  setStyles(config, layout);
}

function setStyles(config, layout){

  setStyle(config, layout);

  for (let i=0, count=layout.childCount;i<count;i++){
    const childConfig = config.children[i]
    setStyles(childConfig, layout.child(i));
  }

}

function setStyle(config, {x:left,y:top,width,height}){
  config.style = {
    ...config.visualStyle,
    position: 'absolute',
    left,
    top,
    width,
    height
  };
}

function stretchNode({layoutStyle, children=ARRAY}){
  const node = new stretch.Node(allocator, layoutStyle);
  children.forEach(child => node.addChild(stretchNode(child)));
  return node;
}

function collectStyles(style, overrides){

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

  return [layoutStyle, visualStyle];
}

function mapCSSProperties(entry){
  const [name, value] = entry;
  const propertyName = normalizeCSSPropertyName(name);
  
  if (name !== propertyName){
    entry[0] = propertyName;
  }

  if (singleDimensionProperty[propertyName]){
    
    entry[1] = dimension(value);

  } else switch (propertyName) {

    case 'flexDirection': 
      entry[1] = flexDirection(value);
      break;

    case 'alignItems': 
      entry[1] = alignItems(value);
      break;

    case 'justifyContent': 
      entry[1] = justifyContent(value);
      break;

    case 'positionType': 
      entry[1] = positionType(value);
      break;

    case 'flexShrink':
    case 'flexGrow':
      break;

    case 'flex':
      entry.splice(0,2,...flexProperties(value));
      break;

    case 'padding':
    case 'margin': {
        const values = parseCompositeDimension(value)
        entry[0] = `${propertyName}Top`;
        entry[1] = values[0];
        entry[2] = `${propertyName}End`;
        entry[3] = values[1];
        entry[4] = `${propertyName}Bottom`;
        entry[5] = values[2];
        entry[6] = `${propertyName}Start`;
        entry[7] = values[3];
      }
      break;
    
    case 'border': 
      entry.splice(0,2,...parseBorder(value))
      break;

    default:
      // return as-is. We only get passed layout properties, so all ara valid
  }

  return entry;
}

const flexDirection = value => value === 'column'
  ? FlexDirection.Column
  : FlexDirection.Row;

const alignItems = value =>
  value === 'stretch' ? AlignItems.Stretch :
  value === 'flex-start' ? AlignItems.FlexStart :
  value === 'flex-end' ? AlignItems.FlexEnd :
  value === 'baseline' ? AlignItems.Baseline :
  AlignItems.Center;

const justifyContent = value =>
  value === 'center' ? JustifyContent.Center :
  value === 'flex-start' ? JustifyContent.FlexStart :
  value === 'flex-end' ? JustifyContent.FlexEnd :
  value === 'space-between' ? JustifyContent.SpaceBetween :
  value === 'space-around' ? JustifyContent.SpaceAround :
  value === 'space-evenly' ? JustifyContent.SpaceEvenly :
  -1;

const positionType = value =>
  value === 'absolute' ? PositionType.Absolute : PositionType.None;

