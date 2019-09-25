import React from 'react';
import { PopupService } from '@heswell/ui-controls';
import DropMenu, {computeMenuPosition} from './drop-menu/drop-menu.jsx'
import {isTabstrip} from '../../model/drop-target';

import {select} from 'd3-selection';
import 'd3-transition';

import './drop-target-renderer.css';

let _dropTarget = null;
let _multiDropOptions = false;
let _hoverDropTarget = null;
let _currentTabIndex = -1;
let _shiftedTab = null;

const onHoverDropTarget = dropTarget => _hoverDropTarget = dropTarget;

function insertSVGRoot(){
    const root = document.getElementById('root');
    const container = document.createElement('div');
    container.id = 'drag-canvas';
    container.innerHTML = '<svg width="100%" height="100%"></svg>';
    document.body.insertBefore(container, root);
}

const drawTabPath = ([l,t,w,h,tl=0,tw=0,th=0]) =>
    `M${l},${t+th}l${tl},0l0,-${th}l${tw},0l0,${th}l${w-(tl+tw)},0l0,${h-th}l-${w},0l0,-${h-th}`;

export default class DropTargetCanvas {

    constructor() {
        insertSVGRoot();
    }

    prepare(position) {
        // don't do this on body
        document.body.classList.add("drawing");
    };


    clear() {
        // don't do this on body
        _hoverDropTarget = null;
        clearShiftedTab();
        document.body.classList.remove("drawing");
        PopupService.hidePopup();
    }

    get hoverDropTarget() {
        return _hoverDropTarget;
    }

    draw(dropTarget) {
        const sameDropTarget = _dropTarget !== null &&
            !isTabstrip(dropTarget) &&
            _dropTarget.component === dropTarget.component &&
            _dropTarget.pos.position === dropTarget.pos.position &&
            _dropTarget.pos.closeToTheEdge === dropTarget.pos.closeToTheEdge;

        const wasMultiDrop = _multiDropOptions;

        if (_hoverDropTarget !== null) {
            this.drawTargetSVG(_hoverDropTarget);
        } else {

            if (sameDropTarget === false) {
                _dropTarget = dropTarget;
                _multiDropOptions = dropTarget.nextDropTarget != null;
                if (isTabstrip(dropTarget)){
                    moveExistingTabs(dropTarget)
                } else {
                    clearShiftedTab();
                }
                this.drawTargetSVG(dropTarget);
            }
    
            if (_multiDropOptions) {
                const [left,top] = computeMenuPosition(dropTarget);
                if (!wasMultiDrop || !sameDropTarget) {
                    const component = <DropMenu dropTarget={dropTarget} onHover={onHoverDropTarget}/>;
                    PopupService.showPopup({
                        left, 
                        top, 
                        component
                    });
    
                } else {
                    PopupService.movePopupTo(left,top);
                }
            } else {
                PopupService.hidePopup();
            }
    
        }

    }

    drawTargetSVG(dropTarget, offsetTop = 0, offsetLeft = 0) {

        const lineWidth = 6;

        const targetRect =  dropTarget.pos.tab
            ? dropTarget.targetTabRect(lineWidth, offsetTop, offsetLeft)
            : dropTarget.targetRect(lineWidth, offsetTop, offsetLeft);
        
        if (targetRect){
            const [l,t,r,b, tl=0, tw=0, th=0] = targetRect
            const w = r - l;
            const h = b - t;
            const tabLeftOffset = tl === 0
                ? 0 
                : tl - l;
            const data = [l,t,w,h,tabLeftOffset,tw,th]  
    
            const svg = select('#drag-canvas > svg')
            const path = svg.selectAll("path.drop-target")
                .data([data])
    
            const d = drawTabPath(data);
    
            path.transition().duration(200)
                .attr('d', d)
    
            path.enter().append("path")
                .attr("class", "drop-target")
                .style("stroke", "blue")
                .style("fill", "transparent")
                .style("stroke-width", 4)
                .attr('d', d)
    
        }
    }
}

function moveExistingTabs(dropTarget){
    const rect = dropTarget.clientRect;
    const { tabs } = rect;
    const tabCount = tabs ? tabs.length : 0;
    _currentTabIndex = dropTarget.pos.tab.index;

    if (_currentTabIndex > -1 && _currentTabIndex < tabCount) {
        const $id = dropTarget.component.$id;
        const selector = `:scope > .Tabstrip > .tabstrip-inner-sleeve > .tabstrip-inner > .Tab:nth-child(${_currentTabIndex + 1})`;
        const tabEl = document.getElementById($id).querySelector(selector);
        if (tabEl && tabEl !== _shiftedTab) {
            if (_shiftedTab) {
                _shiftedTab.style.cssText = '';
            }
            tabEl.style.cssText = 'transition:margin-left .4s ease-out;margin-left: 63px';
            _shiftedTab = tabEl;
        }
    } else {
        clearShiftedTab();
    }
}

function clearShiftedTab(){
    if (_shiftedTab){
        _shiftedTab.style.cssText = '';
        _shiftedTab = null;
    }
}
