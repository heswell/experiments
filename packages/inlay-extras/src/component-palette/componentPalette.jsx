import React, { Component } from 'react'
import './componentPalette.css';
import { uuid } from '@heswell/utils';
import { Action, getLayoutModel, extendLayout } from '@heswell/inlay';

const header = true;
const resizeable = true;

const getDefaultComponents = () => [
    <Component title="Blue Monday" iconColor="blue" style={{backgroundColor: 'blue', flex: 1}} header resizeable />,
    <Component title="Ivory Tower" iconColor="ivory" style={{backgroundColor: 'ivory', flex: 1}} header resizeable />
    // { type: 'Component', props:{title: 'Ketchup', }, style: { backgroundColor: 'tomato', flex: 1 }, resizeable, iconColor: 'tomato' },
    // { type: 'Component', props:{title: 'Army Drill'}, style: { backgroundColor: 'khaki', flex: 1 }, resizeable, iconColor: 'khaki' },
    // { type: 'Component', props:{title: 'Brown Study'}, style: { backgroundColor: 'brown', flex: 1 }, resizeable, iconColor: 'brown' },
    // { type: 'Component', props:{title: 'Corn Fields'}, style: { backgroundColor: 'cornflowerblue', flex: 1 }, resizeable, iconColor: 'cornflowerblue' }
].map(component => extendLayout(getLayoutModel('Component', component.props), null));

const ComponentIcon = ({children, color, idx, text, onMouseDown}) => {
    const handleMouseDown = evt => onMouseDown(evt, idx)
    return (
        <div className='ComponentIcon' onMouseDown={handleMouseDown}
            style={{ backgroundColor: color }}>
            <span>{text}</span>
            {children}
        </div>
    );
}

export default function ComponentPalette({
    components = getDefaultComponents(),
    dispatch
}) {

    function handleMouseDown(evt, idx) {
        console.log(`mouderDown ${idx}`)
        const component = components[idx];
        const dragRect = evt.currentTarget.getBoundingClientRect();
        dispatch({
            type: Action.DRAG_START, 
            evt, 
            layoutModel: {...component, $id: uuid(1)},
            instructions: { DoNotRemove: true, DoNotTransform: true },
            dragRect
        });
    }

    function drop(icon) {
        console.log('ComponentPalette.drop');
        // var releaseSpace = true;
        // //this.props.onLayout('drop', {component:this.refs.component, dropTarget, releaseSpace});
        // // initialize the config for the new component 
        // var { component, layout } = icon.props;
        // var { children, container, dragContainer, dragging, draggingSibling,
        //     onConfigChange, onLayout, onMeasure, ...rest } = component.props;


        // var config = {};
        // config[layout.id] = rest;
        // this.props.onMeasure(null, config);

        // var idx = this.state.dragging;
        // var layouts = this.state.layout.slice();
        // layouts[idx] = LayoutModel({ type: 'Component' })

        // this.setState({ dragging: -1, dragX: 0, dragY: 0, layout: layouts });
    }

    return (
        <div className='ComponentPalette'>
            {components.map((component, idx) =>
                <ComponentIcon
                    key={idx}
                    idx={idx}
                    text={component.props.title}
                    color={component.props.iconColor || '#ccc'}
                    component={component}
                    onMouseDown={handleMouseDown}>
                </ComponentIcon>
            )}
        </div>
    );

}
