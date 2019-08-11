import React from 'react';
import cx from 'classnames';
import LayoutItem from './layout-item';

export default function DragSurface(props) {

    var { style, children: child, x, y } = props;

    var draggedComponent = null;
    var visibility = child ? 'visible' : 'hidden';

    if (child) {

        let { style: childStyle/*, ...rest */} = child.props;

        var layoutModel = child.props.layoutModel;

        let childProps = {
            key: layoutModel.$id,
            layoutModel
        };

        childStyle = { // ...rest ?
            ...childStyle,
            borderWidth: 3,
            borderStyle: 'solid',
            borderColor: '#ccc',
            boxSizing: 'content-box'
        };

        if (y !== undefined && x !== undefined) {

            childProps.layoutModel = {
                ...layoutModel,
                layout: { ...layoutModel.layout, top: y, left: x }
            }
        }

        draggedComponent =
            <LayoutItem {...childProps} style={childStyle}>
                {child}
            </LayoutItem>;

    }

    var className = cx(
        'DragSurface',
        'rect-layout',
        'rect-container',
        'Surface',
        props.className);

    return (
        <div className={className} style={{ ...style, visibility }}>
            {draggedComponent}
        </div>
    );

}
