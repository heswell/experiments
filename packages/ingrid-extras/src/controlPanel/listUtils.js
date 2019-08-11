import {spring} from 'react-motion';

export const springConfig = {stiffness: 300, damping: 50};
export const springConfigFast = {stiffness: 1000, damping: 100};

export function listStyle(scale, shadow, x, y, w){
    
    scale = spring(scale, springConfig);
    shadow = spring(shadow, springConfig);

    if (w === undefined){
        return { scale, shadow, x, y};
    }
    else {
        return { scale, shadow, x, y, w };
    }
    
}

export function checkLayout(listState, listEl){
    const {top, left, right, bottom} = listEl.getBoundingClientRect();
    const {rect:r} = listState;    
    if (r !== null && r.top === top && r.left === left && r.right === right && r.bottom === bottom){
        return listState;
    }
    else {
        return {...listState, rect:{top,left,bottom,right}};
    }
}

export function dragOffsets({rect}, {left,top}, dragStartLeft, dragStartTop){
    return {
        dragOffsetX: left - rect.left + (rect.left - dragStartLeft),
        dragOffsetY: top - rect.top + (rect.top - dragStartTop)
    };
}

export function moveItemWithinList(item, list, targetPosition){
    let idx = list.items.indexOf(item);
    if (idx !== -1 && idx !== targetPosition && list.items.length > 1){
        const items = list.items.filter(i => i !== item);
        items.splice(targetPosition,0,item);

        return {...list, items};
    }
    else {
        return list;
    }
}

