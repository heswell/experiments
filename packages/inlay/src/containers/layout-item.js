import React from 'react';
import cx from 'classnames';
import { PopupService } from '@heswell/ui-controls';
import ComponentHeader from '../component/component-header.jsx';
import ComponentContextMenu from '../componentContextMenu';
import { remove as removeFromLayout } from '../redux/actions';
import { layout as applyLayout } from '../model/index';
import {getLayoutModel} from '../model/layout-json';

import './layout-item.css';

export default class LayoutItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            layoutModel: props.layoutModel ||
                applyLayout(getLayoutModel(this),{width: props.style.width, height: props.style.height})
        };

        this.el = React.createRef();
        this.handleLayout = this.handleLayout.bind(this);
    }

    render() {

        const {
            children: component,
            title = '',
            state,
            dragging,
            header: _,
            ...props } = this.props;

        const {
            header,
            computedStyle: style,
            children: [{computedStyle: innerStyle}]
        } = this.state.layoutModel;
        // const {
        //     header,
        //     style: {backgroundColor, boxShadow}, 
        //     layout,
        //     children: [
        //         {layout: {top,left,width,height}}
        //     ]
        // } = this.state.layoutModel;

        const className = cx(
            'LayoutItem', {
                'minimized': state === 1,
                'maximized': state === 2,
                'active': this.props.isSelected,
                'dragging': dragging
            }
        );

        return (
            <div className={className} ref={this.el}
                style={style} >
                {header &&
                    <ComponentHeader
                        title={`${title}`}
                        style={header.style}
                        menu={header.menu}
                        onMouseDown={e => this.handleMousedown(e)}
                        onAction={(key, opts) => this.handleAction(key, opts)}
                        state={state} />
                }

                {component.type === 'div'
                    ? React.cloneElement(component, { style: innerStyle })

                    : React.cloneElement(component, {
                        ...props,
                        style: innerStyle, // we may need to selectively merge style attributes from props
                        onLayout: this.handleLayout // which component supports this ?
                    })
                }
            </div>
        );
    }

    componentWillReceiveProps(nextProps) {

        const { layoutModel } = nextProps;

        if (layoutModel && layoutModel !== this.state.layoutModel) {
            this.setState({ layoutModel });
        }
    }

    dispatch(action){

        if (typeof action === 'function') {
            return this.context.store.dispatch(action);
        }
        else {
            const { id, componentId, ...options } = action;
            if (id && action.type === 'SAVE_CONFIG') {
                this.context.store.dispatch({ type: 'SAVE_CONFIG', config: { ...options.config, targetId: this.props.layoutModel.$id }, componentId: id });
            }
            else if (componentId) {
                this.context.store.dispatch({ ...options, componentId })
            }
            else {
                this.context.store.dispatch({ ...options, componentId: this.props.layoutModel.$id });
            }
        }

    }

    handleLayout(command, options){

        if (command === 'remove' && options === undefined) {
            // TODO call onLayout
            this.dispatch(removeFromLayout(this.props.layoutModel));
        }
        else {
            this.props.onLayout(command, options);
        }

    };

    handleAction(key, opts){

        if (key === 'menu') {

            var { left, top } = opts;

            // the ComponentContextMenu will reach into the hostedComponent to get MenuItems, we should do that here
            var contextMenu = <ComponentContextMenu component={this} doAction={action => this.handleContextMenuAction(action)} />;

            PopupService.showPopup({ left, top, component: contextMenu });
        }

        else if (key === 'pin') {
            var fixed = this.state.fixed;
            this.setState({ fixed: !fixed });
            this.props.onConfigChange(this, { fixed: !fixed })
        }
    }

    handleMousedown(e){
        
        const position = this.el.current.getBoundingClientRect();

        if (this.props.onMouseDown) {
            this.props.onMouseDown({
                model: this.props.layoutModel,
                evt: e,
                position
            });
        }
        else {
            this.props.onLayout('drag-start', {
                model: this.props.layoutModel,
                evt: e,
                position
            });
        }
    }

    handleContextMenuAction(action/*, data*/){

        if (action === 'pin') {
            var fixed = this.state.fixed;
            this.setState({ fixed: !fixed });
            this.props.onConfigChange(this, { fixed: !fixed })
        }
        else if (action === 'remove') {
            //this.dispatch(removeFromLayout(this.props.layoutModel));
            this.props.onLayout('remove', {model: this.props.layoutModel});
        }
        else if (action === 'minimize') {
            this.props.onLayout('minimize', {/*path*/});
        }
        else if (action === 'maximize') {
            this.props.onLayout('maximize', { /*path*/ });
        }
        else if (action === 'restore') {
            this.props.onLayout('restore', { /*path*/ });
        }
        else if (action === 'settings') {

            // const dialog = this._component && this._component.getSettingsEditor
            //     ? this._component.getSettingsEditor()
            //     : <div style={{
            //                 width: 300,
            //                 height: 200,
            //                 backgroundColor: 'yellow',
            //                 borderColor: 'red',
            //                 borderWidth: 5,
            //                 borderStyle: 'solid'}} />


            // this.props.onLayout('dialog',{
            //     component : dialog 
            // });
        }
        else if (typeof action === 'object') {
            this.dispatch(action);
        }
        else {
            console.log(`LayoutItem.handleContextMenuAction unknown action ${action}`);

        }

    }

}

LayoutItem.displayName = 'LayoutItem';

LayoutItem.defaultProps = {
    onConfigChange: () => { },
    style: {},
    visibility: 'visible'
};
