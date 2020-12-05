import {alignItems, getDisplay, flexDirection, justifyContent, positionType} from './stretch';

const ARRAY = [];

const stretchStyle = {
  "alignItems": "alignItems",
  "borderTop": "borderTop",
  "borderTopWidth": "borderTop",
  "borderBottom": "borderBottom",
  "borderBottomWidth": "borderBottom",
  "borderLeft": "borderStart",
  "borderLeftWidth": "borderStart",
  "borderStart": "borderStart",
  "borderRight": "borderEnd",
  "borderRightWidth": "borderEnd",
  "borderEnd": "borderEnd",
  "display": "display",
  "flexDirection": "flexDirection",
  "flexBasis": "flexBasis",
  "flexShrink": "flexShrink",
  "flexGrow": "flexGrow",
  "height": "height",
  "justifyContent": "justifyContent",
  "left": "start",
  "marginTop": "marginTop",
  "marginBottom": "marginBottom",
  "marginLeft": "marginStart",
  "marginStart": "marginStart",
  "marginRight": "marginEnd",
  "marginEnd": "marginEnd",
  "maxHeight": "maxHeight",
  "maxWidth": "maxWidth",
  "minHeight": "minHeight",
  "minWidth": "minWidth",
  "paddingTop": "paddingTop",
  "paddingBottom": "paddingBottom",
  "paddingLeft": "paddingStart",
  "paddingStart": "paddingStart",
  "paddingRight": "paddingEnd",
  "paddingEnd": "paddingEnd",
  "position": "positionType",
  "positionType": "positionType",
  "start": "start",
  "top": "top",
  "width": "width",
}

const compositeProperty = {
  "padding": true,
  "margin": true,
  "border": true,
  "flex": true
};

export const singleDimensionProperty = {
  'flexBasis': true,
  'end': true,
  'height': true,
  'paddingTop': true,
  'paddingBottom': true,
  'paddingStart': true,
  'paddingEnd': true,
  'marginTop': true,
  'marginBottom': true,
  'marginStart': true,
  'marginEnd': true,
  'minHeight': true,
  'minWidth': true,
  'maxHeight': true,
  'maxWidth': true,
  'start': true,
  'width': true
};

export function normalize(name){
  return stretchStyle[name] || name;
}

export const isLayoutProperty = name => 
  stretchStyle[name] || compositeProperty[name];

export const removeVisualStyles = style =>
  Object.entries(style).reduce((style, [property, value]) => {
    if (isLayoutProperty(property)){
      style[property] = value;
    }
    return style;
  },{});

export const dimension = value => {
    if (typeof value === 'number')
      return value;
    else if (value === 'auto')
      return value;
    else if (value.endsWith('%'))
      return value;
    else {
      const n = parseInt(value, 10);
      if (isNaN(n)){
        throw Error('Invalid value for dimension property ${name} : ${value}')
      } else {
        return n;
      }
    }  
  }

export function flexProperties(value){
  if (typeof value === 'number'){
    return [
      "flexBasis", 0,
      "flexGrow", value, 
      "flexShrink", 1
  ]
  } else {
    const parts = value.split(/\s+/);
    if (parts.length === 3){
      return [
        "flexBasis", dimension(parts[2]),
        "flexGrow", parseInt(parts[0],10), 
        "flexShrink", parseInt(parts[1],10)
      ]
    }
  }
}

export function parseCompositeDimension(value){

  // inherit, initial, unset ?
  if (typeof value === 'number'){
    return [value,value,value,value];
  } else {
    // TODO % values, 'em' values ?
    const {length, '0': n1, '1': n2, '2': n3, '3': n4} = value.split(/\s+/).map(s => parseInt(s,10));
    switch(length){
      case 1: return [n1,n1,n1,n1];
      case 2: return [n1, n2, n1, n2];  
      case 3: return [n1, n2, n3, n2]; 
      default: return [n1, n2, n3, n4];  
    }
  }
}

export function mapCSSProperties(entry){
  const [name, value] = entry;
  const propertyName = normalize(name);
  const {None, Flex} = getDisplay();

  if (value === undefined){
    return ARRAY;
  }

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
    case 'borderTop': 
    case 'borderStart': 
    case 'borderEnd': 
    case 'borderBottom': 
      entry.splice(0,2,...parseBorder(propertyName, value))
      break;

    case 'display': 
      entry[1] = value === 'none' ? None : Flex;
      break;

      default:
      // return as-is. We only get passed layout properties, so all ara valid
  }

  return entry;
}

export function parseBorder(propertyName, value){
  let borderColor = 'black';
  let borderWidth = 0;

  if (typeof value === 'number'){
    borderWidth = value;
  } else {

    const values = value.split(/\s+/);
    switch(values.length){
      case 3: {
        // NaN could be thin|medium|thick, decimal value
          borderWidth = parseInt(values[0],10);
          borderColor = values[2];
      }
      break;
      case 2:{
        throw Error(`border: '${value}' only border format supported now is 'width style color'`);
      }
      break;
      case 1:{
        throw Error(`border: '${value}' only border format supported now is 'width style color'`);
      }
      break;
      default: 
        throw Error(`border: '${value}' only border format supported now is 'width style color'`);
    }
  }

  const result = [];

  switch (propertyName){
    case 'borderTop':
    case 'borderBottom': 
    case 'borderEnd': 
    case 'borderStart': 
      result.push(propertyName, borderWidth);
      break;
    default:
      result.push(
        'borderTop', borderWidth,
        'borderEnd', borderWidth,
        'borderBottom', borderWidth,
        'borderStart', borderWidth,
      );
  }

  return result;

}

export function deriveVisualBorderStyle({
  borderTop:t=0,
  borderEnd:r=0,
  borderBottom:b=0,
  borderStart:l=0}){
    
    const borderColor = 'black';
    if (t || r || b || l){
      return ['boxShadow', 
      `${borderColor} ${l||0}px ${t||0}px 0 0 inset,
       ${borderColor} ${-r||0}px ${-b||0}px 0 0 inset`
      ];

    } else {
      return [];
    }
} 


export function increaseCSSMeasure(style, measure, value){
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
