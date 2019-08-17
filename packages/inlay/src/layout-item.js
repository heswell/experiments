import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import { PopupService } from '@heswell/ui-controls';
import ComponentHeader from './component-header';
import ComponentContextMenu from './componentContextMenu';
import { remove as removeFromLayout } from './redux/actions';
import {
    layout as applyLayout,
    layoutStyleDiff
} from './model/index';
import {getLayoutModel} from './util/component-utils';
import './layoutItem.css';

const DEFAULT_HEADER_SPEC = {
    height: 32,
    menu: true
}

export default class LayoutItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            layoutModel: props.layoutModel ||
                applyLayout(getLayoutModel(this),{width: props.style.width, height: props.style.height})
        };

        this.handleLayout = this.handleLayout.bind(this);
    }

    render() {

        const {
            children,
            title = '',
            state,
            dragging,
            header: _,
            ...props } = this.props;

        const {layoutModel} = this.state;
        const [{layout: childLayout}] = layoutModel.children;

        var { $path, layout } = layoutModel;
        var isSelected = this.props.isSelected;

        var className = cx(
            'LayoutItem', {
                'minimized': state === 1,
                'maximized': state === 2,
                'active': isSelected,
                'dragging': dragging
            }
        );

        const header = !layoutModel.header
            ? false
            : layoutModel.header === true
                ? DEFAULT_HEADER_SPEC
                : { ...DEFAULT_HEADER_SPEC, ...layoutModel.header };

        var headerHeight = header ? header.height : 0;

        const style = {
            backgroundColor: layoutModel.style.backgroundColor,
            boxShadow: layoutModel.style.boxShadow
        }

        const componentStyle = {
            // backgroundColor: props.style.backgroundColor,
            position: 'absolute',
            top: headerHeight,
            border: 0,
            padding: 0,
            margin: 0,
            // ...childStyle,
            ...childLayout
        };

        return (
            <div id={$path} className={className} style={{ position: 'absolute', ...style, ...layout }}>
                {header &&
                    <ComponentHeader ref='header'
                        title={`${title}`}
                        style={{ height: header.height }}
                        menu={header.menu}
                        onMouseDown={e => this.handleMousedown(e)}
                        onAction={(key, opts) => this.handleAction(key, opts)}
                        state={state} />
                }

                {children.type === 'div'
                    ? React.cloneElement(children, {
                        style: {...componentStyle, ...childLayout}
                    })

                    : React.cloneElement(children, {
                        ...props,
                        style: componentStyle, // we may need to merge style attributes from props
                        width: childLayout.width,
                        height: childLayout.height,
                        onLayout: this.handleLayout
                    })
                }
            </div>
        );
    }

    componentDidMount() {

        const self = this;
        if (this.context && this.context.store) {
            const { store } = this.context;
            //TODO sort out this mess
            // be careful the context of store change notification is not 'this'
            this.unsubscribe = store.subscribe(() => {
                const myState = self.getState();
                if (myState && myState !== self.state.c) {
                    // console.log(`LayoutItem receives store change notification - ITS FOR ME and it has changed 
                    // ${JSON.stringify(myState)}
                    //${JSON.stringify(self.state.c)}`);
                    self.setState({ c: myState });
                }

                // else if (myState && myState === self.state.c){
                // console.log(`LayoutItem receives store change notification - it's for me BUT it hasn't changed`);
                // }
                // else {
                // console.log(`LayoutItem receives store change notification - it's Not for me :-(`);
                // }
            });

        }
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    componentWillReceiveProps(nextProps) {

        const { layoutModel, style } = nextProps;
        // look out for a style change that will require a layout, we will reset layout in state and call
        // onLayout prop to pass this up chain of command

        if (style && style.flexGrow !== this.props.style.flexGrow) {
            var fixed = style.flexGrow === 0;
            this.setState({
                fixed,
                header: { title: this.props.title, fixed }
            });
        }
        if (layoutModel && layoutModel !== this.state.layoutModel) {
            this.setState({ layoutModel });
        } else if (layoutStyleDiff(this.props.style, style)) {
            // TODO test this code
            const {$path, layout} = this.state.layoutModel;
            const {marginTop=0,marginRight=0,marginBottom=0,marginLeft=0} = this.props.style;
            const {top, left,width, height} = layout;
            this.setState({
                layoutModel: applyLayout(
                    {
                        ...this.state.layoutModel,
                        style
                    },
                    { top, left, width: width + marginLeft + marginRight, height: height + marginTop + marginBottom },
                    $path,
                    true // FORCE_LAYOUT
                )
            }, () => {
                this.props.onLayout('replace', { model: this.state.layoutModel });
            });

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
        if (this.props.onMouseDown) {
            this.props.onMouseDown({
                model: this.props.layoutModel,
                evt: e,
                position: ReactDOM.findDOMNode(this).getBoundingClientRect()
            });
        }
        else {
            this.props.onLayout('drag-start', {
                model: this.props.layoutModel,
                evt: e,
                position: ReactDOM.findDOMNode(this).getBoundingClientRect()
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
            this.dispatch(removeFromLayout(this.props.layoutModel));
            // this.props.onLayout('remove', {model:this.props.layoutModel});
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
