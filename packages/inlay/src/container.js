import React from 'react';
import {registerClass} from './componentRegistry';
import {getLayoutModel} from './util/component-utils';
import LayoutItem from './layout-item';
import {Draggable} from './draggable';
import {layout as applyLayout, handleLayout,followPath} from './model/index';

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
        var {style} = this.props;
        var layoutModel = this.getLayoutModel();
        var {layout, $position=layout} = layoutModel;

        return (
            <div className={layoutModel.type} style={{...style, position: 'absolute', ...$position}}>
                {layoutModel.children.map((child,idx) => this.renderChild(child,idx))}
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
        // if the Application passes down the dragging flag, do not render, the only rendering
        // to take place happens on the DragSurface.
        // if (nextProps.dragging){
        // onsole.log(`Container ${this.props.layoutModel.type} dragging  so don't update`);
        // }
        return nextProps.dragging !== true;
    }

    getLayoutModel(){

        if (this.isLayoutRoot()){
            return applyLayout(getLayoutModel(this));
        } else {
            return this.props.layoutModel;
        }
        
        // let {layoutModel/*,style*/} = this.props;

        // if (layoutModel === undefined){
        //     // console.log(`getRootLayoutModel for ${typeOf(this)}`);
        //     return applyLayout(getLayoutModel(this));
        // } /*else if (layoutModel.children && layoutModel.children.length === 0){
        //     alert('it happens')
        //     console.log(`mutating (appending) layoutModel children. Can this be avoided ?`)
        //     var children = getLayoutModelChildren(this);

        //     [].push.apply(layoutModel.children, children);

        //     var VISIBLE = style.visibility || 'visible';
        //     var FORCE_LAYOUT = true;

        //     var width;
        //     var height;
        //     var $position = layoutModel.$position;

        //     if (typeof style.width === 'number' && typeof style.height === 'number'){
        //         width = style.width;
        //         height = style.height;
        //     } else if ($position && $position.width !== undefined && $position.height !== undefined){
        //         width = $position.width;
        //         height = $position.height;
        //     } else {
        //         console.error(`Container.getLayoutModel attempting to initialize a ${layoutModel.type} layoutModel with no sizing attributes`)
        //     }
        //     console.log(`apply layout, WITH CHILDREN`)
        //     var layoutModel2 = applyLayout(layoutModel, {width,height}, layoutModel.$path, VISIBLE, FORCE_LAYOUT);

        //     layoutModel.children = layoutModel2.children;

        // } */

        // return layoutModel;

    }

    getManagedDimension(){
        return null;
    }

    handleLayout(command, options){

        // is there some other way we can nominate the layout as a root, other than $path === '0'
        if (this.state.layoutModel && this.state.layoutModel.$path === '0' /*&& !this.props.layoutModel*/){
            // This is a top=level layout and the owner has not taken responsibility for layout, so we need to
            // Note: this will currently work only when the top-level container maintains its layoutModel in 
            // state (FlexBox and TabbedContainer)- other containers CAN be nested. 
            if (command === 'drag-start'){
                if (this.handleDragStart){
                    Draggable.handleMousedown(options.evt, this.handleDragStart.bind(this, options));
                }
            } else {
                let layoutModel;

                if (command === 'replace'){
                    const {model: replacementNode} = options;
                    const targetNode = followPath(this.state.layoutModel, replacementNode.$path);
                    layoutModel = handleLayout(this.state.layoutModel, command, {targetNode, replacementNode});
                } else if (command === 'switch-tab'){
                    layoutModel = handleLayout(this.state.layoutModel, 'switch-tab', options);
                } else if (command === 'drop'){
                    layoutModel = handleLayout(this.state.layoutModel, 'drop', options);
                } else {
                    throw Error(`Container: don't know how to handle command ${command}`);
                }
                if (layoutModel !== this.state.layoutModel){
                    this.setState({layoutModel});
                    if (this.props.onLayoutModel){
                        this.props.onLayoutModel(layoutModel);
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
