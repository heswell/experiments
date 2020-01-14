import React from 'react';
import {uuid} from '@heswell/utils';
import { typeOf, isLayout, isContainer, getDefaultProps } from '../component-registry';

const DEFAULT_HEADER_HEIGHT = 26;
const DEFAULT_HEADER_SPEC = {
  menu: true,
  style: {height: DEFAULT_HEADER_HEIGHT}
}

export const getManagedDimension = style => style.flexDirection === 'column' ? 'height' : 'width';

//TODO components should be able to register props here
const LayoutProps = {
    resizeable: true,
    header: DEFAULT_HEADER_SPEC,
    active: true,
    dragStyle: true // still used ? flexbox-shuffle ?
}

export const getLayoutModel = (type, {children, contentModel, style, ...props}) => {
    const ownProps = Object.keys(props).filter(prop => LayoutProps[prop] === undefined);
  
    return {
        type,
        $id: props.id || uuid(),
        ...layoutProps(type, props),
        style,
        props: ownProps.length === 0 ? undefined : ownProps.reduce((o, n) => {o[n] = props[n]; return o}, {}),
        children: isContainer(type) ? getLayoutModelChildren(children, contentModel) : []
    }
  }
  
const getLayoutModelDeprecated = component => {
  const type = typeOf(component); 
  const {props: {children, contentModel, style, ...props}} = component;
  const defaultProps = getDefaultProps(component);
  const ownProps = Object.keys(props).filter(prop => LayoutProps[prop] === undefined && defaultProps[prop] === undefined);

  return {
      type,
      $id: props.id || uuid(),
      ...layoutProps(type, component.props),
      style,
      props: ownProps.length === 0 ? undefined : ownProps.reduce((o, n) => {o[n] = props[n]; return o}, {}),
      children: isLayout(component) ? getLayoutModelChildren(children, contentModel) : []
  }
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
        return [getLayoutModelDeprecated(children)];
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

function layoutProps(type, props){
    const results = {};
    let layoutProp;
    Object.entries(props).forEach(([key, value]) => {
        if (layoutProp = LayoutProps[key]){
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
  