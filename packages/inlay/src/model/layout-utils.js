import React from 'react';
import { stretchLayout, stretchLayoutChildren, extendLayout, isReady} from './stretch';

export const BORDER_STYLES = {
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

export const stretchLoaded = isReady;


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

    const layoutModel = extendLayout({
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
   
    // printLayout(layoutModel);
    return layoutModel;
}

export function recomputeChildLayout(model){
    // onsole.log(`%crecomputeChildLayout for ${model.$path}`, 'color: brown; font-weight: bold')
    stretchLayoutChildren(model);
    return model;
}

export function printLayout(config){
    console.log(`%c${JSON.stringify(logFriendlyLayout(config),null,2)}`, 'color: blue;font-weight:bold;')
}

function logFriendlyLayout(config){
    const {type,$id,style,title, header,computedStyle,layoutStyle, visualStyle, children, yogaNode, ...rest} = config;
    return {
        type,
        $id,
        title,
        header,
        style,
        ...rest,
        layoutStyle,
        computedStyle,
        children: children ? children.map(logFriendlyLayout) : undefined
    };
}