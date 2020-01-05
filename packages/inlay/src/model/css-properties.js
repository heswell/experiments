const stretchStyle = {
  "alignItems": "alignItems",
  "borderTop": "borderTop",
  "borderBottom": "borderBottom",
  "borderLeft": "borderStart",
  "borderStart": "borderStart",
  "borderRight": "borderEnd",
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
  "minHeight": "minHeight",
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
  'maxHeight': true,
  'borderTop': true,
  'borderBottom': true,
  'borderStart': true,
  'borderEnd': true,
  width: true
};

export function normalize(name){
  return stretchStyle[name] || name;
}

export const isLayoutProperty = name => 
  stretchStyle[name] || compositeProperty[name];

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

export function parseBorder(value){
  let borderTop = 0;
  let borderEnd = 0;
  let borderBottom = 0;
  let borderStart = 0;
  let borderColor = 'black';

  const values = value.split(/\s+/);
  switch(values.length){
    case 3: {
      // NaN could be thin|medium|thick, decimal value
        const n = parseInt(values[0],10);
        borderTop = borderEnd = borderBottom = borderStart = n;
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

  const result = [
    'borderTop', borderTop,
    'borderEnd', borderEnd,
    'borderBottom', borderBottom,
    'borderStart', borderStart
  ]

  if (borderTop || borderStart || borderBottom || borderEnd){
    result.push(
      'boxShadow', 
      `${borderColor} ${borderStart||0}px ${borderTop||0}px 0 0 inset,
       ${borderColor} ${-borderEnd||0}px ${-borderBottom||0}px 0 0 inset`
      );
  }

  return result;

}

