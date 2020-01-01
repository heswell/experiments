import {uuid} from '@heswell/utils';
import { followPath, followPathToParent, nextStep } from './pathUtils';
import { computeLayout, recomputeChildLayout } from './layoutUtils';

export function containerOf(layout, target) {

    if (target === layout) {
        return null;
    } else {

        let { idx, finalStep } = nextStep(layout.$path, target.$path);
        if (finalStep) {
            return layout;
        } else if (layout.children === undefined || layout.children[idx] === undefined) {
            return null;
        } else {
            return containerOf(layout.children[idx], target);
        }
    }
}

export function handleLayout(model, command, options) {

    // This is called during splitter resize to resize children of model
    if (command === 'splitter-resize') {
        return resizeFlexLayout(model, options);
    } else if (command === 'replace') {
        return replaceChild(model, options.targetNode, options.replacementNode);
    } else if (command === 'remove') {
        return removeChild(model, options.targetNode);
    }
    // else if (command === 'config-change'){
    //     return Layout.config(layout, options);
    // }
    else if (command === 'switch-tab') {
        return switchTab(model, options);
    }
    // else if (command === 'minimize'){
    //     return Layout.minimize(layout, options);
    // }
    // else if (command === 'maximize'){
    //     return Layout.maximize(layout, options);
    // }
    // else if (command === 'restore'){
    //     return Layout.restore(layout, options);
    //}
    else if (command === 'drop') {
        return drop(model, options);
    }

}

export function layout(model, position = {}, path = '0', visibility = 'visible', force = false, active) {
    console.log(`%clayout for ${model.type} #${model.$path}`,'color:brown;font-weight:bold;')

    function firstNumber(n1, n2, n3) {
        return typeof n1 === 'number' ? Math.round(n1) : typeof n2 === 'number' ? n2 : n3;
    }

    function firstDefined(n1, n2, n3) {
        return n1 !== undefined
            ? (typeof n1 === 'number' ? Math.round(n1) : n1)
            : n2 !== undefined ? n2 : n3;
    }

    var style = model.style || {};
    var top = firstNumber(position.top, style.top, 0);
    var left = firstNumber(position.left, style.left, 0);
    var width = firstDefined(position.width, style.width, 0);
    var height = firstDefined(position.height, style.height, 0);

    var { layout, ...m } = model;

    if (layout && force !== true) {
        if (path === model.$path &&
            width === layout.width &&
            height === layout.height &&
            top === layout.top &&
            left === layout.left &&
            (visibility === undefined || visibility === model.style.visibility) &&
            (active === undefined || active === model.active)) {

            return model;
        }
    }


    if (typeof active === 'number' && active !== m.isActive){
        m = {...m,active};
    }
    return computeLayout(m, width, height, top, left, path);
}

function drop(layoutModel, options) {

    var { draggedComponent: source, dropTarget: { component: target, pos } } = options;

    if (pos.position.Header) {
        if (target.type === 'TabbedContainer') { //onsole.log('CASE 2 Works)');
            let before, after;
            const tabIndex = pos.tab.index;
            if (pos.tab.index === -1 || tabIndex >= target.children.length) {
                after = target.children[target.children.length - 1];
            } else {
                before = target.children[tabIndex];
            }
            return transform(layoutModel, { insert: { source, before, after } });
        } else { //onsole.log('CASE 2B Works)'); 
            return transform(layoutModel, { wrap: { target, source, pos } });
        }
    } else if (pos.position.Centre) {
        //onsole.log(JSON.stringify(source,null,2))
        // source = clone(source, {style:{position:null,transform:null,transformOrigin:null}});
        return replaceChild(layoutModel, followPath(layoutModel, target.$path), source);
    } else {
        return dropLayoutIntoContainer(layoutModel, pos, source, target);
    }

}

function dropLayoutIntoContainer(layoutModel, pos, source, target) {

    var targetContainer = followPathToParent(layoutModel, target.$path);

    if (absoluteDrop(target, pos.position)) {
        return transform(layoutModel, { insert: { source, target, pos } });
    } else if (target === layoutModel || isDraggableRoot(layoutModel, target)) {
        // Can only be against the grain...
        if (withTheGrain(pos, target)) {
            throw Error('How the hell did we do this');
        } else { //onsole.log('CASE 4A) Works');
            //return transform(layout, { wrap: {target, source, pos }, releaseSpace}); 
        }
    } else if (withTheGrain(pos, targetContainer)) {
        if (pos.position.SouthOrEast) { //onsole.log(`CASE 4B) Works. Insert into container 'with the grain'`);
            return transform(layoutModel, { insert: { source, after: target, pos } });
        } else { //onsole.log('CASE 4C) Works');
            return transform(layoutModel, { insert: { source, before: target, pos } });
        }
    } else if (againstTheGrain(pos, targetContainer)) { //onsole.log('CASE 4D) Works.');
        return transform(layoutModel, { wrap: { target, source, pos } });
    } else if (isContainer(targetContainer)) {
        return transform(layoutModel, { wrap: { target, source, pos } });
    } else {
        console.log('no support right now for position = ' + pos.position);
    }
    return layoutModel;

}

function transform(layoutModel, options) {

    var nodeToBeInserted;
    var nodeAfterWhichToInsert;
    var nodeBeforeWhichToInsert;
    var targetContainer;
    var nodeSize;

    for (var op in options) {
        var opts = options[op];
        switch (op) {

        case 'insert':

            nodeToBeInserted = opts.source;

            nodeSize = opts.pos ? (opts.pos.width || opts.pos.height) : undefined;

            if (opts.before) {
                //onsole.log(`transform: insert before ` + opts.before.$path);
                nodeBeforeWhichToInsert = opts.before.$path;
            } else if (opts.after) {
                //onsole.log(`transform: insert after ` + opts.after.$path);
                nodeAfterWhichToInsert = opts.after.$path;
            } else {
                targetContainer = opts.target.$path;
            }

            break;

        case 'wrap':

            layoutModel = wrap(layoutModel, opts.source, opts.target, opts.pos);

            break;
        default:

        }
    }

    if (nodeToBeInserted) {
        layoutModel = insert(layoutModel, nodeToBeInserted, targetContainer, nodeBeforeWhichToInsert, nodeAfterWhichToInsert, nodeSize);
    }

    return layoutModel;

}

function insert(model, source, into, before, after, size) {
    const manualLayout = _insert(model, source, into, before, after, size);
    return layout(manualLayout, model.computedStyle, model.$path)
}

function _insert(model, source, into, before, after, size){

    const { $path, type, style } = model;
    const target = before || after || into;
    let { idx, finalStep } = nextStep($path, target);
    let children;

    // One more step needed when we're inserting 'into' a container
    var oneMoreStepNeeded = finalStep && into && idx !== -1;

    if (finalStep && !oneMoreStepNeeded) {

        const flexBox = type === 'FlexBox';
        const dim = flexBox && (style.flexDirection === 'row' ? 'width' : 'height');

        if (type === 'Surface' && idx === -1) {
            children = model.children.concat(source);
        } else {
            const hasSize = typeof size === 'number'; 
            children = model.children.reduce((arr, child, i/*, all*/) => {
                // idx of -1 means we just insert into end 
                if (idx === i) {
                    if (flexBox) {
                        
                        // source only has position attributes because of dragging
                        const {style: {left: _1, top: _2, ...sourceStyle}} = source;

                        if (!hasSize){
                            size = (child.computedStyle[dim] - 6) / 2;
                            child = {
                                ...child,
                                style: {...child.style, [dim]: size}
                            };
                        }
                        source = {
                            ...source,
                            style: {...sourceStyle, transform: null, transformOrigin: null, flex: hasSize ? null : 1, [dim]: size}
                        };
                    } else {
                        source = {...source, style: {...sourceStyle, transform: null, transformOrigin: null}};
                    }
                    if (before) {
                        arr.push(source, child);
                    } else {
                        arr.push(child, source);
                    }
                } else {
                    arr.push(child);
                }
                return arr;
            }, []);
        }
    } else {
        children = model.children.slice();
        children[idx] = _insert(children[idx], source, into, before, after, size);
    }

    return {...model, children};

}

// this is replaceChild with extras
function wrap(model, source, target, pos) {
    const manualLayout = _wrap(model, source, target, pos);
    return layout(manualLayout, model.computedStyle, model.$path)
}

function _wrap(model, source, target, pos){

    const { idx, finalStep } = nextStep(model.$path, target.$path);
    const children = model.children.slice();

    if (finalStep) {
        const { type, flexDirection } = getLayoutSpec(pos);
        const active = type === 'TabbedContainer' || pos.position.SouthOrEast ? 1 : 0;
        target = children[idx];

        // var style = { position: null, transform: null, transformOrigin: null, flex: hasSize ? null : 1, [dim]: hasSize? size : undefined };

        var wrapperStyle = { flexDirection };
        if (target.style.flex) {
            wrapperStyle.flex = target.style.flex;
        }

        // source only has position attributes because of dragging
        const {style: {left: _1, top: _2, ...sourceStyle}} = source;

        var wrapper = {
            type,
            active,
            $id: uuid(),
            style: wrapperStyle,
            resizeable: target.resizeable,
            children: (pos.position.SouthOrEast || pos.position.Header)
                ? [{...target, style: {...target.style, flex: 1}, resizeable: true},
                    {...source, style: {...sourceStyle}, resizeable: true}]
                : [{...source, style: {...sourceStyle}, resizeable: true},
                    {...target, style: {...target.style, flex: 1}, resizeable: true}]
        };

        children.splice(idx, 1, wrapper);

    } else {
        children[idx] = _wrap(children[idx], source, target, pos);
    }

    return {...model, children};

}

function switchTab(model, { path, nextIdx }) {
    var target = followPath(model, path);
    const manualLayout = {
        ...target,
        active: nextIdx
    };
    const resizedTarget = recomputeChildLayout(manualLayout);
    return replaceChild(model, target, resizedTarget);
}

function resizeFlexLayout(model, { dim, path, measurements }) {
    // is target always the same as model ?
    const target = followPath(model, path);

    const manualLayout = {
        ...model,
        children: model.children.map((child,i) => {
            const {type, style: {flex, [dim]: _, ...childStyle}, layoutStyle: {[dim]: _1, ...childLayoutStyle } } = child;
            const {flexBasis, flexShrink=1, flexGrow=1} = childLayoutStyle;
            const measurement = measurements[i];
            if (type === 'Splitter' || flexBasis === measurement){
                return child;
            } else {
                return {
                    ...child,
                    layoutStyle: {
                        ...childLayoutStyle,
                        flexBasis: measurement
                    },
                    style: {
                        ...childStyle,
                        flexBasis: measurement,
                        flexShrink,
                        flexGrow
                    }
                }                
            }
        })
    };

    const resizedTarget = recomputeChildLayout(manualLayout);
    return replaceChild(model, target, resizedTarget);

}

function removeChild(model, child) {
    const manualLayout = _removeChild(model, child)
    return recomputeChildLayout(manualLayout, model.computedStyle, model.$path)
}

function _removeChild(model, child){
    const { idx, finalStep } = nextStep(model.$path, child.$path);
    let children = model.children.slice();

    if (finalStep) {

        if (idx > 0 && isSplitter(children[idx - 1])) {
            children.splice(idx - 1, 2);
        } else if (idx === 0 && isSplitter(children[1])) {
            children.splice(0, 2);
        } else {
            children.splice(idx, 1);
        }

        // var { layout: modelLayout, $path} = model;

        if (children.length === 1 && model.type.match(/FlexBox|TabbedContainer/)) {
            console.log(`removing the only child of ${model.type} ${model.$path}`);
            return children[0];
            //     // certain style attributes from the parent must be passed down to the 
        //     // replacement child, eg flex - are there others ?
        //     const { flex } = model.style;
        //     return layout(clone(children[0], { style: { flex } }, true), modelLayout, $path);
        } 
        // else {
        //     var { top, left, width, height } = modelLayout;
        //     // var props = {};
        //     //var nowActive = active;
        //     // if (active === children.length) {
        //     //     nowActive = props.active = active - 1;
        //     // }
        //     const result = layout({
        //         ...model,
        //         children
        //     }, {top, left, width, height}, model.$path);
        //     return result;

        // }
    } else {
        children[idx] = _removeChild(children[idx], child);
    }

    children = children.map((child, i) => {
        var $path = `${model.$path}.${i}`;
        return child.$path === $path ? child : {...child, $path };
    })
    return { ...model, children };
}

function replaceChild(model, child, replacement) {
    if (replacement.$path === model.$path) {
        return replacement;
    } else {
        const manualLayout = _replaceChild(model, child, replacement);
        return recomputeChildLayout(manualLayout, model.computedStyle, model.$path)
    }
}

function _replaceChild(model, child, replacement){
    const { idx, finalStep } = nextStep(model.$path, child.$path);
    const children = model.children.slice();

    if (finalStep) {
        if (Array.isArray(replacement)) {
            //TODO - make this right
            // var dim = model.style.flexDirection === 'row' ? 'width' : 'height';
            // var dim1 = child.layout[dim];
            // replacement = replacement.map((l, i) => {
            //     opts[dim] = dim1 / replacement.length;
            //     return clone(l, { $path: `${model.$path}.${idx + i}` })
            // });
            // [].splice.apply(children, [idx, 1].concat(replacement));
        } else {
            children[idx] = {
                ...replacement,
                layout: {...child.layout}
            };
        }
    } else {
        children[idx] = _replaceChild(children[idx], child, replacement);
    }
    return {...model, children};
}

// Note: withTheGrain is not the negative of againstTheGrain - the difference lies in the 
// handling of non-Flexible containers, the response for which is always false;
function withTheGrain(pos, container) {

    return pos.position.NorthOrSouth ? isTower(container)
        : pos.position.EastOrWest ? isTerrace(container)
            : false;
}

function againstTheGrain(pos, layout) {

    return pos.position.EastOrWest ? isTower(layout) || isTabset(layout)
        : pos.position.NorthOrSouth ? isTerrace(layout) || isTabset(layout)
            : false;

}

function absoluteDrop(target, position) {
    return target.type === 'Surface' && position.Absolute;
}

function isSplitter(model) {
    return model && model.type === 'Splitter';
}

function isContainer(model) {
    return model.type === 'Container' || model.type === 'DynamicContainer';
}

function isTabset(model) {
    return model.type === 'TabbedContainer';
}

function isTower(model) {
    return model.type === 'FlexBox' && model.style.flexDirection === 'column';
}

function isTerrace(model) {
    return model.type === 'FlexBox' && model.style.flexDirection === 'row';
}

function isDraggableRoot(layout, component) {

    if (component.$path === '0') {
        return true;
    }

    var container = containerOf(layout, component);
    if (container) {
        return container.type === 'App';
    } else {
        debugger;
    }
}

function getLayoutSpec(pos) {
    var type, flexDirection;

    if (pos.position.Header) {
        type = 'TabbedContainer';
        flexDirection = 'column';
    } else {
        type = 'FlexBox';
        if (pos.position.EastOrWest) {
            flexDirection = 'row';
        } else {
            flexDirection = 'column';
        }
    }

    return { type, flexDirection };
}
