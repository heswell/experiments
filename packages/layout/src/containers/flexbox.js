import React, { useEffect, useRef } from 'react';
import cx from 'classnames';
// import rootWrapper from './layout-root-wrapper';
import Splitter from '../components/splitter';
import LayoutItem from './layout-item';
import useLayout from './layout-hook';
import ComponentHeader from '../component/component-header.jsx';
import { registerType, isLayout, typeOf } from '../component-registry';
import { componentFromLayout } from '../util/component-from-layout-json';
import { Action } from '../model/layout-reducer';
import { getManagedDimension } from '../model/layout-json'; 
import {DragContainer} from '../drag-drop/draggable.js';

/** @type {FlexboxComponent} */
const FlexBox = function FlexBox(props){
    const [layoutModel, dispatch] = useLayout({ layoutType: "FlexBox", props }/*, inheritedLayout*/);
    const splitChildren = useRef(null);

    useEffect(() => {
        if (props.dropTarget){
            DragContainer.register(layoutModel.$path);
        }
    },[]);

    // onsole.log(`%cFlexBox render ${layoutModel.$path}`,'color: blue; font-weight: bold;')
    // console.log(`%cmodel = ${JSON.stringify(model,null,2)}`,'color: blue; font-weight: bold;')

    const splitterDragStart = (idx) => identifySplitChildren(idx);

    const splitterMoved = distance => {
        const [idx1, , idx2] = splitChildren.current;
        const [dim] = getManagedDimension(layoutModel.style);
        const measurements = layoutModel.children.map(child => child.computedStyle[dim]);
        measurements[idx1] += distance;
        measurements[idx2] -= distance;
        // Why pass $path separately - assume there is a reason for now
        dispatch({type: Action.SPLITTER_RESIZE, layoutModel, dim, path: layoutModel.$path, measurements})
    }

    const splitterDragEnd = () => splitChildren.current = null; 

    const identifySplitChildren = splitterIdx => {
        const children = layoutModel.children;
        let idx1 = splitterIdx - 1;
        let idx2 = splitterIdx + 1;
        let child;
        while ((child = children[idx1]) && !child.resizeable) idx1--;
        while ((child = children[idx2]) && !child.resizeable) idx2++;
        splitChildren.current =  [idx1, splitterIdx, idx2];
    }
    
    if (layoutModel === null){

        return null;

    } else {
            const { type, title, header, computedStyle } = layoutModel;
            const className = cx(type, props.className);
            return ( 
                <div className={className} style={computedStyle}>
                    {header &&
                        <ComponentHeader
                            title={`${title}`}
                            onMouseDown={e => this.handleMouseDown(e)}
                            style={header.style}
                            menu={header.menu} />
                    }
                    {renderChildren()}
                </div>
            );
    }

    function renderChildren(){

        const { style: { flexDirection }, children: layoutChildren, visibility } = layoutModel;

        const propChildren = Array.isArray(props.children)
            ? props.children.filter(child => child)
            : [props.children];

        const results = [];

        for (var idx = 0, childIdx = 0; idx < layoutChildren.length; idx++) {

            var childLayoutModel = layoutChildren[idx];

            if (childLayoutModel.type === 'Splitter') {

                results.push(
                    <Splitter
                        key={'splitter-' + childIdx}
                        idx={childIdx}
                        absIdx={idx}
                        direction={flexDirection === 'column' ? 'vertical' : 'horizontal'}
                        onDragStart={splitterDragStart}
                        onDrag={splitterMoved}
                        onDragEnd={splitterDragEnd}
                        layoutModel={childLayoutModel} />
                );

            } else {
                const child = typeOf(propChildren[childIdx]) === childLayoutModel.type
                    ? propChildren[childIdx]
                    : componentFromLayout(childLayoutModel);

                const layoutProps = {
                    key: childLayoutModel.$id,
                    idx: childIdx,
                    absIdx: idx,
                    layoutModel: childLayoutModel,
                    dispatch
                };

                if (isLayout(child)) {
                    results.push(React.cloneElement(child, { ...layoutProps }));
                } else {
                    const {style, ...childProps} = child.props;
                    results.push(<LayoutItem {...childProps} {...layoutProps}>{child}</LayoutItem>);
                }
                childIdx += 1;
            }
        }
        return results;
    }
}
export default FlexBox;

// needs to be registerComponent
registerType('FlexBox', FlexBox, true);
