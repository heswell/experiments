import React, { Component } from 'react'
import './componentPalette.css';
const UUID = require('pure-uuid');

class ComponentIcon extends Component {

    render() {
        var { color, text, onMouseDown } = this.props;
        return (
            <div className='ComponentIcon' onMouseDown={onMouseDown}
                style={{ backgroundColor: color }}>
                <span>{text}</span>
                {this.props.children}
            </div>
        );
    }
}

export default class ComponentPalette extends React.Component {

    static defaultProps = {
        components: [
            { type: 'Component', title: 'Blue Monday', style: { backgroundColor: 'blue', flex: 1 }, header: true, resizeable: true, iconColor: 'blue' },
            { type: 'Component', title: 'Ivory Tower', style: { backgroundColor: 'ivory', flex: 1 }, header: true, iconColor: 'ivory', resizeable: true },
            { type: 'Component', title: 'Ketchup', style: { backgroundColor: 'tomato', flex: 1 }, resizeable: true, iconColor: 'tomato' },
            { type: 'Component', title: 'Army Drill', style: { backgroundColor: 'khaki', flex: 1 }, resizeable: true, iconColor: 'khaki' },
            { type: 'Component', title: 'Brown Study', style: { backgroundColor: 'brown', flex: 1 }, resizeable: true, iconColor: 'brown' },
            { type: 'Component', title: 'Corn Fields', style: { backgroundColor: 'cornflowerblue', flex: 1 }, resizeable: true, iconColor: 'cornflowerblue' }
        ]
    };

    render() {

        return (
            <div className='ComponentPalette'>
                {this.props.components.map((component, idx) =>
                    <ComponentIcon
                        ref={idx}
                        key={idx}
                        idx={idx}
                        text={component.title}
                        color={component.iconColor || '#ccc'}
                        component={component}
                        draggable={true}
                        container={this}
                        onMouseDown={this.handleMouseDown.bind(this, idx)}>

                    </ComponentIcon>
                )}
            </div>
        );
    }

    handleMouseDown = (idx, evt) => {

        var component = this.props.components[idx];

        var position = evt.currentTarget.getBoundingClientRect();

        this.props.onLayout('drag-start', {
            instructions: { DoNotRemove: true, DoNotTransform: true },
            model: {...component, $id: new UUID(1)},
            position,
            evt
        });
    }

    drop(icon) {
        //onsole.log('ComponentPalette.drop');
        var releaseSpace = true;
        //this.props.onLayout('drop', {component:this.refs.component, dropTarget, releaseSpace});
        // initialize the config for the new component 
        var { component, layout } = icon.props;
        var { children, container, dragContainer, dragging, draggingSibling,
            onConfigChange, onLayout, onMeasure, ...rest } = component.props;


        var config = {};
        config[layout.id] = rest;
        this.props.onMeasure(null, config);

        var idx = this.state.dragging;
        var layouts = this.state.layout.slice();
        layouts[idx] = LayoutModel({ type: 'Component' })

        this.setState({ dragging: -1, dragX: 0, dragY: 0, layout: layouts });


    }

    getDragPermission(draggee) {
        return { x: true, y: true }
    }


}
