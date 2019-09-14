import React from 'react';
import yoga, { Node } from 'yoga-layout';
import {TABBED_CONTAINER, SURFACE} from './layoutTypes'
import { isContainer } from '../componentRegistry';

const NO_CHILDREN = [];
const NO_STYLE = {}
const CSS_DIGIT = '(\\d+)(?:px)?';
const CSS_MEASURE = `^(?:${CSS_DIGIT}(?:\\s${CSS_DIGIT}(?:\\s${CSS_DIGIT}(?:\\s${CSS_DIGIT})?)?)?)$`
const CSS_REX = new RegExp(CSS_MEASURE)
const BORDER_REX = /^(?:(\d+)(?:px)\ssolid\s([a-zA-Z,0-9().]+))$/;
const ROW = 'row';
const COLUMN = 'column';
const FLEX_DIRECTION = {
    [ROW]: yoga.FLEX_DIRECTION_ROW,
    [COLUMN]: yoga.FLEX_DIRECTION_COLUMN
}
const LAYOUT = 'layout';
const FLEXBOX = 'FlexBox';
const SPLITTER = 'Splitter';

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
export function computeLayout(model, width, height, top=0, left=0, path){
    const tree = createTree(model, path || model.$path);
    const layoutModel = createYogaTree(tree);
    layoutModel.node.calculateLayout(width, height, yoga.DIRECTION_LTR);
    setLayout(layoutModel)
    layoutModel.node.freeRecursive();

    if (left !== 0){
        layoutModel.layout.left += left
    }
    if (top !== 0){
        layoutModel.layout.top += top
    }
    return layoutModel;
}

function createTree(model, path='0'){
    return {
        ...model,
        $path: path,
        // TODO normalize style
        style: normalizeLayoutStyles(model.style),
        // style: expandStyle(model.style),
        children: expandChildren(model, path)
    }
}

function expandChildren({type, children}, path){
    if (children){
        var splitters = type === FLEXBOX
            ? getSplitterPositions(children)
            : NO_CHILDREN;

        return children.reduce((list, child, i) => {
            if (splitters[i]) {
                list.push({
                    type: 'Splitter',
                    $path: `${path}.${list.length}`,
                    style: {flex: '0 0 6px', backgroundColor: 'black'}
                });
            }
            list.push(createTree(child, `${path}.${list.length}`));
            return list;
        },[])
    }
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

const DEFAULT_HEADER = {height: 32, style: {backgroundColor: 'brown'}}
// we may mutate the tree in here
function createYogaTree(model, parent, idx){

    let {style=NO_STYLE, children=NO_CHILDREN} = model;
    const {type, layout=null} = model;
    const {flexDirection=null, left=null, top=null, width=null, height=null, flex=null} = style;
    const parentIsTabbedContainer = parent && parent.type === TABBED_CONTAINER;
    const parentIsSurface = parent && parent.type === SURFACE;
    const header = model.header === true
        ? DEFAULT_HEADER
        : typeof model.header === 'object'
            ? {...DEFAULT_HEADER, ...model.header}
            : null

    if (type !== LAYOUT && type !== SPLITTER && children.length === 0 && !isContainer(type)){
        style = {
            ...style,
            display: 'flex',
            flexDirection: 'column'
        }
        // children has to be created inline as it will be mutated by yoga
        model.children = children = [{type: LAYOUT, style: {flex: 1}}]
    } else if (children.length === 1 && children[0].type === LAYOUT){
        style = {
            ...style,
            display: 'flex',
            flexDirection: 'column'
        }
        // children has to be created inline as it will be mutated by yoga
        model.children = children = [{type: LAYOUT, style: {flex: 1}}]
    }

    let node = Node.create();

    if (header){
        //TODO we need to have normalized the css before we do this, otw a padding string value will ignore the paddingtop
        style = increaseCSSMeasure(style, 'padding', header.height, 'top');
    }

    setCSSMeasure(node, style, 'margin');
    setCSSMeasure(node, style, 'border');
    setCSSMeasure(node, style, 'padding');

    if (flexDirection !== null){
        node.setDisplay(yoga.DISPLAY_FLEX);
        node.setFlexDirection(FLEX_DIRECTION[flexDirection]);
        node.setAlignItems(yoga.ALIGN_STRETCH); //TODO allow this to be overridden
    } else if (type === TABBED_CONTAINER){
        node.setDisplay(yoga.DISPLAY_FLEX);
        node.setFlexDirection(yoga.FLEX_DIRECTION_ROW);
        node.setAlignItems(yoga.ALIGN_STRETCH);
    }

    if (parentIsTabbedContainer){
        const {active=0} = parent;
        if (idx !== active){
            node.setDisplay(yoga.DISPLAY_NONE);
        } else {
            node.setFlexGrow(1);
            node.setFlexShrink(1);
            node.setFlexBasis(0);
            node.setMargin(yoga.EDGE_TOP,34)
        }
    } /*else if (parentHasHeader){
        node.setMargin(yoga.EDGE_TOP,32); // how do we determine the header height
    }*/

    if (layout !== null && !parentIsSurface){
        // if we already have a layout, we reapply it, by transforming it into a style specification. This allows us to
        // manipulate the layout outside and preserve changes when we resize. If size has not changed, there is no need
        // to re-compute layout
        const {width: w, height: h} = layout;
        if (model.type === 'Splitter'){
            node.setFlexGrow(0);
            node.setFlexShrink(0);
            node.setFlexBasis(6);
        } else {
            node.setFlexGrow(1);
            node.setFlexShrink(1);
            node.setFlexBasis(getFlexDirection(parent) === ROW ? w : h); // need to know parent orientation
        }
    } else if (flex !== null){
        // TODO how do we default the flex values
        if (typeof flex === 'string'){
            const [flexGrow, flexShrink, flexBasis] = flex.split(' ');
            node.setFlexGrow(parseInt(flexGrow,0));
            node.setFlexShrink(parseInt(flexShrink,0));
            node.setFlexBasis(parseInt(flexBasis,0));
        } else if (typeof flex === 'number'){
            node.setFlexGrow(flex);
            node.setFlexShrink(flex);
            node.setFlexBasis(0);
        }
    } else {
        if (parentIsSurface){
            node.setPositionType(yoga.POSITION_TYPE_ABSOLUTE);
        }
        if (top !== null && left !== null){
            node.setPosition(yoga.EDGE_TOP, top);
        }
        if (left !== null){
            node.setPosition(yoga.EDGE_START, left);
        }
        if (width !== null){
            node.setWidth(width)
        }
        if (height !== null){
            node.setHeight(height)
        }
    }

    children.forEach((child,i) => {
        const expandedChild = createYogaTree(child, model, i);
        node.insertChild(expandedChild.node,i);
    })

    model.node = node
    return model;
}

function getFlexDirection(model){
    const style = (model && model.style) || NO_STYLE;
    return style.flexDirection || ROW;
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

export function elementsFromLayout(model){
    const {style: {backgroundColor}=NO_STYLE, layout: {top,left,width,height},children=NO_CHILDREN} = model;
    const style = {position: 'absolute', backgroundColor, top, left, width, height};
    return React.createElement('div', {key: model.$path,style,onClick: model.onClick}, children.map(elementsFromLayout));
}

export function setLayout(model){
    model.layout = model.node.getComputedLayout();
    model.children && model.children.forEach(child => setLayout(child))
}

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
        node[setMeasure](yoga.EDGE_ALL, value);
    } else if (typeof value === 'string'){
        const match = CSS_REX.exec(value)
        if (match === null){
            console.error(`Invalid css value for ${measure} '${value}'`)
        } else {
            const [, pos1, pos2, pos3, pos4] = match;
            const pos123 = pos1 && pos2 && pos3
            if (pos123 && pos4){
                node[setMeasure](yoga.EDGE_TOP, parseInt(pos1,10));
                node[setMeasure](yoga.EDGE_END, parseInt(pos2,10));
                node[setMeasure](yoga.EDGE_BOTTOM, parseInt(pos3,10));
                node[setMeasure](yoga.EDGE_START, parseInt(pos4,10));
            } else if (pos123){
                node[setMeasure](yoga.EDGE_TOP, parseInt(pos1,10));
                node[setMeasure](yoga.EDGE_START, parseInt(pos2,10));
                node[setMeasure](yoga.EDGE_END, parseInt(pos2,10));
                node[setMeasure](yoga.EDGE_BOTTOM, parseInt(pos3,10));
            } else if (pos1 && pos2){
                node[setMeasure](yoga.EDGE_TOP, parseInt(pos1,10));
                node[setMeasure](yoga.EDGE_BOTTOM, parseInt(pos1,10));
                node[setMeasure](yoga.EDGE_START, parseInt(pos2,10));
                node[setMeasure](yoga.EDGE_END, parseInt(pos2,10));
            } else {
                node[setMeasure](yoga.EDGE_ALL, parseInt(pos1,10));
            }
        }
    } else {
        const {measureTop, measureRight, measureBottom, measureLeft} = CSS_MEASURES[measure];
        if (style[measureTop]) node[setMeasure](yoga.EDGE_TOP, style[measureTop]);
        if (style[measureRight]) node[setMeasure](yoga.EDGE_END, style[measureRight]);
        if (style[measureBottom]) node[setMeasure](yoga.EDGE_BOTTOM, style[measureBottom]);
        if (style[measureLeft]) node[setMeasure](yoga.EDGE_START, style[measureLeft]);

    }

}
