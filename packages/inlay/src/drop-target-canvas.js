import { PopupService } from '@heswell/ui-controls';
import DropMenu from './drop-menu';
import Konva from 'konva';

import './drop-target-canvas.css';

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

    draw(dropTarget, x, y) {
        const SameDropTarget = _dropTarget !== null &&
            !_dropTargetIsTabstrip &&
            _dropTarget.component === dropTarget.component &&
            _dropTarget.pos.position === dropTarget.pos.position &&
            _dropTarget.pos.closeToTheEdge === dropTarget.pos.closeToTheEdge;

        const wasMultiDrop = _multiDropOptions;

        if (_hoverDropTarget !== null) {
            this.drawTarget(_hoverDropTarget, x, y);
        }
        else if (SameDropTarget === false) {

            _dropTarget = dropTarget;
            _currentDropTarget = null;
            _multiDropOptions = dropTarget.nextDropTarget != null;
            this.drawTarget(dropTarget, x, y);

        }

        if (_hoverDropTarget !== null) {


        }
        else if (_multiDropOptions) {

            if (!wasMultiDrop) {
                // onsole.log('show the drop menu');
                _konvaDropMenu.visible(true);
            }

            drawDropOptions(dropTarget, this.t, this.l);
        }
        else if (_konvaDropMenu.visible()) {
            // onsole.log('clear the drop menu');
            _konvaDropMenu.visible(false);
            _layer.draw();
        }

    }

    drawTarget(dropTarget) {
        const { canvas, w, h, t: offsetTop, l: offsetLeft } = this;

        setWidth(canvas, w, h);

        var ctx = canvas.getContext('2d');

        if (_currentDropTarget) {
            _currentDropTarget.active = false;
        }

        _currentDropTarget = dropTarget;
        dropTarget.active = true;

        if (dropTarget.pos.tab) {
            // this is wrong, only needed because we're manipulating the tabs here
            drawTabbedOutline(ctx, dropTarget,offsetTop, offsetLeft);
        }
        else {
            drawOutline(ctx, dropTarget, offsetTop, offsetLeft);
        }
    }
}

function setWidth(canvas, w, h) {
    canvas.width = w;
    canvas.height = h;
}

function drawOutline(ctx, dropTarget, offsetTop = 0, offsetLeft = 0) {
    const lineWidth = 6;
    const targetRect = dropTarget.targetRect(lineWidth, offsetTop, offsetLeft);
    
    if (targetRect !== null){
        setCanvasStyles(ctx, {
            lineWidth,
            strokeStyle: 'yellow'
        });
        
        ctx.beginPath();
        drawRect(ctx, ...targetRect);
        ctx.closePath();
        ctx.stroke();    
    }
}

function drawTabbedOutline(ctx, dropTarget, offsetTop, offsetLeft) {

    console.log(`drawTabbedOutline ${JSON.stringify(dropTarget.pos.tab)}`)

    const rect = dropTarget.clientRect;
    const { tabs } = rect;
    const tabCount = tabs ? tabs.length : 0;
    _currentTabIndex = dropTarget.pos.tab.index;

    //======================================  START EXPERIMENT
    if (_currentTabIndex > -1 && _currentTabIndex < tabCount) {
        const $id = dropTarget.component.$path;
        const selector = `:scope > .Tabstrip > .tabstrip-inner-sleeve > .tabstrip-inner > .Tab:nth-child(${_currentTabIndex + 1})`;
        const tabEl = document.getElementById($id).querySelector(selector);
        if (tabEl && tabEl !== _shiftedTab) {
            if (_shiftedTab) {
                _shiftedTab.style.cssText = '';
            }
            tabEl.style.cssText = 'transition:margin-left .4s ease-out;margin-left: 80px';
            _shiftedTab = tabEl;
        }
    } else if (_shiftedTab) {
        _shiftedTab.style.cssText = '';
        _shiftedTab = null;
    }
    //====================================== END EXPERIMENT

    // add a flag to dropTarget
    _dropTargetIsTabstrip = rect.tabs && rect.tabs.length;

    ctx.beginPath();
    var lineWidth = 6;
    setCanvasStyles(ctx, { lineWidth, strokeStyle: 'yellow' });
    const targetTabRect = dropTarget.targetTabRect(lineWidth, offsetTop, offsetLeft);
    drawTab(ctx, ...targetTabRect);
    ctx.stroke();

}

function drawTab(ctx, left, top, right, bottom, tabLeft, tabWidth, tabHeight) {

    const tabRight = tabLeft + tabWidth;

    ctx.lineJoin = 'round';
    ctx.beginPath();

    ctx.moveTo(left, top + tabHeight);
    ctx.lineTo(tabLeft, top + tabHeight);
    ctx.lineTo(tabLeft, top);
    ctx.lineTo(tabRight, top);
    ctx.lineTo(tabRight, top+tabHeight);
    ctx.lineTo(right, top+tabHeight);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
    ctx.lineTo(left, top+tabHeight);

    ctx.closePath();
    ctx.stroke();

}

function drawDropOptions(dropTarget, offsetTop, offsetLeft) {
    _konvaDropMenu.computeMenuPosition(dropTarget, offsetTop, offsetLeft);
    _layer.draw();
}

function setCanvasStyles(ctx, styles) {
    ctx.strokeStyle = styles.strokeStyle || 'black';
    ctx.lineWidth = styles.lineWidth || 2;
    ctx.fillStyle = styles.fillStyle || 'rgba(255,0,0,.5)';
}

function drawRect(ctx, x1, y1, x2, y2) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x1, y2);
}


