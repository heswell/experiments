import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import Splitter from '../components/splitter';
import LayoutItem from './layout-item';
import ComponentHeader from '../component/component-header.jsx';
import Container from './container';
import { registerClass, isLayout, typeOf } from '../component-registry';
import {
    handleLayout as handleModelLayout,
    layout as applyLayout,
    layoutStyleDiff
} from '../model/index';
import { componentFromLayout } from '../util/component-from-layout-json';

const NO_STYLE = {}

const getManagedDimension = style => style.flexDirection === 'column' ? 'height' : 'width';

export default class FlexBox extends Container {

    render() {

        var { title } = this.props;
        var { type, header, computedStyle } = this.state.layoutModel;

        const className = cx(type);

        return (
            <div className={className} style={computedStyle}>
                {header &&
                     <ComponentHeader
                         title={`${title}`}
                         onMouseDown={e => this.handleMouseDown(e)}
                         style={header.style}
                         menu={header.menu} />
                }
                {this.renderFlexibleChildren()}
            </div>
        );
    }

    renderFlexibleChildren() {

        const { style: { flexDirection }, visibility } = this.props;
        const {layoutModel} = this.state;

        var {children: layoutChildren} = layoutModel;
        const propChildren = Array.isArray(this.props.children)
            ? this.props.children.filter(child => child)
            : [this.props.children];

        var results = [];

        for (var idx = 0, childIdx = 0; idx < layoutChildren.length; idx++) {

            var childLayoutModel = layoutChildren[idx];

            if (childLayoutModel.type === 'Splitter') {

                results.push(
                    <Splitter
                        key={'splitter-' + childIdx}
                        idx={childIdx}
                        absIdx={idx}
                        direction={flexDirection === 'column' ? 'vertical' : 'horizontal'}
                        onDragStart={this.splitterDragStart.bind(this)}
                        onDrag={this.splitterMoved.bind(this)}
                        onDragEnd={() => this.handleSplitterDragEnd()}
                        onLayout={this.handleLayout}
                        layoutModel={childLayoutModel} />
                );

            } else {
                const child = typeOf(propChildren[childIdx]) === childLayoutModel.type
                    ? propChildren[childIdx]
                    : componentFromLayout(childLayoutModel);

                var { style = {}, ...childProps } = child.props;
                var id = childLayoutModel.$id;

                var props = {
                    id,
                    key: id,
                    idx: childIdx,
                    absIdx: idx,
                    onLayout: this.handleLayout,
                    onConfigChange: this.handleConfigChange.bind(this),
                    layoutModel: childLayoutModel
                };

                style = { ...style, visibility };

                if (props.dragContainer === true && child.type.displayName !== 'Container') {
                    //onsole.log(`FlexBox wrapping ${child.type.displayName} with Container `);
                    const { width, height } = props.layoutModel.$position; // IS HTIS RIGHT ?
                    results.push(<Container {...childProps} {...props} style={{ flex: style.flex, width, height, visibility }} >{child}</Container>);
                } else if (isLayout(child)) {
                    results.push(React.cloneElement(child, { ...props, style }));
                } else {
                    results.push(<LayoutItem {...childProps} {...props} style={style}>{child}</LayoutItem>);
                }

                childIdx += 1;

            }
        }

        return results;

    }

    componentWillReceiveProps(nextProps) {
        var { layoutModel } = nextProps;
        if (layoutModel && layoutModel !== this.state.layoutModel) {
            this.setState({ layoutModel });
        } else if (this.state.layoutModel.$path === '0') {
            // detact changes to style that will affect layout
            if (layoutStyleDiff(this.props.style, nextProps.style)) {
                const {width, height} = nextProps.style
                const VISIBLE = nextProps.style.visibility || 'visible';
                const FORCE_LAYOUT = true;
                this.setState({
                    layoutModel: applyLayout(
                        {
                            ...this.state.layoutModel,
                            style: nextProps.style
                        },
                        { width, height },
                        this.state.layoutModel.$path,
                        VISIBLE,
                        FORCE_LAYOUT)
                });
            }

        }
    }

    // copied from layoutItem
    handleMouseDown(e){
        if (this.props.onMouseDown) {
            this.props.onMouseDown({
                model: this.props.layoutModel,
                evt: e,
                position: ReactDOM.findDOMNode(this).getBoundingClientRect()
            });
        } else if (this.props.onLayout){
            this.props.onLayout('drag-start', {
                model: this.state.layoutModel,
                evt: e,
                position: ReactDOM.findDOMNode(this).getBoundingClientRect()
            });
        }
    }

    splitterDragStart(idx) {
        this.splitChildren = this.identifySplitChildren(idx);
    }

    splitterMoved(distance) {
        const {layoutModel} = this.state;
        const [idx1, , idx2] = this.splitChildren;
        const dim = getManagedDimension(layoutModel.style);
        const measurements = layoutModel.children.map(child => child.computedStyle[dim]);
        measurements[idx1] += distance;
        measurements[idx2] -= distance;
        var options = {
            dim,
            path: layoutModel.$path,
            measurements
        };
        this.setState({ layoutModel: handleModelLayout(layoutModel, 'splitter-resize', options) });
    }

    identifySplitChildren(splitterIdx){
        const children = this.state.layoutModel.children;
        let idx1 = splitterIdx - 1;
        let idx2 = splitterIdx + 1;
        let child;
        while ((child = children[idx1]) && !child.resizeable) idx1--;
        while ((child = children[idx2]) && !child.resizeable) idx2++;
        return [idx1, splitterIdx, idx2];
    }

    handleSplitterDragEnd(){
        this.handleLayout('replace', { model: this.state.layoutModel });
        this.splitChildren = null;
    }

    handleConfigChange(component, { fixed }) {
        if (fixed !== 'undefined') {
            //TODO we don't need to do this if it has been done already
            this.props.onLayout('config-change', {
                dimensions: this.assignExplicitSizeToFlexElements(),
                fixed,
                component: component.props.json,
                container: this.props.json
            });
        }
    }

}

FlexBox.displayName = 'FlexBox';
FlexBox.defaultProps = {
    style: { flexDirection: 'column' }
};


registerClass('FlexBox', FlexBox, true);
