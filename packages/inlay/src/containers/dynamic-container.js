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

        var { layoutModel: { $version }, onLayout } = this.props;

        if ($version === 1 && this.props.children) {
            // WHAT wa sthis for ?
            return super.renderChild(layoutModel, idx);
        }

        var props = {
            layoutModel,
            onLayout
        }

        props.key = props.id = layoutModel.$id;

        if (isLayout(layoutModel.type)) {
            return renderDynamicLayout(this, props, layoutModel);
        } else {
            return <LayoutItem {...props} layout={layoutModel}>{renderDynamicLayout(this, props, layoutModel)}</LayoutItem>;
        }
    }

    getState() {
        return {
            dragging: -1
        };
    }

    drop(component, dropTarget) {

        this.setState({
            dragging: -1,
            tempDimensions: undefined
        });
    }
}

DynamicContainer.displayName = 'DynamicContainer';
DynamicContainer.defaultProps = {
    style: { flex: 1 },
    config: {}
};


registerClass('DynamicContainer', DynamicContainer, true);
