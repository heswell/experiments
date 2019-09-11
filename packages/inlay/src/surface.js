import React from 'react';
import cx from 'classnames';
import {uuid} from '@heswell/utils';
import LayoutItem from './layout-item';
import DynamicContainer from './dynamic-container';
import {isLayout} from './util/component-utils';
import { handleLayout } from './model/index';
import {componentFromLayout} from './util/componentFromLayout';
import { registerClass } from './componentRegistry';
import { Draggable } from './draggable';


const NO_CHILDREN = [];
const EMPTY_OBJECT = {};

export default class Surface extends DynamicContainer {

    constructor(props){
        super(props);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
    }

    getState() {
        return {
            dragging: false,
            draggedIcon: null,
            draggedComponent: null
        };
    }

    render() {
        var className = cx(
            this.props.className,
            'rect-layout',
            'rect-container',
            'Surface'
        );

        const {layoutModel: {children=NO_CHILDREN}, draggedComponent} = this.state;
        const childrenToRender = draggedComponent
            ? [...children, draggedComponent]
            : children
        
        return (
            <div id={this.state.id} className={className} style={this.props.style}>
                {
                    childrenToRender.map(
                        (child, idx) => this.renderChild(child, idx)
                    )
                }
            </div>
        );
    }

    renderChild(layoutModel, idx) {

        const { children } = this.props;
        const child = React.isValidElement(children) && idx === 0
            ? children
            : Array.isArray(children) && children[idx]
                ? children[idx]
                : componentFromLayout(layoutModel)

        const props = {
            key: layoutModel.$id,
            onLayout: this.handleLayout,
            layoutModel
        };
        const dragging = layoutModel === this.state.draggedComponent;

        const style = {
            ...child.props.style,
            boxSizing: 'content-box'
        };

        if (isLayout(child)) {
            return React.cloneElement(child, { ...props, style });
        } else {
            return (
                <LayoutItem dragging={dragging} {...props} style={style}>{child}</LayoutItem>)
        }
    }

    componentWillReceiveProps(nextProps) {
        const {layoutModel} = nextProps;
        if (layoutModel && layoutModel !== this.state.layoutModel) {
            this.setState({layoutModel});
        } else {
        // QUESTION: is this reliable ? WOn't the children be different array/
        // instances, even though nothing has changed ?
        // how do we update the layoutModel if we aquire/lose children in mid-flight ?
            // const { children } = nextProps;

            // if (differentChildren(children, this.props.children) && Array.isArray(children)) {

            //     const { layoutModel } = this.state;

            //     // temp hardcoding to test the principal - we need to be able to map 
            //     // children to layoutModel.children
            //     // this works because sample surface gives ID to all children
            //     // and new child is aways last

            //     const idx = children.length - 1;
            //     const lastChild = children[idx];

            //     this.setState({
            //         layoutModel: {
            //             ...layoutModel,
            //             children: [
            //                 ...layoutModel.children,
            //                 layout(this.getLayoutModelChild(lastChild), {}, `${layoutModel.$path}.${idx}`)
            //             ]
            //         }

            //     });
            // }

        }

    }

    renderChildren() {
        return null;
    }

    getDragPermission(/*component*/) {
        return { x: true, y: true }
    }

    handleDragStart({model, position, instructions=EMPTY_OBJECT}, e){
        var {top,left} = position;

        // Can we find a better way than these clumsy instructions

        const layoutModel = !instructions.DoNotRemove
            ? handleLayout(this.state.layoutModel,'remove', {targetNode: model})
            : this.state.layoutModel;

        const {draggableWidth: width,
            draggableHeight: height,
            ...dragTransform} = Draggable.initDrag(e, layoutModel, model.$path, position, {
            drag: this.handleDrag,
            drop: this.handleDrop
        });

        var {$path, layout: modelLayout, style, dragAsIcon, ...rest} = model;
        const layout = modelLayout
            ? {width, height, ...modelLayout, top, left}
            : {top, left, width, height}


        var draggedIcon = dragAsIcon
            ? componentFromLayout({
                type: 'ComponentIcon',
                color: 'red',
                style: {...style, position: 'absolute', width: 120, height: 45, visibility: 'visible'},
                layout
            })
            : undefined;

        // what if draggedComponent is a Layout ?    
        var draggedComponent = dragAsIcon
            ? {$id: uuid(), $path, layout, style, ...rest}
            : {
                ...rest,
                style: {
                    ...style,
                    position: 'absolute',
                    ...(!instructions.DoNotTransform && dragTransform),
                    visibility: 'visible'
                },
                layout,
                children: [{
                    type: 'layout', style: {}, layout: {...layout, top: 0, left: 0}
                }]
            };

            // don't set dragging yet, it will suppress the final render of app with draggedComonent
        // removed.
        this.setState({
            dragX: left,
            dragY: top,
            draggedIcon,
            draggedComponent,
            layoutModel
        });

        return true;

    }

    handleDrag(x,y){

        const {draggedComponent} = this.state;
        let {layout, style} = draggedComponent;

        if (typeof x === 'number' && x !== layout.left){
            layout = {...layout, left: x}
            style = {...style, left: x}
        }

        if (typeof y === 'number' && y !== layout.top){
            layout = {...layout, top: y}
            style = {...style, top: y}
        }

        if (layout !== draggedComponent.layout){
            this.setState({
                dragging: true,
                draggedComponent: {
                    ...draggedComponent,
                    style,
                    layout
                }
            });
        }
    }

    handleDrop(dropTarget){
        const {draggedComponent} = this.state;
        this.setState({draggedComponent: undefined, draggedIcon: undefined, dragging: false});
        // TODO need somehow to animate dropped component to final resting place
        /* 
            perhaps rerender new layout, bt mke new component a placeholder
            measure new position
            animate dragged component to new location
            show new component & hide draggee
            -- becomes a lot more efficient if we render all to a flat plane
        */
        this.handleLayout('drop', {draggedComponent, dropTarget});
    }

}
Surface.displayName = 'Surface';
registerClass('Surface', Surface, true);
