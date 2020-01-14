import React from 'react';
import cx from 'classnames';
import { LayoutRoot } from './layout-root';
import LayoutItem from './layout-item';
import { registerClass, isLayout, typeOf } from '../component-registry';
import { componentFromLayout } from '../util/component-from-layout-json';

const PureLayout = React.memo(DynamicContainer);
PureLayout.displayName = 'DynamicContainer';

export default function DynamicContainer(props) {
    // const prevProps = useRef(props);
    // if (Object.keys(props).some(key => props[key] !== prevProps.current[key])){
    //     const diffs = Object.keys(props).filter(key => props[key] !== prevProps.current[key]);
    //     console.log(`root ${props.root} changed keys ${diffs.join(',')}`);
    //     prevProps.current = props;
    // }
    const { layoutModel, dispatch } = props;
    // We must allow for a layoutModel being passed in via props even when we are acting as root
    if (props.root || layoutModel === undefined) {
        const { root, ...rest } = props;
        return (
            <LayoutRoot><PureLayout {...rest} /></LayoutRoot>
        )
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

    function renderChild() {
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
            const { style, ...childProps } = child.props;
            return (<LayoutItem {...childProps} {...layoutProps}>{child}</LayoutItem>);
        }
    }

}

registerClass('DynamicContainer', DynamicContainer, true);
