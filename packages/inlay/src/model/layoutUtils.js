import React from 'react';
import {initStretch, stretchLayout, stretchStyle, extendLayout} from './stretch';

let ready = false;

import('stretch-layout').then(async (stretch) => {
    initStretch(stretch);
    ready = true;
});

const NO_CHILDREN = [];
const NO_STYLE = {}
const CSS_DIGIT = '(\\d+)(?:px)?';
const CSS_MEASURE = `^(?:${CSS_DIGIT}(?:\\s${CSS_DIGIT}(?:\\s${CSS_DIGIT}(?:\\s${CSS_DIGIT})?)?)?)$`
const CSS_REX = new RegExp(CSS_MEASURE)
const BORDER_REX = /^(?:(\d+)(?:px)\ssolid\s([a-zA-Z,0-9().]+))$/;
const ROW = 'row';

const BORDER_STYLES = {
    border: true,
    borderWidth: true,
    borderTopWidth: true,
    borderRightWidth: true,
    borderBottomWidth: true,
    borderLeftWidth: true
}
const BORDER_LIST = Object.keys(BORDER_STYLES);

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

export function stripLayout(model){
    return {
        ...model,
        layout: undefined,
        children: model.children
            ? model.children.map(child => stripLayout(child))
            : undefined
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

    if (!ready){
        throw(`NOT READY TO LAYOUT YET`)
    }
    const layoutModel = extendLayout({
        ...model,
        style: {
            ...model.style,
            width,
            height    
        }
    }, path || model.$path);
    stretchLayout(layoutModel);
   
    // if (left !== 0){
    //     layoutModel.layout.left += left
    // }
    // if (top !== 0){
    //     layoutModel.layout.top += top
    // }

    printLayout(layoutModel);
    return layoutModel;
}

const NO_BORDERS = [0,null];
// todo cache values
export function getCSSBorderProperties(style){
    if (style && typeof style.border === 'string'){
        const match = BORDER_REX.exec(style.border);
        if (match !== null){
            const [,borderWidth,color] = match;
            return [parseInt(borderWidth,10),color];
        }
    }
    return NO_BORDERS;
}

// TODO merge the following two functions
export function normalizeLayoutStyles({margin, marginTop, marginRight, marginBottom, marginLeft,
    padding, paddingTop, paddingRight, paddingBottom, paddingLeft, ...style}=NO_STYLE){

    if (typeof margin === 'number'){
        style.marginTop = style.marginRight = style.marginBottom = style.marginLeft = margin;
    } else if (typeof margin === 'string'){
        const match = CSS_REX.exec(margin);
        if (match === null){
            console.error(`Invalid css value for margin '${margin}'`)
        } else {
            const [, pos1, pos2, pos3, pos4] = match;
            const pos123 = pos1 && pos2 && pos3
            if (pos123 && pos4){
                style.marginTop = parseInt(pos1,10);
                style.marginRight = parseInt(pos2,10);
                style.marginBottom = parseInt(pos3,10);
                style.marginLeft = parseInt(pos4,10);
            } else if (pos123){
                style.marginTop = parseInt(pos1,10);
                style.marginRight = style.marginLeft = parseInt(pos2,10);
                style.marginBottom = parseInt(pos3,10);
            } else if (pos1 && pos2){
                style.marginTop = style.marginBottom = parseInt(pos1,10);
                style.marginRight = style.marginLeft =parseInt(pos2,10);
            } else {
                style.marginTop = style.marginRight = style.marginBottom = style.marginLeft = parseInt(pos1,10);
            }
        }
    }
    if (typeof marginTop === 'number') style.marginTop = marginTop;
    if (typeof marginRight === 'number') style.marginRight = marginRight;
    if (typeof marginBottom === 'number') style.marginBottom = marginBottom;
    if (typeof marginLeft === 'number') style.marginLeft = marginLeft;

    if (typeof padding === 'number'){
        style.paddingTop = style.paddingRight = style.paddingBottom = style.paddingLeft = padding;
    } else if (typeof padding === 'string'){
        const match = CSS_REX.exec(padding);
        if (match === null){
            console.error(`Invalid css value for padding '${padding}'`)
        } else {
            const [, pos1, pos2, pos3, pos4] = match;
            const pos123 = pos1 && pos2 && pos3
            if (pos123 && pos4){
                style.paddingTop = parseInt(pos1,10);
                style.paddingRight = parseInt(pos2,10);
                style.paddingBottom = parseInt(pos3,10);
                style.paddingLeft = parseInt(pos4,10);
            } else if (pos123){
                style.paddingTop = parseInt(pos1,10);
                style.paddingRight = style.paddingLeft = parseInt(pos2,10);
                style.paddingBottom = parseInt(pos3,10);
            } else if (pos1 && pos2){
                style.paddingTop = style.paddingBottom = parseInt(pos1,10);
                style.paddingRight = style.paddingLeft =parseInt(pos2,10);
            } else {
                style.paddingTop = style.paddingRight = style.paddingBottom = style.paddinggLeft = parseInt(pos1,10);
            }
        }
    }
    if (typeof paddingTop === 'number') style.paddingTop = paddingTop;
    if (typeof paddingRight === 'number') style.paddingRight = paddingRight;
    if (typeof paddingBottom === 'number') style.paddingBottom = paddingBottom;
    if (typeof paddingLeft === 'number') style.paddingLeft = paddingLeft;

    return normalizeBorderStyle(style);
}

function normalizeBorderStyle(style=NO_STYLE){

    if (BORDER_LIST.some(bs => style[bs])){
        let match;

        let {border, borderWidth, borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth, borderColor, ...rest} = style;

        if (border || borderWidth || borderTopWidth || borderRightWidth || borderBottomWidth || borderLeftWidth){
            if (typeof border === 'string' && (match = BORDER_REX.exec(border))){
                // what if both border and borderWidth are specified ?
                ([,borderWidth,borderColor] = match);
                borderWidth = parseInt(borderWidth,10);                
            }

            if (borderWidth){
                borderTopWidth = borderTopWidth === undefined ? borderWidth : borderTopWidth;
                borderRightWidth = borderRightWidth === undefined ? borderWidth : borderRightWidth;
                borderBottomWidth = borderBottomWidth === undefined ? borderWidth : borderBottomWidth;
                borderLeftWidth = borderLeftWidth === undefined ? borderWidth : borderLeftWidth;
            }

            borderColor = borderColor || 'black';
            const boxShadow = `
                ${borderColor} ${borderLeftWidth || 0}px ${borderTopWidth || 0}px 0 0 inset, 
                ${borderColor} ${-borderRightWidth || 0}px ${-borderBottomWidth || 0}px 0 0 inset`;

            return {
                ...rest,
                boxShadow,
                borderColor,
                borderStyle: 'solid',
                borderTopWidth,
                borderRightWidth,
                borderBottomWidth,
                borderLeftWidth
            }

        } else {
            return style
        }
    } else {
        return style;
    }
}

function getFlexDirection(model){
    const style = (model && model.style) || NO_STYLE;
    return style.flexDirection || ROW;
}

export function elementsFromLayout(model){
    const {style: {backgroundColor}=NO_STYLE, layout: {top,left,width,height},children=NO_CHILDREN} = model;
    const style = {position: 'absolute', backgroundColor, top, left, width, height};
    return React.createElement('div', {key: model.$path,style,onClick: model.onClick}, children.map(elementsFromLayout));
}

export function setLayout(model){
    // we should call this outputStyle or layoutStyle?
    const yogaLayout = model.yogaNode.computeLayout();
    console.groupCollapsed('assignLayout')
    assignLayout(model, yogaLayout)
    console.groupEnd('assignLayout')
    const {left, top, width, height} = yogaLayout;
    // const {borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth} = model.style;

    // layout.paddingTop = borderTopWidth || undefined; 
    // layout.paddingRight = borderRightWidth || undefined; 
    // layout.paddingBottom =borderBottomWidth || undefined; 
    // layout.paddingLeft = borderLeftWidth || undefined; 
}

function assignLayout(model, yogaLayout){
    const {x, y, width, height} = yogaLayout;
    model.layout = {left:x, top:y, width, height};
    console.log(`model.layout ${model.type}#${model.$id || ''}  ${JSON.stringify(model.layout)}`)

    model.children && model.children.forEach((child, i) => {
        assignLayout(child, yogaLayout.child(i));
    });

    // call free ?
    model.yogaNode = null;

};

const CSS_MEASURE_SETTERS = {
    'margin': 'setMargin',
    'padding': 'setPadding',
    'border': 'setBorder'
}
const CSS_MEASURES = {
    border: {measureTop: 'borderTopWidth', measureRight: 'borderRightWidth', measureBottom: 'borderBottomWidth', measureLeft: 'borderLeftWidth'},
    margin: {measureTop: 'marginTop', measureRight: 'marginRight', measureBottom: 'marginBottom', measureLeft: 'marginLeft'},
    padding: {measureTop: 'paddingTop', measureRight: 'paddingRight', measureBottom: 'paddingBottom', measureLeft: 'paddingLeft'}
}

function increaseCSSMeasure(style, measure, value, edge){
    if (measure === 'padding'){
        if (edge === 'top'){
            if (style.paddingTop){
                style = {...style, paddingTop: style.paddingTop + value}
            } else if (typeof style.padding === 'number'){
                const {padding, ...rest} = style;
                style = {
                    ...rest,
                    paddingTop: padding + value,
                    paddingRight: padding,
                    paddingBottom: padding,
                    paddingLeft: padding
                }
            } else {
                style = {...style, paddingTop: value}
            }
        }
    }
    return style;
}
function setCSSMeasure(node, style, measure){

    const setMeasure = CSS_MEASURE_SETTERS[measure];
    const value = style[measure];

    if (typeof value === 'number'){
        // node[setMeasure](yoga.EDGE_ALL, value);
    } else if (typeof value === 'string'){
        const match = CSS_REX.exec(value)
        if (match === null){
            console.error(`Invalid css value for ${measure} '${value}'`)
        } else {
            const [, pos1, pos2, pos3, pos4] = match;
            const pos123 = pos1 && pos2 && pos3
            if (pos123 && pos4){
                // node[setMeasure](yoga.EDGE_TOP, parseInt(pos1,10));
                // node[setMeasure](yoga.EDGE_END, parseInt(pos2,10));
                // node[setMeasure](yoga.EDGE_BOTTOM, parseInt(pos3,10));
                // node[setMeasure](yoga.EDGE_START, parseInt(pos4,10));
            } else if (pos123){
                // node[setMeasure](yoga.EDGE_TOP, parseInt(pos1,10));
                // node[setMeasure](yoga.EDGE_START, parseInt(pos2,10));
                // node[setMeasure](yoga.EDGE_END, parseInt(pos2,10));
                // node[setMeasure](yoga.EDGE_BOTTOM, parseInt(pos3,10));
            } else if (pos1 && pos2){
                // node[setMeasure](yoga.EDGE_TOP, parseInt(pos1,10));
                // node[setMeasure](yoga.EDGE_BOTTOM, parseInt(pos1,10));
                // node[setMeasure](yoga.EDGE_START, parseInt(pos2,10));
                // node[setMeasure](yoga.EDGE_END, parseInt(pos2,10));
            } else {
                // node[setMeasure](yoga.EDGE_ALL, parseInt(pos1,10));
            }
        }
    } else {
        const {measureTop, measureRight, measureBottom, measureLeft} = CSS_MEASURES[measure];
        // if (style[measureTop]) node[setMeasure](yoga.EDGE_TOP, style[measureTop]);
        // if (style[measureRight]) node[setMeasure](yoga.EDGE_END, style[measureRight]);
        // if (style[measureBottom]) node[setMeasure](yoga.EDGE_BOTTOM, style[measureBottom]);
        // if (style[measureLeft]) node[setMeasure](yoga.EDGE_START, style[measureLeft]);

    }

}


export function printLayout(config){

    console.log(`%c${JSON.stringify(logFriendlyLayout(config),null,2)}`, 'color: blue;font-weight:bold;')
}

function logFriendlyLayout(config){
    const {type,$id,style,title, header,layoutStyle, visualStyle, children, yogaNode, ...rest} = config;
    return {
        type,
        $id,
        title,
        header,
        style,
        ...rest,
        layoutStyle,
        children: children ? children.map(logFriendlyLayout) : undefined
    };
}