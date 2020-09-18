import { uuid } from '@heswell/utils';
import { addDefaultLayoutProps, getLayoutModel, getManagedDimension, resetPath } from './layout-json';
import { containerOf, followPath, followPathToParent, nextStep } from './path-utils';
import { computeLayout, recomputeChildLayout, printLayout, stretchLoaded } from './layout-utils';
import { removeVisualStyles } from './css-properties';

// These are stretch values, need to import (dynamically)
const Display = {
    Block: 0,
    None: 1
}

/** @type {LayoutActions}  */
export const Action = {
    DRAG_START: 'drag-start',
    DRAG_DROP: 'drag-drop',
    INITIALIZE: 'initialize',
    REMOVE: 'remove',
    REPLACE: 'replace',
    SPLITTER_RESIZE: 'splitter-resize',
    SWITCH_TAB: 'switch-tab'
}

// TODO move these to reducer utils
const MISSING_HANDLER = (state, action) => {
    console.warn(`layoutActionHandlers. No handler for action.type ${action.type}`);
    return state;
};

const MISSING_TYPE = undefined;

const MISSING_TYPE_HANDLER = (state) => {
    console.warn(`layoutActionHandlers. Invalid action:  missing attribute 'type'`);
    return state;
};

const handlers = {
    [Action.DRAG_START]: dragStart,
    [Action.DRAG_DROP]: dragDrop,
    [Action.INITIALIZE]: initialize,
    [Action.REMOVE]: removeChild,
    [Action.SPLITTER_RESIZE]: splitterResize,
    [Action.SWITCH_TAB]: switchTab,
    [Action.REPLACE]: replaceChild,
    [MISSING_TYPE]: MISSING_TYPE_HANDLER
}

export const initModel = ({ layoutType, props, layout }) =>
    initialize(null, { layoutType, props, layout })

export default (state, action) => {
    return (handlers[action.type] || MISSING_HANDLER)(state, action);
}

function initialize(_, action) {
    if (stretchLoaded()){
        const {layoutType, props, layout} = action;
        let layoutProps;
        if (layout){
            const {style: {flex, ...style} = {}} = props;
            layoutProps = {
                ...props,
                style : {
                    ...style,
                    ...layout
                }
            }
        } else {
            layoutProps = props;
        }

        return applyLayout(getLayoutModel(layoutType, layoutProps));

    } else {
        return null;
    }
}

export function applyLayout(model, position = {}, path = '0', visibility = 'visible', force = false, active) {
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


function switchTab(state, { path, nextIdx }) {
    var target = followPath(state, path);
    const manualLayout = {
        ...target,
        active: nextIdx,
        children: target.children.map((child, i) => {
            if (i === target.active) {
                return {
                    ...child,
                    layoutStyle: {
                        ...child.layoutStyle,
                        display: Display.None
                    }
                }
            } else if (i === nextIdx) {
                return {
                    ...child,
                    layoutStyle: {
                        ...child.layoutStyle,
                        display: Display.Block
                    }
                }
            } else {
                return child;
            }
        })
    };
    return replaceChild(state, {target, replacement: manualLayout});
}

function splitterResize(state, { layoutModel, dim, path, measurements }) {
    // onsole.log(`%csplitterResize ${dim} ${path} ${measurements}`,'color: blue;font-weight: bold;')
    // is target always the same as state ?
    const target = followPath(state, path);

    const manualLayout = {
        ...layoutModel,
        children: layoutModel.children.map((child, i) => {
            const { type, style: { flex, ...childStyle }, layoutStyle } = child;
            const { [dim]: size, flexShrink = 1, flexGrow = 1 } = layoutStyle;
            const measurement = measurements[i];
            if (type === 'Splitter' || size === measurement) {
                return child;
            } else {
                return {
                    ...child,
                    layoutStyle: {
                        ...layoutStyle,
                        flexBasis: 'auto',
                        [dim]: measurement
                    },
                    style: {
                        ...childStyle,
                        [dim]: measurement,
                        flexBasis: 'auto',
                        flexShrink,
                        flexGrow
                    }
                }
            }
        })
    };

    return replaceChild(state, {target, replacement: manualLayout});

}

function replaceChild(state, {target:child, replacement}) {
    if (replacement.$path === state.$path) {
        return recomputeChildLayout(replacement, state.computedStyle, state.$path)
    } else {
        const manualLayout = _replaceChild(state, child, replacement);
        return recomputeChildLayout(manualLayout, state.computedStyle, state.$path)
    }
}

function _replaceChild(model, child, replacement) {
    const { idx, finalStep } = nextStep(model.$path, child.$path);
    const children = model.children.slice();

    if (finalStep) {
        // can replacement evcer be an array - there used to be provision for that here
        let newChild = replacement;
        const { style: { left: _1, top: _2, flex: _3, width, height,  ...style }} = newChild;
        if (newChild.resizeable && newChild.layoutStyle.flexBasis !== 'auto' && (width !== undefined || height !== undefined)){
            if (model.type === 'FlexBox'){
                const [dim] = getManagedDimension(model.style);
                const {flexGrow, flexShrink, [dim]: size} = child.layoutStyle;
                const flexStyle = {flexBasis: 'auto', flexGrow, flexShrink, [dim]: size};
                const {layoutStyle: {width: _w, height: _h, ...layoutStyle}} = newChild;
                newChild = {
                    ...newChild,
                    $path: child.$path, // if replacement might be a layout, need to cascade path change
                    style: {
                        ...style,
                        ...flexStyle
                    },
                    layoutStyle: {
                        ...layoutStyle,
                        ...flexStyle
                    }
                };
            } else {
                const {width, height} = child.layoutStyle; // what else do we need to copy across
                newChild = {
                    ...newChild,
                    $path: child.$path, // if replacement might be a layout, need to cascade path change
                    style: {
                        ...style,
                        width,
                        height
                    },
                    layoutStyle: child.layoutStyle // need to take just the 'outerLayoutStyles' from target, retaining innerLayoutSTyles
                }
            }
        }

        children[idx] = newChild;

    } else {
        children[idx] = _replaceChild(children[idx], child, replacement);
    }
    return { ...model, children };
}

// do we have to remove drag lie this...by destructuring state here, it is no longer === layoutModel
function dragDrop({ drag, ...state }, action) {

    const { component: source } = drag;
    const { dropTarget: { component: target, pos }, targetPosition } = action;

    console.log(`drop ${source.style.backgroundColor} onto ${target.style.backgroundColor || target.type}`)

    if (pos.position.Header) {
        if (target.type === 'TabbedContainer') {
            let before, after;
            const tabIndex = pos.tab.index;
            if (pos.tab.index === -1 || tabIndex >= target.children.length) {
                ({$path: after} = target.children[target.children.length - 1]);
            } else {
                ({$path: before} = target.children[tabIndex]);
            }
            return insert(state, source, null, before, after);
        } else { 
            return wrap(state, source, target, pos);
        }
    } else if (pos.position.Centre) {
        return replaceChild(state, {target:followPath(state, target.$path), replacement: source});
    } else {
        return dropLayoutIntoContainer(state, pos, source, target, targetPosition);
    }

    return state;
}

function dragStart(state, { dragRect, dragPos, instructions,  ...action }) {
    const newState = { ...state, drag: { dragRect, dragPos, component: action.layoutModel } };
    if (instructions && instructions.DoNotRemove){
        return newState;
    } else {
        return removeChild(newState, action);
    }
}

function removeChild(state, { layoutModel: child }) {
    const manualLayout = _removeChild(state, child);
    return recomputeChildLayout(manualLayout, state.computedStyle, state.$path)
}

function _removeChild(model, child) {
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

        if (model.type === 'TabbedContainer' && model.active === idx) {
            const nextActive = 0;
            model.active = nextActive;
            children[nextActive].layoutStyle.display = Display.Flex;
        }

        if (children.length === 1 && model.type.match(/FlexBox|TabbedContainer/)) {
            return unwrap(model, children[0]);
        }

    } else {
        children[idx] = _removeChild(children[idx], child);
    }

    children = children.map((child, i) => {
        var $path = `${model.$path}.${i}`;
        return child.$path === $path ? child : { ...child, $path };
    })
    return { ...model, children };
}

function unwrap(layoutModel, child) {
    const {
        $path,
        drag,
        type,
        style: {flex, flexBasis, flexGrow, flexShrink, width, height},
        layoutStyle: {flexBasis: layoutBasis, flexGrow: layoutGrow, flexShrink: layoutShrink}
    } = layoutModel;

    let unwrappedChild = resetPath(child, $path);
    if ($path === '0') {
        unwrappedChild = {
            ...unwrappedChild,
            drag,
            //TODO get this bit right, do we need top, left as well ?
            style: {
                ...child.style,
                width,
                height
            },
            computedStyle: layoutModel.computedStyle
        }
    } else if (type === 'FlexBox'){
        const [dim] = getManagedDimension(layoutModel.style);
        const {style: {[dim]: size, ...style}, layoutStyle: {[dim]: layoutSize, ...layoutStyle}} = unwrappedChild;
        unwrappedChild = {
            ...unwrappedChild,
            drag,
            style: {
                ...style,
                flex,
                flexGrow,
                flexShrink,
                flexBasis
            },
            layoutStyle: {
                ...layoutStyle,
                layoutGrow,
                layoutShrink,
                layoutBasis
            }
        }        
    }
    return unwrappedChild;

}

function isSplitter(model) {
    return model && model.type === 'Splitter';
}

function dropLayoutIntoContainer(layoutModel, pos, source, target, targetPosition) {

    if (target.$path === '0') {

        if (target.type === 'Surface'){
            const {style, layoutStyle, computedStyle} = source;
            const {left, top} = targetPosition;
            return {
                ...layoutModel,
                children: layoutModel.children.concat({
                    ...source,
                    style: { ...style, left, top },
                    layoutStyle: { ...layoutStyle, left, top },
                    computedStyle: { ...computedStyle, left, top }
                })
            }
        } else {
            return wrap(layoutModel, source, target, pos);
        }

    } else {

        var targetContainer = followPathToParent(layoutModel, target.$path);

        if (absoluteDrop(target, pos.position)) {
            return insert(layoutModel, source, target.$path, null, null, pos.width || pos.height)
        } else if (target === layoutModel || isDraggableRoot(layoutModel, target)) {
            // Can only be against the grain...
            if (withTheGrain(pos, target)) {
                throw Error('How the hell did we do this');
            } else { //onsole.log('CASE 4A) Works');
                //return transform(layout, { wrap: {target, source, pos }, releaseSpace}); 
            }
        } else if (withTheGrain(pos, targetContainer)) {
            if (pos.position.SouthOrEast) {
                return insert(layoutModel, source, null, null, target.$path, pos.width || pos.height)
            } else {
                return insert(layoutModel, source, null, target.$path, null, pos.width || pos.height)
            }
        } else if (againstTheGrain(pos, targetContainer)) { //onsole.log('CASE 4D) Works.');
            return wrap(layoutModel, source, target, pos );
        } else if (isContainer(targetContainer)) {
            return wrap(layoutModel, source, target, pos );
        } else {
            console.log('no support right now for position = ' + pos.position);
        }
    }

    return layoutModel;

}

// TODO do we still need surface
function absoluteDrop(target, position) {
    return target.type === 'Surface' && position.Absolute;
}

// this is replaceChild with extras
function wrap(model, source, target, pos) {
    const manualLayout = target.$path === model.$path
        ? _wrapRoot(model, source, pos)
        : _wrap(model, source, target, pos);
    const { width, height, top, left } = manualLayout.computedStyle;
    return computeLayout(manualLayout, width, height, top, left, model.$path)
}

function _wrapRoot(model, source, pos) {

    const { type, flexDirection } = getLayoutSpec(pos);
    const style = {
        ...removeVisualStyles(model.style),
        flexDirection
    };
    // source only has position attributes because of dragging
    const { style: { left: _1, top: _2, ...sourceStyle } } = source;
    const active = type === 'TabbedContainer' || pos.position.SouthOrEast ? 1 : 0;
    const [dim] = getManagedDimension(style);
    const sourceFlex = typeof pos[dim] === 'number'
        ? {flexGrow: 0, flexShrink: 0, flexBasis: pos[dim]}
        : {flex: 1};

    const nestedSource = { ...source, style: { ...sourceStyle, ...sourceFlex }, resizeable: true };
    const nestedTarget = { ...model, style: { ...model.style, flex: 1 }, resizeable: true };

    var wrapper = {
        $id: uuid(),
        $path: '0',
        type,
        active,
        style,
        resizeable: model.resizeable,
        computedStyle: model.computedStyle,
        children: (pos.position.SouthOrEast || pos.position.Header) ? [nestedTarget, nestedSource ] : [nestedSource, nestedTarget]
    };
    return wrapper;

}

function _wrap(model, source, target, pos) {

    const { idx, finalStep } = nextStep(model.$path, target.$path);
    const children = model.children.slice();

    if (finalStep) {
        const { type, flexDirection } = getLayoutSpec(pos);
        const active = type === 'TabbedContainer' || pos.position.SouthOrEast ? 1 : 0;
        target = children[idx];

        // TODO handle scenario where items have been resized, so have flexBasis values set
        const style = {
            ...removeVisualStyles(target.style),
            flexDirection
        };

        // If we're going to render source in a flex container, can we allow the dimensions
        // to be managed by flex ? Assume yes if the component is resizeable.
        const [dim] = getManagedDimension(style);

        const measurements = calculateSizesOfFlexChildren([target], target.$path, dim, pos);
        console.log(`measurements [${measurements}]`)
        const nestedSource = assignFlexDimension(source, dim, measurements[0]);
        const nestedTarget = assignFlexDimension(target, dim, measurements[1]);
            
        var wrapper = {
            type,
            active,
            $id: uuid(),
            style,
            resizeable: target.resizeable,
            children: (pos.position.SouthOrEast || pos.position.Header)
                ? [nestedTarget, nestedSource]
                : [nestedSource, nestedTarget]
        };

        addDefaultLayoutProps(type, wrapper);

        children.splice(idx, 1, wrapper);

    } else {
        children[idx] = _wrap(children[idx], source, target, pos);
    }

    return { ...model, children };

}

function insert(model, source, into, before, after, size) {
    const manualLayout = _insert(model, source, into, before, after, size);
    const { width, height, top, left } = manualLayout.computedStyle;
    return computeLayout(manualLayout, width, height, top, left, model.$path)
}

function _insert(model, source, into, before, after, size) {

    const { $path, type } = model;
    const target = before || after || into;
    let { idx, finalStep } = nextStep($path, target);
    let children;

    // One more step needed when we're inserting 'into' a container
    var oneMoreStepNeeded = finalStep && into && idx !== -1;

    if (finalStep && !oneMoreStepNeeded) {
        const isFlexBox = type === 'FlexBox';

        if (type === 'Surface' && idx === -1) {
            children = model.children.concat(source);
        } else {
            const hasSize = typeof size === 'number';
            const [dim] = getManagedDimension(model.style);
            // TODO take size into account here, within the calculateSizesOfFlexChildren function
            const measurements = calculateSizesOfFlexChildren(model.children, before || after, dim, {[dim]: size});

            children = model.children.reduce((arr, child, i) => {
                // idx of -1 means we just insert into end
                const childIdx = arr.length;
                if (idx === i) {
                    if (isFlexBox) {
                        source = assignFlexDimension(source, dim, measurements[childIdx]);
                        child = assignFlexDimension(child, dim, measurements[childIdx+1]);
                    } else {
                        const { style: { left: _1, top: _2, flex: _3, width, height,transform:_4, transformOrigin:_5,  ...style } } = source;
                        const dimensions = source.resizeable ? {} : {width, height}
                        source = { ...source, style: { ...style, ...dimensions } };
                    }
                    if (before) {
                        arr.push(source, child);
                    } else {
                        arr.push(child, source);
                    }
                } else if (child.type === 'Splitter' || !isFlexBox){
                    arr.push(child);
                } else {
                    arr.push(assignFlexDimension(child, dim, measurements[childIdx]));
                }
                return arr;
            }, []);
        }
    } else {
        children = model.children.slice();
        children[idx] = _insert(children[idx], source, into, before, after, size);
    }

    return { ...model, children };

}

function assignFlexDimension(layoutModel, dim, size){

    const {style: {flexBasis, [dim]: currentSize}} = layoutModel;
    if (flexBasis === 'auto' && currentSize === size ){
        return layoutModel;
    }

    const {
        style: {width:_1, height: _2, flex: _3, ...style}, 
        layoutStyle: {width: _4, height: _5, ...layoutStyle}, 
        ...rest 
    } = layoutModel;

    // TODO get this right
    const resizeable = true;

    const flexStyle = {
        [dim]: size,
        flexBasis: 'auto',
        flexGrow: 1,
        flexShrink: 1
    };

    return {
        ...rest,
        resizeable,
        style: {
            ...style,
            ...flexStyle
        },
        layoutStyle: {
            ...layoutStyle,
            ...flexStyle
        }
    };

}

function calculateSizesOfFlexChildren(layoutModels, target, dim, pos={}){
    const children = layoutModels.map(
        ({$path, layoutStyle: {flexBasis, [dim]: flexSize}, computedStyle: {[dim]: size}}) => ({$path, size, flexBasis, flexSize}));

    const newSize = pos[dim];

    return children.reduce((acc, {$path, flexBasis, flexSize, size}) => {
        if ($path === target){
            let size1;
            let size2;
            if (newSize === undefined){
                size1 = Math.floor(size / 2);
                size2 = size - size1;
            } else {
                // do we need to consider pos to determine which should be which ?
                size1 = newSize;
                size2 = size - size1;
            }
            acc.push(size1, size2);
        } else if (flexBasis === 'auto' && flexSize !== undefined){
            acc.push(flexSize);
        } else {
            acc.push(size);
        }
        return acc;
    }, []);    

}

//TODO how are we going to allow dgar containers to be defined ?
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

function isContainer(model) {
    return model.type === 'DynamicContainer';
}

function isTower(model) {
    return model.type === 'FlexBox' && model.style.flexDirection === 'column';
}

function isTerrace(model) {
    return model.type === 'FlexBox' && model.style.flexDirection !== 'column';
}

function isTabset(model) {
    return model.type === 'TabbedContainer';
}

// maybe in layout-json ?
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
