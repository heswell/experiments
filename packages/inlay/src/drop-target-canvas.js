import { Position } from './model/index';
import { PopupService } from '@heswell/ui-controls';
import DropMenu from './drop-menu';
import Konva from 'konva';

import './drop-target-canvas.css';

const NORTH = Position.North;
const SOUTH = Position.South;
const EAST = Position.East;
const WEST = Position.West;
const HEADER = Position.Header;

let _dropTarget = null;
let _multiDropOptions = false;
let _currentDropTarget;
let _dropMenu = false;
let _stage;
let _layer;
let _konvaDropMenu;
let _hoverDropTarget = null;
let _dropTargetIsTabstrip = false;
let _currentTabIndex = -1;
let _shiftedTab = null;

export default class DropTargetCanvas {

    constructor() {
        const canvas = document.createElement('canvas');
        canvas.className = 'fullscreen';
        let container = document.getElementById('thecanvas');
        let sketchpad;

        if (!container) {
            const root = document.getElementById('root');
            container = document.createElement('div');
            container.id = 'thecanvas';
            document.body.insertBefore(container, root);

            sketchpad = document.createElement('div');
            sketchpad.id = 'sketchpad';
            this.sketchpad = sketchpad;
            document.body.insertBefore(sketchpad, root);
        }

        container.appendChild(canvas);

        this.canvas = canvas;

        this.t = 0;
        this.l = 0;
        this.w = document.body.clientWidth;
        this.h = document.body.clientHeight;

        window.addEventListener('resize', () => {
            this.w = document.body.clientWidth;
            this.h = document.body.clientHeight;
        });

        _stage = new Konva.Stage({
            container: 'sketchpad',   // id of container <div>
            width: this.w,
            height: this.h
        });
        //then create layer
        _layer = new Konva.Layer();

        _konvaDropMenu = new DropMenu({
            layer: _layer,
            hover: dropTarget => _hoverDropTarget = dropTarget
        });

        _stage.add(_layer);

    }

    prepare(position) {
        if (position) {
            const { left: l, top: t, right: r, bottom: b } = position;
            const w = r - l;
            const h = b - t;
            this.t = t;
            this.l = l;
            this.w = w;
            this.h = h;
            const cssText = `top:${t}px;left:${l}px;width:${w}px;height:${h}px;z-index:100`;
            this.canvas.style.cssText = cssText;
            this.sketchpad.style.cssText = cssText;

            _stage.setWidth(w);
            _stage.setHeight(h);

        }
        this.canvas.classList.add("ready");
        document.body.classList.add("drawing");
        _currentDropTarget = null;

    };


    clear() {
        document.body.classList.remove("drawing");
        this.canvas.classList.remove("ready");
        if (_dropMenu) {
            PopupService.hidePopup();
            _dropMenu = false;
        }
    }

    get hoverDropTarget() {
        return _hoverDropTarget;
    }

    get dropTargetIsTabstrip() {
        return _dropTargetIsTabstrip;
    }

    get currentTabIndex() {
        return _currentTabIndex;
    }

    draw(dropTarget, measurements, x, y) {
        const SameDropTarget = _dropTarget !== null &&
            !_dropTargetIsTabstrip &&
            _dropTarget.component === dropTarget.component &&
            _dropTarget.pos.position === dropTarget.pos.position &&
            _dropTarget.pos.closeToTheEdge === dropTarget.pos.closeToTheEdge;

        const wasMultiDrop = _multiDropOptions;

        if (_hoverDropTarget !== null) {
            this.drawTarget(_hoverDropTarget, measurements, x, y);
        }
        else if (SameDropTarget === false) {

            _dropTarget = dropTarget;
            _currentDropTarget = null;
            _multiDropOptions = dropTarget.nextDropTarget != null;

            //onsole.log('draw, _multiDropOptions = ' + _multiDropOptions);

            // if (_dropMenu){
            //     PopupService.hidePopup();
            //     _dropMenu = false;
            // }

            this.drawTarget(dropTarget, measurements, x, y);

        }

        if (_hoverDropTarget !== null) {


        }
        else if (_multiDropOptions) {

            if (!wasMultiDrop) {
                // onsole.log('show the drop menu');
                _konvaDropMenu.visible(true);
            }

            drawDropOptions(this.canvas, dropTarget, measurements, this.w, this.h, this.t, this.l);
        }
        else if (_konvaDropMenu.visible()) {
            // onsole.log('clear the drop menu');
            _konvaDropMenu.visible(false);
            _layer.draw();
        }

    }

    drawTarget(dropTarget, measurements, x, y) {
        const { canvas, w, h, t: offsetTop, l: offsetLeft } = this;

        setWidth(canvas, w, h);

        var ctx = canvas.getContext('2d');

        if (_currentDropTarget) {
            _currentDropTarget.active = false;
        }

        //onsole.log('activate drop target',dropTarget);	    
        _currentDropTarget = dropTarget;
        dropTarget.active = true;

        var rect = measurements[dropTarget.component.$path];
        var header = rect.header || rect.tabstrip;
        var pos = dropTarget.pos;

        if (pos.position === HEADER && header) {
            // this is wrong, only needed because we're manipulating the tabs here
            const $id = dropTarget.component.$path;
            drawTabbedOutline(ctx, rect, w, h, offsetTop, offsetLeft, x, y, $id);
        }
        else {
            drawOutline(ctx, pos, rect, w, h, offsetTop, offsetLeft);
        }
    }
}

function setWidth(canvas, w, h) {
    canvas.width = w;
    canvas.height = h;
}


function drawTabbedOutline(ctx, rect, w, h, offsetTop, offsetLeft, mouseX, mouseY, $id) {

    // This is completely the wrong place to be identifying the target tab, should be done in
    // BoxModel.identifyDropTarget
    const { tabs } = rect;
    const tabCount = tabs ? tabs.length : 0;
    let tab = tabs && tabs.find(({ left, right }) => mouseX >= left && mouseX <= right);
    if (tab) {
        _currentTabIndex = tabs.indexOf(tab);
    } else {
        const lastTab = tabs && tabs[tabs.length - 1];
        if (lastTab) {
            tab = { left: lastTab.right }
            _currentTabIndex = tabs.length;
        } else {
            tab = { left: rect.left };
            _currentTabIndex = -1;
        }
    }

    //====================================== EXPERIMENT
    if (_currentTabIndex > -1 && _currentTabIndex < tabCount) {
        const selector = `:scope > .Tabstrip > .tabstrip-inner-sleeve > .tabstrip-inner > .Tab:nth-child(${_currentTabIndex + 1})`;
        const tab = document.getElementById($id).querySelector(selector);
        if (tab && tab !== _shiftedTab) {
            if (_shiftedTab) {
                _shiftedTab.style.cssText = '';
            }
            tab.style.cssText = 'transition:margin-left .4s ease-out;margin-left: 80px';
            _shiftedTab = tab;
        }
    } else if (_shiftedTab) {
        _shiftedTab.style.cssText = '';
        _shiftedTab = null;

    }

    //====================================== EXPERIMENT

    _dropTargetIsTabstrip = rect.tabs && rect.tabs.length;

    var header = rect.header;

    var t = Math.round(header.top - offsetTop),
        l = /*header.name === 'Tabstrip' ? Math.round(header.tabRight) :*/ Math.round(header.left - offsetLeft),
        r = Math.round(header.right - offsetLeft),
        b = Math.round(header.bottom - offsetTop),
        tabLeft = Math.round(tab.left - offsetLeft),
        tabRight = Math.round(tab.left + 60 - offsetLeft);

    ctx.beginPath();

    var lineWidth = 6;
    var inset = 0;
    // var headOffset = (header.top - rect.top) + header.height;

    var gap = Math.round(lineWidth / 2) + inset;
    var { top, left, right, bottom } = rect;

    setCanvasStyles(ctx, { lineWidth: lineWidth, strokeStyle: 'yellow' });
    drawTab(ctx, l + gap, t + gap, r, b, top, left - offsetLeft + gap, right - offsetLeft - gap, bottom - offsetTop - gap, tabLeft, tabRight);

    ctx.stroke();

}

function drawTab(ctx, l, t, r, b, top, left, right, bottom, tabLeft, tabRight) {

    var radius = 6;

    // var x = l;
    var y = t + 3;
    // var width = 100;
    var height = b - t;
    var fill = false;
    var stroke = true;

    ctx.lineJoin = 'round';
    ctx.beginPath();

    ctx.moveTo(tabLeft + radius, y);
    ctx.lineTo(tabRight - radius, y);
    ctx.quadraticCurveTo(tabRight, y, tabRight, y + radius);
    ctx.lineTo(tabRight, y + height);
    ctx.lineTo(right, y + height);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
    ctx.lineTo(left, y + height);
    ctx.lineTo(tabLeft, y + height);
    ctx.lineTo(tabLeft, y + radius);
    ctx.quadraticCurveTo(tabLeft, y, tabLeft + radius, y);


    //   ctx.moveTo(x, y + height);
    //   ctx.lineTo(x, y + radius);
    //   ctx.quadraticCurveTo(x,y,x + radius, y);
    //   ctx.lineTo(x + width - radius, y);
    //   ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    //   ctx.lineTo(x + width, y + height);

    //   ctx.lineTo(right, y + height);
    //   ctx.lineTo(right, bottom);
    //   ctx.lineTo(left, bottom);
    //   ctx.lineTo(left, y+height);


    ctx.closePath();

    if (stroke) {
        ctx.stroke();
    }
    if (fill) {
        ctx.fill();
    }

}

function drawOutline(ctx, pos, rect, w, h, offsetTop = 0, offsetLeft = 0) {

    var targetPosition = pos.position;

    var size = null;

    //onsole.log(`layout=${JSON.stringify(layout)}`);

    if (pos.width) {
        size = { width: pos.width }
    }
    else if (pos.height) {
        size = { height: pos.height }
    }

    var t = Math.round(rect.top - offsetTop),
        l = Math.round(rect.left - offsetLeft),
        r = Math.round(rect.right - offsetLeft),
        b = Math.round(rect.bottom - offsetTop);

    var lineWidth = 6;

    setCanvasStyles(ctx, {
        lineWidth: lineWidth,
        strokeStyle: 'yellow'
    });

    ctx.beginPath();

    var inset = 0;
    var gap = Math.round(lineWidth / 2) + inset;

    switch (targetPosition) {

        case NORTH:
        case HEADER:
            var halfHeight = Math.round((b - t) / 2);
            var sizeHeight = (size && size.height) ? size.height : 0;
            var height = sizeHeight ? Math.min(halfHeight, Math.round(sizeHeight)) : halfHeight;
            drawRect(ctx, l + gap, t + gap, r - gap, t + gap + height);
            break;

        case WEST:
            var halfWidth = Math.round((r - l) / 2);
            var sizeWidth = (size && size.width) ? size.width : 0;
            var width = sizeWidth ? Math.min(halfWidth, Math.round(sizeWidth)) : halfWidth;
            drawRect(ctx, l + gap, t + gap, l + gap + width, b - gap);
            break;

        case EAST:
            // var halfWidth = Math.round((r - l) / 2);
            // var sizeWidth = (size && size.width) ? size.width : 0;
            // var width = sizeWidth ? Math.min(halfWidth, Math.round(sizeWidth)) : halfWidth;
            drawRect(ctx, (r - gap) - width, t + gap, r - gap, b - gap);
            break;

        case SOUTH:
            // var halfHeight = Math.round((b - t) / 2);
            // var sizeHeight = (size && size.height) ? size.height : 0;
            // var height = sizeHeight ? Math.min(halfHeight, Math.round(sizeHeight)) : halfHeight;

            drawRect(ctx, l + gap, (b - gap) - height, r - gap, b - gap);
            break;

        default:

            console.log('DropTargetCanvas what are we doing here ?');
    }

    ctx.closePath();
    ctx.stroke();


    // if (dropTarget.pos.closeToTheEdge == dropTarget.pos.position){

    // 	var zone = 30;

    //     ctx.beginPath();
    //     ctx.fillStyle = 'rgba(0,0,0,.25)';

    //     //TODO if op is 'insert' we may not be at the edge - may be 
    //     // somewhere in middle of a tower or terrace - look at index
    //     var g = 6;

    //     zone = zone - gap;

    //     console.log(_dropTarget.pos.position , dropTarget.pos.position);
    //     switch (_dropTarget.pos.position ){
    //         case NORTH: drawRect(ctx,l+g,t+g,r-g,t+g+zone); break;
    //         case SOUTH: drawRect(ctx,l+g,b-g-zone,r-g,b-g); break;
    //         case EAST: drawRect(ctx,r-g-zone,t+g,r-g,b-g); break;
    //         case WEST: drawRect(ctx,l+g,t+g,l+zone,b-g); break;
    //     }

    //     ctx.closePath();
    //     ctx.fill();

    // }
}

function drawDropOptions(canvas, dropTarget, measurements, w, h, offsetTop, offsetLeft) {

    // PopupService.showPopup({component : (
    //         <DropMenu dropTarget={dropTarget} measurements={measurements}
    //             onMouseOver={handleMouseOver(canvas, measurements, w, h)} /> )});

    // _dropMenu = true;

    _konvaDropMenu.computeMenuPosition(dropTarget, measurements, offsetTop, offsetLeft);

    _layer.draw();

}


// function handleMouseOver(canvas, measurements, w, h) {
//     return function (dropTarget) {
//         draw(canvas, dropTarget, measurements, w, h, 0, 0, true);
//     };
// }


function setCanvasStyles(ctx, styles) {
    ctx.strokeStyle = styles.strokeStyle || 'black';
    ctx.lineWidth = styles.lineWidth || 2;
    ctx.fillStyle = styles.fillStyle || 'rgba(255,0,0,.5)';

    // if (_multiDropOptions){
    // 	ctx.setLineDash([15,10]);
    // }
}

function drawRect(ctx, x1, y1, x2, y2) {

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x1, y2);


}


