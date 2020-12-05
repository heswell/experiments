import React from 'react';
import {uuid} from '@heswell/utils';
import { typeOf, isContainer } from '../component-registry';
import {
    increaseCSSMeasure,
    isLayoutProperty,
    mapCSSProperties,
    deriveVisualBorderStyle
  } from './css-properties';

const SURFACE_CHILD_STYLE = ({style}) => (style.width && style.height ? {position: 'absolute'}: undefined);
const NOOP = () => undefined;
const EMPTY_OBJECT = {};
const EMPTY_ARRAY = [];

const DEFAULT_HEADER_HEIGHT = 26;

const defaultHeaderSpec = (prop) => ({
  menu: true,
  style: {height: prop?.height ?? DEFAULT_HEADER_HEIGHT}
})

export const getManagedDimension = style => style.flexDirection === 'column' ? ['height', 'width'] : ['width', 'height'];

//TODO components should be able to register props here

const LayoutProps = {
  active: true,
  dragStyle: true, // still used ? flexbox-shuffle ?
  header: defaultHeaderSpec,
  resizeable: true,
  splitterSize: true
}

  /** 
   * Extract layoutModel from tree of react elememts
   * 
   * @type {getLayoutModel} */
  export const getLayoutModel = (type, {children, contentModel, style, ...props}) => {
    const ownProps = Object.keys(props).filter(prop => LayoutProps[prop] === undefined);
    const $id = props.id || uuid();
    const layoutProps = getLayoutProps(type, props)
    return {
      $id,
      ...layoutProps,
      type,
      style,
      props: ownProps.length === 0 ? {title: type} : ownProps.reduce((o, n) => {o[n] = props[n]; return o}, {}),
      children: isContainer(type) ? getLayoutModelChildren(children, contentModel) : []
    };
  }
  
export function resetPath(layoutModel, path){
    if (layoutModel.$path === path){
        return layoutModel;
    }
    return {
        ...layoutModel,
        $path: path,
        children: layoutModel.children &&
            layoutModel.children.map((child, i) => {
                if (!child.$path){
                    return child;
                } else {
                    return resetPath(child, `${path}.${i}`);
                }
        })
    };
} 

function getLayoutModelChildren(children, contentModel=null){
    // TODO don't recurse into children of non-layout
    if (React.isValidElement(children)){
        // what if we have a contentModel ?
        return [getLayoutModel(typeOf(children), children.props)];
        // return [getLayoutModelDeprecated(children)];
    } else if (Array.isArray(children)){
        return children.filter(child => child).map(child => getLayoutModel(typeOf(child), child.props));
    } else if (contentModel !== null){
        return [addDefaultProperties(contentModel)];
    } else {
        return []; // is this safe ?
    }
}
  
function addDefaultProperties (model){
  const {type, children=[]} = model
  addDefaultLayoutProps(type, model);
  children.forEach(child => addDefaultLayoutProps(child.type, child));
  return model;
}

/** @type {getLayoutProps} */
function getLayoutProps(type, props){
    /** @type {LayoutProps}  */
    const results = {};
    let layoutProp;
    Object.entries(props).forEach(([key, value]) => {
        if (layoutProp = LayoutProps[key]){
            if (typeof layoutProp === 'function'){
                layoutProp = layoutProp(value);
            }
            if (layoutProp === true){
                results[key] = value;
            } else if (value === true){
                results[key] = {...layoutProp};
            } else {
                results[key] = {
                    ...layoutProp,
                    ...value
                };
            }
        }
    });
    return addDefaultLayoutProps(type, results);
}

// TODO how do we set these ate runtime
export function addDefaultLayoutProps(type, layoutProps){
    if (type === 'TabbedContainer'){
        if (!layoutProps.header){
            layoutProps.header = {
                type: 'Tabstrip',
                style: {height: 26}
            };
        }
        if (layoutProps.active === undefined){
            layoutProps.active = 0;
        }
    }
    return layoutProps;
  }
  
export function extendLayoutModel(config, path='0', styleOverrides=EMPTY_OBJECT){

    // console.log(`[extend] ${config.$id ? config.$id.slice(24) : null} ${config.type} ${path}`)
  
    // allow tabstrip to be specified, like header
    const [layoutStyle, visualStyle] = collectStyles(config.style, styleOverrides);
  
    const result = {
      ...config,
      $path: path === null ? undefined : path,
      header: extendHeader(config.header, layoutStyle),
      layoutStyle,
      visualStyle,
      children: extendLayoutModelChildren(config, path)
    };
  
    return result;
}
  
  // format a header config, increase top padding on layoutStyle
function extendHeader(header, layoutStyle){
    if (header){
      increaseCSSMeasure(layoutStyle, 'paddingTop', header.style.height);  
      return adjustHeaderPosition(header, layoutStyle);
    }
}

function extendLayoutModelChildren({type, active, style, children=EMPTY_ARRAY, splitterSize=6}, path){
    if (type === 'layout' || type === 'Splitter'){
      return undefined;
    } else {
      const {length: count, '0': child} = children;

      if (count === 0){
        if (isContainer(type)){
          return children;
        } else {
          return [extendLayoutModel({type: 'layout', style: {flex: 1}}, null)];
        }
      } else if (child.type === 'layout'){
          return children;
      } else {
        const splitters = getSplitterPositions(type, children);
        const styleOverrides = getStyleOverrides(type, active);
  
        return children.reduce((list, child, i) => {
            const isColumn = style.flexDirection === 'column';
            const size = isColumn ? "height" : "width";
            if (splitters[i]) {
                list.push({
                    type: 'Splitter',
                    style: {
                      [size]: splitterSize,
                      cursor: isColumn ? 'ns-resize' : 'ew-resize'
                    }
                });
            }
            list.push(child);
            return list;
        },[]).map(
          (child,i) => extendLayoutModel(child, `${path}.${i}`, styleOverrides(child,i))
        );
      }
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
  
function getSplitterPositions(type, children) {
   
    if (type === 'FlexBox'){
        const ret = [];

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
    
    } else{
        return EMPTY_ARRAY;
    }
}

function getStyleOverrides(type, active){
    switch (type) {
        case 'Surface': return SURFACE_CHILD_STYLE;
        case 'TabbedContainer': return (_,i) => ({ flex: 1, display:  i === active ? 'block' : 'none'});
        default: return NOOP;
    }
}
  
function isSplitter(model){
    return model.type === 'Splitter';
}
  
function isFlexible(model){
    return model.resizeable;
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
  