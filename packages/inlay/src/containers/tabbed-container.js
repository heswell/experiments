import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import Tabstrip, {Tab} from '../components/tabstrip';
import LayoutItem from './layout-item';
import Container from './container';
import {registerClass} from '../component-registry';
import { LayoutRoot } from './layout-root';
import { Action } from '../model/layout-reducer';


const DEFAULT_TABSTRIP_HEIGHT = 34;

export default function TabbedContainer(props){

    const {layoutModel, dispatch, onTabSelectionChanged} = props;

    if (layoutModel === undefined){
        return (
            <LayoutRoot><TabbedContainer {...props} /></LayoutRoot>
        )
    }

    const handleMouseDown = evt => {}

    const handleTabSelection = (idx, nextIdx) => {
        console.log(`handleTabSelection prevSelectedIdx=${idx}, newSelectedIdx=${nextIdx}`);
        dispatch({type: Action.SWITCH_TAB, path: layoutModel.$path, nextIdx });

        if (onTabSelectionChanged){
            onTabSelectionChanged(newSelectedIdx);
        }
    }
    const handleMouseDownTab = (evt, childLayoutModel) => {}

    const {$id, computedStyle, active} = layoutModel;
    const className = cx('TabbedContainer', props.className );

    return (
        <div id={$id} className={className} style={computedStyle}>
            <Tabstrip className='header'
                // we used to store a 'ref' here
                style={{position: 'absolute',top: 0,left: 0, width: computedStyle.width, height: 26}}
                draggable={true} // To be investigated
                selected={active}
                dragging={false} // To be investigated
                onMouseDown={handleMouseDown}
                onSelectionChange={handleTabSelection}>{tabs()}</Tabstrip>
            {renderChildren()}
        </div>
    );

    function tabs(){
        return layoutModel.children.map((child,idx) =>
            <Tab key={idx} text={titleFor(child)} onMouseDown={e => handleMouseDownTab(e,child)} />
        );
    }


    function renderChildren(){
        const {active=0, children: {[active]: childLayoutModel}} = layoutModel;
        const {children: {[active]: propsChild}} = props;
        const commonProps = {
            key: childLayoutModel.$id,
            layoutModel: childLayoutModel
        };

        if (isLayout(propsChild)){
            return React.cloneElement(propsChild, {...commonProps});
        } else {
            return <LayoutItem {...propsChild.props} {...commonProps}>{propsChild}</LayoutItem>;
        }
    }

}

export class XXXTabbedContainer extends Container {

    constructor(props){
        super(props);
        this.tabstrip = null;
    }

    render(){
        var {tabstripHeight, children} = this.props;
        const {layoutModel} = this.state;
        var {$id, computedStyle: style, active} = layoutModel;

        // Don't allow either the tabs or the tabstrip itself to be dragged unless it is inside
        // the DragZone. We might further config-enable this eg. allow tabs but not the tabstrip
        // to be dragged when the TabbedContainer IS the DragZOne.
        var isDraggable = true;

        // Note: if key is not assigned here, we will get a React warning, even though it is assigned in Tabstrip !
        var tabs = children.map((child,idx) => {
            return <Tab key={idx} text={titleFor(child)} onMouseDown={e => this.handleMouseDown(e,layoutModel.children[idx])} />
        });

        var className = cx(
            'TabbedContainer',
            this.props.className
        );

        return (
            <div id={$id} className={className} style={style}>
                <Tabstrip className='header'
                    ref={component => this.tabstrip = component}
                    style={{position: 'absolute',top: 0,left: 0, width: style.width, height: 26}}
                    draggable={isDraggable}
                    selected={active}
                    dragging={this.state.dragging}
                    onMouseDown={e => this.handleMouseDown(e)}
                    onSelectionChange={(selected, idx) => this.handleTabSelection(selected, idx)}>{tabs}</Tabstrip>
                {this.renderChildren()}
            </div>
        );
    }

    renderChildren(){

        const {children, onLayout} = this.props;
        const {layoutModel: {active=0, children: layoutChildren}} = this.state;
        const child = children[active]

        var childLayoutModel = layoutChildren[active];

        var {title, style={}, ...childProps} = child.props;

        var id = childLayoutModel.$id;

        style={...style, ...childLayoutModel.style}; // TODO shouldn't layoutModel be the sole source of tryth for style ?

        var props = {
            id,
            key: id,
            container: this,
            onLayout,
            onConfigChange: this.handleConfigChange,
            title: title,
            layoutModel: childLayoutModel
        };

        if (isLayout(child)){
            return React.cloneElement(child, {...props,style});
        } else {
            return <LayoutItem {...childProps} {...props} style={style}>{child}</LayoutItem>;
        }
    }

    // duplicated from flexBox as an experiment, wh can't this be moved entirely to Container
    componentWillReceiveProps(nextProps) {
        var { layoutModel } = nextProps;
        if (layoutModel && layoutModel !== this.state.layoutModel) {
            this.setState({ layoutModel });
        } else if (this.state.layoutModel.$path === '0') {
        // special handling if we are at the root of a layout
        // should handle this in Container
            const {style: {width, height, visibility}} = nextProps;
            const {style} = this.props;
            if (width !== style.width || height !== style.height || visibility !== style.visibility) {
                const VISIBLE = visibility || 'visible';
                const FORCE_LAYOUT = true;
                this.setState({
                    layoutModel: applyLayout(
                        this.state.layoutModel,
                        { width, height },
                        this.state.layoutModel.$path,
                        VISIBLE,
                        FORCE_LAYOUT)
                });
            }

        }
    }

    handleTabSelection(selected, idx){
        const {onLayout=this.handleLayout} = this.props;
        const {layoutModel} = this.state;
        onLayout('switch-tab', {
            path: layoutModel.$path,
            idx: this.props.active,
            nextIdx: idx
        });

        if (this.props.onTabSelectionChanged){
            this.props.onTabSelectionChanged(idx);
        }
    }

    handleMouseDown(e, model=this.state.layoutModel){
        e.stopPropagation();
        const {onLayout=this.handleLayout} = this.props;
        onLayout('drag-start',{
            model,
            evt: e,
            position: ReactDOM.findDOMNode(this).getBoundingClientRect()});
    }

}

TabbedContainer.displayName = 'TabbedContainer';
TabbedContainer.defaultProps = {
    tabstripHeight: DEFAULT_TABSTRIP_HEIGHT
}

registerClass('TabbedContainer', TabbedContainer, true);

function titleFor(component){

    var {title, config} = component.props;

    return title || (config && config.title) || 'Tab X';

}

function isLayout(element){
    return element.type.displayName === 'FlexBox' ||
            element.type.displayName === 'TabbedContainer' ||
            element.type.displayName === 'DynamicContainer';
}
