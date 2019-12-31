import React from 'react';
import {registerClass} from '../component-registry';
import {getLayoutModel} from '../model/layout-json';
import LayoutItem from './layout-item';
import {Draggable} from '../drag-drop/draggable';
import {layout as applyLayout, handleLayout,followPath} from '../model/index';

export default class Container extends React.Component {

   constructor(props){
        super(props);
        const layoutModel = this.getLayoutModel();
        this.state = {
            layoutModel,
            ...this.getState()
        }

        this.handleLayout = this.handleLayout.bind(this);
    }

    getState(){
        return {};
    }

    isLayoutRoot(){
        return this.props.layoutModel === undefined;
    }

    render(){
        var {type, computedStyle: style, children} = this.getLayoutModel();
        return (
            <div className={type} style={style}>
                {children.map((child,idx) => this.renderChild(child,idx))}
            </div>
        );
    }

    renderChild(layoutModel){

        const {children: child , onLayout} = this.props;
        const {style} = child.props;

        let props = {
            layoutModel,
            onLayout
        };

        const id = props.layoutModel.$id;

        props.id = id;
        props.key = id;
        props.style = {...style, ...props.style};

        if (isLayout(layoutModel.type)){
            return React.cloneElement(child, props);
        } else {
            return <LayoutItem {...child.props} {...props}>{child}</LayoutItem>;
        }

    }

    componentDidMount(){
        const {layoutModel=null, onLayoutModel} = this.props;
        if (layoutModel === null && onLayoutModel){
            onLayoutModel(this.state.layoutModel);
        }
    }

    shouldComponentUpdate(nextProps){
        return nextProps.dragging !== true;
    }

    getLayoutModel(){

        if (this.isLayoutRoot()){
            return applyLayout(getLayoutModel(this));
        } else {
            return this.props.layoutModel;
        }

    }

    getManagedDimension(){
        return null;
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

Container.defaultProps = {
    style: {flex: 1}
}

registerClass('Container', Container, true);
