import React, { Component, useState } from 'react'
import './componentPalette.css';
import { uuid } from '@heswell/utils';
import { Action, getLayoutModel, extendLayout, stretchLayout } from '@heswell/inlay';

const header = true;
const resizeable = true;

const getDefaultComponents = () => [
    <Component title="Blue Monday" iconBg="cornflowerblue" iconColor="white" style={{backgroundColor: 'cornflowerblue', color: 'white'}} header resizeable />,
    <Component title="Ivory Tower" iconBg="ivory" style={{backgroundColor: 'ivory', flex: 1}} header resizeable />
    // { type: 'Component', props:{title: 'Ketchup', }, style: { backgroundColor: 'tomato', flex: 1 }, resizeable, iconColor: 'tomato' },
    // { type: 'Component', props:{title: 'Army Drill'}, style: { backgroundColor: 'khaki', flex: 1 }, resizeable, iconColor: 'khaki' },
    // { type: 'Component', props:{title: 'Brown Study'}, style: { backgroundColor: 'brown', flex: 1 }, resizeable, iconColor: 'brown' }
].map(component => {
    const model = getLayoutModel('Component', component.props);
    const layoutModel = extendLayout({
        ...model,
        style: {
            ...model.style,
            width: 150,
            height: 200
        }
    }, null);
    stretchLayout(layoutModel);
    return layoutModel;
});

const ComponentIcon = ({children, color, backgroundColor, idx, text, onMouseDown}) => {
    const handleMouseDown = evt => onMouseDown(evt, idx)
    return (
        <div className='ComponentIcon' onMouseDown={handleMouseDown}
            style={{ color, backgroundColor }}>
            <span>{text}</span>
            {children}
        </div>
    );
}

export default function ComponentPalette({
    components: propComponents,
    dispatch
}) {

    const [components] = useState(propComponents || getDefaultComponents());

    function handleMouseDown(evt, idx) {
        console.log(`mouderDown ${idx}`)
        const component = components[idx];
        const {left, top} = evt.currentTarget.getBoundingClientRect();
        dispatch({
            type: Action.DRAG_START, 
            evt, 
            layoutModel: {...component, $id: uuid(1)},
            instructions: { DoNotRemove: true, DoNotTransform: true, dragThreshold: 0 },
            dragRect: {left, top, right: left+100, bottom: top+150}
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
                    color={component.props.iconColor || '#000'}
                    backgroundColor={component.props.iconBg || '#333'}
                    component={component}
                    onMouseDown={handleMouseDown}>
                </ComponentIcon>
            )}
        </div>
    );

}
