import React from 'react';
import {uuid} from '@heswell/utils';
import { typeOf, isLayout, getDefaultProps } from '../component-registry';

const DEFAULT_HEADER_HEIGHT = 26;
const DEFAULT_HEADER_SPEC = {
  menu: true,
  style: {height: DEFAULT_HEADER_HEIGHT}
}

//TODO components should be able to register props here
const LayoutProps = {
    resizeable: true,
    header: DEFAULT_HEADER_SPEC,
    active: true,
    dragStyle: true // still used ? flexbox-shuffle ?
}

export const getLayoutModel = component => {
  const type = typeOf(component); 
  const {props: {children, contentModel, style, ...props}} = component;
  const defaultProps = getDefaultProps(component);
  const ownProps = Object.keys(props).filter(prop => LayoutProps[prop] === undefined && defaultProps[prop] === undefined);

  return {
      type,
      $id: props.id || uuid(),
      ...layoutProps(type, component),
      style,
      props: ownProps.length === 0 ? undefined : ownProps.reduce((o, n) => {o[n] = props[n]; return o}, {}),
      children: isLayout(component) ? getLayoutModelChildren(children, contentModel) : []
  }
}

function getLayoutModelChildren(children, contentModel=null){
    // TODO don't recurse into children of non-layout
    if (React.isValidElement(children)){
        return [getLayoutModel(children)];
    } else if (Array.isArray(children)){
        return children.filter(child => child).map(child => getLayoutModel(child));
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

function layoutProps(type, {props}){
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

function addDefaultLayoutProps(type, layoutProps){
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
  