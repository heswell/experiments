import React from 'react';
import Container from './container';
import LayoutItem from './layout-item';
import { DragContainer } from '../drag-drop/draggable';
import { renderDynamicLayout } from '../util/component-from-layout-json';
import { registerClass, isLayout } from '../component-registry';

export default class DynamicContainer extends Container {
    componentDidMount(){
        super.componentDidMount();
        DragContainer.register(this.state.layoutModel.$path);
    }
    renderChild(layoutModel, idx) {
        var { onLayout } = this.props;
        var props = {
            layoutModel,
            onLayout
        };
        props.key = props.id = layoutModel.$id;
        if (isLayout(layoutModel.type)) {
            // this is being called A LOT during drag
            return renderDynamicLayout(this, props, layoutModel);
        } else {
            return <LayoutItem {...props} layout={layoutModel}>{renderDynamicLayout(this, props, layoutModel)}</LayoutItem>;
        }
    }
    getState() {
        return { dragging: -1 };
    }
    drop(component, dropTarget) {
        this.setState({ dragging: -1 });
    }
}
DynamicContainer.displayName = 'DynamicContainer';
DynamicContainer.defaultProps = {
    style: { flex: 1 }
};
registerClass('DynamicContainer', DynamicContainer, true);
