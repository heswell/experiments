export const DROP = 'DROP';
export const LAYOUT_REMOVE = 'LAYOUT_REMOVE';
export const LAYOUT_REPLACE = 'LAYOUT_REPLACE';
export const LAYOUT_SWITCH_TAB = 'LAYOUT_SWITCH_TAB';
export const LAYOUT_MODEL = 'LAYOUT_MODEL';

export const layoutModel = model => ({
    type : LAYOUT_MODEL,
    layoutModel: model
});


export const drop = (draggedComponent, dropTarget) => ({
    type:DROP,
    draggedComponent,
    dropTarget
});

export const remove = targetNode => ({
    type: LAYOUT_REMOVE,
    targetNode
});

export const replace = (targetNode, replacementNode) => ({
    type:LAYOUT_REPLACE,
    targetNode,
    replacementNode
});

export const switchTab = (path, idx, nextIdx) => ({
    type:LAYOUT_SWITCH_TAB,
    path,
    idx,
    nextIdx
});