
import {uuid} from '@heswell/utils';
import { followPath, followPathToParent, nextStep } from './pathUtils';
import { computeLayout as computeLayoutYoga } from './layoutUtils';

const EMPTY_OBJECT = {};

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
    if (command === 'resize') {
        return resizeLayout(model, options);
    } else if (command === 'replace') {
        return replaceChild(model, options.targetNode, options.replacementNode);
    } else if (command === 'remove') {
        const result = removeChild(model, options.targetNode);
        return result;
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

    //TODO how do we make this model pluggable

    switch (model.type) {
    case 'FlexBox': return flexLayout(m, path, top, left, width, height, visibility, active);
    case 'TabbedContainer': return flexLayout(m, path, top, left, width, height, visibility, active);
    case 'Surface': return flexLayout(m, path, top, left, width, height, visibility, active);
    default: return flexLayout(m, path, top, left, width, height, visibility, active);
    }

}

function flexLayout(model, path, top, left, width, height, visibility, active) {

    if (typeof active === 'number' && active !== model.isActive){
        model = {
            ...model,
            active
        }
    }
    return computeLayoutYoga(model, width, height, top, left, path);
}

function switchTab(layoutModel, { path, nextIdx }) {

    var container = followPath(layoutModel, path);
    // var content = container.children.slice();
    // we need to set height of selected child, even if it is not needed for 
    // rendering - children will inherit the value;
    // content[nextIdx] = content[nextIdx].set({height: content[idx].height});
    // content[idx] = content[idx].set({height:0});
    var { $path, visibility='visible' } = container;
    var newContainer = layout(container, container.layout, $path, visibility, false, nextIdx);

    return replaceChild(layoutModel, container, newContainer)

}

function drop(layoutModel, options) {

    var { draggedComponent: source, dropTarget: { component: target, pos, tabIndex = -1 } } = options;

    if (pos.position.Header) {
        if (target.type === 'TabbedContainer') { //onsole.log('CASE 2 Works)');
            let before, after;
            if (tabIndex === -1 || tabIndex >= target.children.length) {
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
    const target = before || after || into;
    let { $path, /*active,*/ type, style, children } = model;
    let { idx, finalStep } = nextStep($path, target);

    // One more step needed when we're inserting 'into' a container
    var oneMoreStepNeeded = finalStep && into && idx !== -1;

    if (finalStep && !oneMoreStepNeeded) {

        const flexBox = type === 'FlexBox';
        const dim = flexBox && (style.flexDirection === 'row' ? 'width' : 'height');

        if (type === 'Surface' && idx === -1) {
            children = children.concat(source);
        } else {

            children = children.reduce((arr, child, i/*, all*/) => {
                // idx of -1 means we just insert into end 
                if (idx === i) {
                    if (flexBox) {
                        var size = (child.layout[dim] - 6) / 2;
                        child = {
                            ...child,
                            layout: {...child.layout, [dim]: size}};
                        const flex = source.style.flex === undefined ? 1 : source.style.flex;
                        source = {
                            ...source,
                            layout: {...source.layout, [dim]: size},
                            style: {...source.style, flex, position: null, transform: null, transformOrigin: null}
                        };
                    } else {
                        source = {...source, style: {...source.style, position: null, transform: null, transformOrigin: null}};
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
        children[idx] = insert(children[idx], source, into, before, after, size);
    }

    const {layout: modelLayout} = model;
    return layout({...model, children}, modelLayout, model.$path)

}

// this is replaceChild with extras
function wrap(model, source, target, pos) {

    var { idx, finalStep } = nextStep(model.$path, target.$path);

    var children = model.children.slice();

    if (finalStep) {
        var { type, flexDirection } = getLayoutSpec(pos); // roll dim into this
        var dim = flexDirection === 'row' ? 'width' : 'height';

        var active = type === 'TabbedContainer' || pos.position.SouthOrEast ? 1 : 0;
        var $path = `${model.$path}.${idx}`;
        target = children[idx];
        var style = { position: null, transform: null, transformOrigin: null, flex: 1 };
        var size = (target.layout[dim] - 6) / 2;
        var childLayout = { [dim]: size };
        var wrapperStyle = { flexDirection };
        if (target.style.flex) {
            wrapperStyle.flex = target.style.flex;
        }

        // need to roll resizeable into the layoutModel. else we lose it here
        var wrapper = layout({
            type,
            $path,
            active,
            $id: uuid(),
            style: wrapperStyle,
            layout: target.layout,
            resizeable: target.resizeable,
            children: (pos.position.SouthOrEast || pos.position.Header)
                ? [{...target, $path: `${$path}.0`, style: {...target.style, ...style}, layout: childLayout},
                    {...source, $path: `${$path}.1`, style: {...source.style, ...style}, layout: childLayout}]
                : [{...source, $path: `${$path}.0`, style: {...source.style, ...style}, layout: childLayout},
                    {...target, $path: `${$path}.1`, style: {...target.style, ...style}, layout: childLayout}]
        },
        target.layout,
        $path,
        'visible',
        true);

        children.splice(idx, 1, wrapper);

    } else {
        children[idx] = wrap(children[idx], source, target, pos);
    }

    const {layout: modelLayout} = model;
    // we call layout too many times by invoking it at this level
    return layout({...model, children}, modelLayout, model.$path)

}

function resizeLayout(model, { path, measurements, dimension }) {

    const target = followPath(model, path);
    const position = dimension === 'width' ? 'left' : 'top';
    let shift = 0;

    const resizedTarget = layout({
        ...model,
        children: model.children.map((child,i) => {
            const {layout} = child;
            const measurement = measurements[i];
            const { [dimension]: dim } = layout;
            if (dim === measurement && shift === 0) {
                return child;
            } else {
                const newLayout = { ...layout, [dimension]: measurement, [position]: layout[position] + shift };
                shift += (measurement - dim);
                return {
                    ...child,
                    layout: newLayout
                };
            }
        })
    }, model.layout, model.$path);

    return replaceChild(model, target, resizedTarget);

}

function simpleClone(o1, o2, unversioned) {

    if (o2 === undefined) {
        return o1;
    }

    var result = {};
    var value1;
    var value2;
    var property;
    var versionIncrement = unversioned === true ? 0 : 1;

    // copy forward existing properties, making replacements and deletions...
    for (property in o1) {

        value1 = o1[property];
        value2 = o2[property];


        if (property === '$version') {
            result.$version = value1 + versionIncrement;
        } else if (property === 'style') {
            result.style = simpleClone(value1, value2);
        } else if (value2 !== null) {
            if (typeof value2 !== 'undefined') {
                result[property] = value2;
            } else {
                result[property] = o1[property];
            }
        }
    }

    /// ...then add new properties 
    for (property in o2) {
        if (o2[property] !== null && (typeof result[property] === 'undefined')) {
            result[property] = o2[property];
        }
    }

    return result;

}

function clone(model, overrides, unversioned) {

    var { /*type, $version,*/ style: s1, ...rest1 } = model;
    var { style: s2 = EMPTY_OBJECT, ...rest2 } = overrides;

    if (noEffectiveOverrides(s1, s2) && noEffectiveOverrides(rest1, rest2)) {
        return model;
    }

    return simpleClone(model, overrides, unversioned);

}

function noEffectiveOverrides(source, overrides) {
    var properties = Object.getOwnPropertyNames(overrides);
    for (var i = 0; i < properties.length; i++) {
        if (overrides[properties[i]] !== source[properties[i]]) {
            return false;
        }
    }
    return true;
}

function removeChild(model, child) {

    var { idx, finalStep } = nextStep(model.$path, child.$path);

    var children = model.children.slice();

    if (finalStep) {

        if (idx > 0 && isSplitter(children[idx - 1])) {
            children.splice(idx - 1, 2);
        } else if (idx === 0 && isSplitter(children[1])) {
            children.splice(0, 2);
        } else {
            children.splice(idx, 1);
        }

        var { layout: modelLayout, $path/*, active */} = model;

        if (children.length === 1 && model.type.match(/FlexBox|TabbedContainer/)) {
            // certain style attributes from the parent must be passed down to the 
            // replacement child, eg flex - are there others ?
            const { flex } = model.style;
            return layout(clone(children[0], { style: { flex } }, true), modelLayout, $path);
        } else {
            var { top, left, width, height } = modelLayout;
            // var props = {};
            //var nowActive = active;
            // if (active === children.length) {
            //     nowActive = props.active = active - 1;
            // }
            const result = layout({
                ...model,
                children
            }, {top, left, width, height}, model.$path);
            return result;

        }
    } else {
        children[idx] = removeChild(children[idx], child);
    }

    children = children.map((child, i) => {
        var $path = `${model.$path}.${i}`;
        return child.$path === $path ? child : clone(child, { $path });
    })

    return clone(model, { children })

}

function replaceChild(model, child, replacement) {

    if (replacement.$path === model.$path) {
        return replacement;
    }

    var { idx, finalStep } = nextStep(model.$path, child.$path);

    var children = model.children.slice();

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
        children[idx] = replaceChild(children[idx], child, replacement);
    }

    return layout({...model, children}, model.layout, model.$path)
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
