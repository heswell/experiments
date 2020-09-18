import React from 'react';
import Component from '../component/component';
import LayoutItem from '../containers/layout-item';
import PlaceHolder from '../components/place-holder/place-holder.jsx';

import { registerType, ComponentRegistry } from '../component-registry';

registerType('PlaceHolder', PlaceHolder);
registerType('LayoutItem', LayoutItem);
registerType('Component', Component);

export function componentFromLayout(layout) {
    // onsole.log(`%ccomponentFromLayout\n${JSON.stringify(layout,null,2)}`,'background-color:ivory;color:brown;')
    return _componentFromLayout(layout);
}

function notSplitterOrLayout(model) {
    return model.type !== 'Splitter' && model.type !== 'layout';
}

function _componentFromLayout(layoutModel) {

    if (Array.isArray(layoutModel)) {
        return layoutModel.map(_componentFromLayout);
    } else if (layoutModel == null) {
        return null
    }

    const { $id, type, props } = layoutModel;
    const [ReactType, reactBuiltIn] = getComponentType(type);

    let children;

    if (type === 'Container') {
        children = null;
    } else {
        children = layoutModel.children && layoutModel.children.length
            ? layoutModel.children.filter(notSplitterOrLayout).map(_componentFromLayout)
            : null;
        if (children && children.length === 1) children = children[0];
    }

    return reactBuiltIn
        ? <ReactType {...props} key={$id}>{children}</ReactType>
        : <ReactType {...props} key={$id} layoutModel={layoutModel}>{children}</ReactType>;
}

function getComponentType(type){
    if (ComponentRegistry[type]){
        return [ComponentRegistry[type], false];
    } else if (type === type.toLowerCase()){
        return [type, true];
    }
    throw Error('componentFromLayout: unknown component type: ' + type)
}
