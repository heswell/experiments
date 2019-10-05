import ReactDOM from 'react-dom';
import DropTargetRenderer from '../components/drop-target/drop-target-renderer';
import DragState from './drag-state';
import { followPath, BoxModel, Position, DropTarget, identifyDropTarget } from '../model';

let _dragCallback;
let _dragStartX;
let _dragStartY;
let _dragContainer;
let _dragState;
let _dropTarget = null;
let _measurements;
let _simpleDrag;

const _dragThreshold = 5;
const _dropTargetRenderer = new DropTargetRenderer();
const _dragContainers = [];
const SCALE_FACTOR = 0.4;

export class DragContainer {

    static register(path) {
        // need to decide how to store these
        _dragContainers.push(path);
    }

    static unregister(/*path*/) {

    }
}

function getDragContainer(layoutModel, path) {

    var pathToContainer = '';
    var maxSteps = 0;

    // If the model has no path (i.e. it hasn't been dragged out of the existing layout)
    // hiow do we decide the dragContainer to use (assuming there may be more than 1)
    if (path === undefined) {
        pathToContainer = _dragContainers[0];
    }
    else {
        // find the longest container path that matches path (ie the smallest enclosing container); 
        for (var i = 0; i < _dragContainers.length; i++) {
            if (path.indexOf(_dragContainers[i]) === 0) {
                var steps = _dragContainers[i].split('.').length;
                if (steps > maxSteps) {
                    maxSteps = steps;
                    pathToContainer = _dragContainers[i];
                }
            }
        }
    }

    return followPath(layoutModel, pathToContainer);

}

export const Draggable = {

    handleMousedown(e, dragStartCallback) {
        _dragCallback = dragStartCallback;

        _dragStartX = e.clientX;
        _dragStartY = e.clientY;

        window.addEventListener('mousemove', preDragMousemoveHandler, false);
        window.addEventListener('mouseup', preDragMouseupHandler, false);

        e.preventDefault();
    },

    // called from surface handleDragSTart (_dragCallback)
    initDrag(e, layoutModel, path, { top, left, right, bottom }, dragHandler) {

        _dragCallback = dragHandler;

        return initDrag(e, layoutModel, path, { top, left, right, bottom });

    }
};

function preDragMousemoveHandler(e) {
    var x = true;
    var y = true;

    let x_diff = x ? e.clientX - _dragStartX : 0;
    let y_diff = y ? e.clientY - _dragStartY : 0;
    let mouseMoveDistance = Math.max(Math.abs(x_diff), Math.abs(y_diff));

    // when we do finally move the draggee, we are going to 'jump' by the amount of the drag threshold, should we
    // attempt to animate this ?    
    if (mouseMoveDistance > _dragThreshold) {

        window.removeEventListener('mousemove', preDragMousemoveHandler, false);
        window.removeEventListener('mouseup', preDragMouseupHandler, false);

        if (_dragCallback(e, x_diff, y_diff) !== false) {
            window.addEventListener('mousemove', dragMousemoveHandler, false);
            window.addEventListener('mouseup', dragMouseupHandler, false);
        }
    }
}

function preDragMouseupHandler() {

    window.removeEventListener('mousemove', preDragMousemoveHandler, false);
    window.removeEventListener('mouseup', preDragMouseupHandler, false);

}

function initDrag(evt, layoutModel, path, dragRect) {

    _dragContainer = getDragContainer(layoutModel, path);

    var start = window.performance.now();

    // translate the layout $position to drag-oriented co-ordinates, ignoring splitters
    _measurements = BoxModel.measure(layoutModel);
    var end = window.performance.now();

    console.log(`initDrag taking measurements took ${end - start} ms dragContainer version ${_dragContainer.$version}`);

    var { type, $path } = _dragContainer;

    var dragZone = _measurements[$path];

    _dragState = new DragState(dragZone, evt.clientX, evt.clientY, dragRect);

    var pctX = Math.round(_dragState.x.mousePct * 100);
    var pctY = Math.round(_dragState.y.mousePct * 100);

    if (type === 'Surface') {

        _simpleDrag = true;

        return {};

    } else {

        _simpleDrag = false;

        _dropTargetRenderer.prepare(dragZone);

        return {
            transform: `scale(${SCALE_FACTOR},${SCALE_FACTOR})`,
            transformOrigin: pctX + "% " + pctY + "%"
        };
    }
}

function dragMousemoveHandler(evt) {

    const x = evt.clientX;
    const y = evt.clientY;
    const dragState = _dragState;
    var currentDropTarget = _dropTarget;
    var dropTarget;

    var newX, newY;

    if (dragState.update('x', x)) {
        newX = dragState.x.pos;
    }

    if (dragState.update('y', y)) {
        newY = dragState.y.pos;
    }

    if ((newX === undefined) && (newY === undefined)) {
        //onsole.log('both x and y are unchanged');
    } else {
        _dragCallback.drag(newX, newY);
    }

    if (_simpleDrag) {
        return;
    }

    if (dragState.inBounds()) {
        dropTarget = identifyDropTarget(x, y, _dragContainer, _measurements);
    } else {
        dropTarget = identifyDropTarget(dragState.dropX(), dragState.dropY(), _dragContainer, _measurements);
    }

    // did we have an existing droptarget which is no longer such ...
    if (currentDropTarget) {
        if (dropTarget == null || dropTarget.box !== currentDropTarget.box) {
            _dropTarget = null;
        }
    }

    if (dropTarget) {
        _dropTargetRenderer.draw(dropTarget, x, y);
        _dropTarget = dropTarget;
    }
}

function dragMouseupHandler(evt) {
    onDragEnd(evt);
}

function onDragEnd() {
    if (_dropTarget) {
        // why wouldn't the active dropTarget be the hover target - IT ISNT
        const dropTarget = _dropTargetRenderer.hoverDropTarget || DropTarget.getActiveDropTarget(_dropTarget);

        // looking into eliminating this call altogether. We don't need it if we set the dragging index via
        // top-level layout state

        _dragCallback.drop(dropTarget, _measurements);

        _dropTarget = null;
    }
    else {
        _dragCallback.drop({ component: _dragContainer, pos: { position: Position.Absolute } });
    }

    _dragCallback = null;
    _dragContainer = null;
    _dropTargetRenderer.clear();

    window.removeEventListener('mousemove', dragMousemoveHandler, false);
    window.removeEventListener('mouseup', dragMouseupHandler, false);

}