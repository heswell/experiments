import React from 'react';
import {registerClass} from '../component-registry';
import {getLayoutModel} from '../model/layout-json';
import LayoutItem from './layout-item';
import {Draggable} from '../drag-drop/draggable';
import {layout as applyLayout, handleLayout,followPath} from '../model/index';

export default class Container extends React.Component {

   constructor(props){
        super(props);
        this.state = {
            layoutModel: this.getLayoutModel(),
            ...this.getState()
        }
        this.handleLayout = this.handleLayout.bind(this);
    }

    getLayoutModel(){
        // If layoutModel is not passed in via props - we are a layout 'root'. 
        // LayoutModel for an entire layout tree is created here.
        if (this.props.layoutModel === undefined){
            console.log(`get layoit dynamically`)
            return applyLayout(getLayoutModel(this));
        } else {
            console.log(`get layoit from props`)
            return this.props.layoutModel;
        }
    }

    getState(){
        return {};
    }

    render(){
        console.log(`render ${this.state.layoutModel.type}`)
        // shouldn't this be state.layoutModel ?
        var {type, computedStyle, children} = this.getLayoutModel();
        return (
            <div className={type} style={computedStyle}>
                {children.map((child,idx) => this.renderChild(child,idx))}
            </div>
        );
    }

    // do we actually need this - does it ever make sense to create <Container /> in JSX ?
    renderChild(layoutModel){

        const {children: child , onLayout} = this.props;
        const {style} = child.props;

        let props = {
            layoutModel,
            onLayout
        };

        const id = props.layoutModel.$id;

        props.key = id;
        props.style = {...style, ...props.style};

        if (isLayout(layoutModel.type)){
            return React.cloneElement(child, props);
        } else {
            return <LayoutItem {...child.props} {...props}>{child}</LayoutItem>;
        }

    }

    // makes the layoutModel available to host, assuming this is the layout root
    componentDidMount(){
        const {layoutModel=null, onLayoutModel} = this.props;
        if (layoutModel === null && onLayoutModel){
            onLayoutModel(this.state.layoutModel);
        }
    }

    shouldComponentUpdate(nextProps){
        return nextProps.dragging !== true;
    }

    handleLayout(command, options){
        const {layoutModel} = this.state;
        // is there some other way we can nominate the layout as a root, other than $path === '0'
        if (layoutModel && layoutModel.$path === '0' /*&& !this.props.layoutModel*/){
            // This is a top=level layout and the owner has not taken responsibility for layout, so we need to
            // Note: this will currently work only when the top-level container maintains its layoutModel in 
            // state (FlexBox and TabbedContainer)- other containers CAN be nested. 
            
            if (command === 'drag-start'){
                if (this.handleDragStart){
                    Draggable.handleMousedown(options.evt, this.handleDragStart.bind(this, options));
                }
            } else {
                let newLayoutModel;

                if (command === 'replace'){
                    const {model: replacementNode} = options;
                    const targetNode = followPath(layoutModel, replacementNode.$path);
                    newLayoutModel = handleLayout(this.state.layoutModel, command, {targetNode, replacementNode});
                } else if (command === 'switch-tab'){
                    newLayoutModel = handleLayout(layoutModel, 'switch-tab', options);
                } else if (command === 'drop'){
                    newLayoutModel = handleLayout(layoutModel, 'drop', options);
                } else if (command === 'remove'){
                    const targetNode = followPath(layoutModel, options.model.$path);
                    newLayoutModel = handleLayout(layoutModel, 'remove', {targetNode});
                    console.log(`%ccontainer ${JSON.stringify(newLayoutModel,null,2)}`,'color: green;font-weight: bold;')
                } else {
                    throw Error(`Container: don't know how to handle command ${command}`);
                }
                if (newLayoutModel !== layoutModel){
                    this.setState({layoutModel: newLayoutModel});
                    if (this.props.onLayoutModel){
                        this.props.onLayoutModel(newLayoutModel);
                    }
                }
            }
        } else if (this.props.onLayout){
            this.props.onLayout(command, options);
        }
    }

}

registerClass('Container', Container, true);
