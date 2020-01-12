import React from 'react';
import cx from 'classnames';

import LayoutItem from './layout-item';
import { registerClass, isLayout, typeOf } from '../component-registry';
import { componentFromLayout } from '../util/component-from-layout-json';

const PureLayout = React.memo(DynamicContainer);
PureLayout.displayName = 'DynamicContainer';

export default function DynamicContainer(props){

    const {layoutModel, dispatch} = props;

    if (layoutModel === undefined){
        return null;
    }

    const { title, header, computedStyle } = layoutModel;
    const className = cx("DynamicContainer");

    return (
        <div className={className} style={computedStyle}>
            {header &&
                <ComponentHeader
                    title={`${title}`}
                    onMouseDown={e => this.handleMouseDown(e)}
                    style={header.style}
                    menu={header.menu} />
            }
            {renderChild()}
        </div>
    );

    function renderChild(){
        var [childLayoutModel] = layoutModel.children;

        const propChild = Array.isArray(props.children)
            ? [props.children.filter(child => child)]
            : props.children;

        const child = typeOf(propChild) === childLayoutModel.type
            ? propChild
            : componentFromLayout(childLayoutModel);

        const layoutProps = {
            key: childLayoutModel.$id,
            layoutModel: childLayoutModel,
            dispatch
        };

        if (isLayout(child)) {
            return React.cloneElement(child, { ...layoutProps });
        } else {
            const {style, ...childProps} = child.props;
            return (<LayoutItem {...childProps} {...layoutProps}>{child}</LayoutItem>);
        }
    }

}

registerClass('DynamicContainer', DynamicContainer, true);
