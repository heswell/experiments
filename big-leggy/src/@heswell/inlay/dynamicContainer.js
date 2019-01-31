import React from 'react';
import Container, {isLayout} from './container';
import { DragContainer } from './draggable';
import LayoutItem from './layoutItem';
import { renderDynamicLayout } from './util/componentFromLayout';
import { registerClass } from './componentRegistry';

export default class DynamicContainer extends Container {

    static defaultProps = {
        style: { flex: 1 },
        config: {}
    };

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
            return this.renderFromLayout(this, props, layoutModel);
        } else {
            return <LayoutItem {...props} layout={layoutModel}>{this.renderFromLayout(this, props, layoutModel)}</LayoutItem>;
        }
    }

    getState() {
        return {
            dragging: -1
        };
    }

    // not currently called from FlexBox, but might need to be
    // routinely called by top-level Container of Application
    renderFromLayout(element, props, layout) {
        return renderDynamicLayout(element, props, layout);
    }

    getLayoutModelChildren() {
        if (this.props.contentModel) {
            return [this.props.contentModel];
        } else {
            return super.getLayoutModelChildren();
        }
    }

    drop(component, dropTarget) {

        this.setState({
            dragging: -1,
            tempDimensions: undefined
        });
    }
}

DynamicContainer.displayName = 'DynamicContainer';

registerClass('DynamicContainer', DynamicContainer, true);
