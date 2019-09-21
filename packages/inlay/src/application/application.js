
import React from 'react';
import cx from 'classnames';
import {uuid} from '@heswell/utils';

import Surface from '../containers/surface';
import '../components/ComponentIcon';
import {followPath} from '../model/index';
import {
    switchTab,
    replace as replaceInLayout
} from '../redux/actions';
import {getLayoutModel} from '../redux/layoutReducer';
import './application.css';

const NO_STYLE = {}

export default class Application extends React.Component {

    constructor(props){
        super(props);

        var {width: appWidth, height: appHeight, dialogs=[], style: {width=appWidth, height=appHeight, backgroundColor}=NO_STYLE} = props;

        this.resizeListener = this.resizeListener.bind(this);

        this.el = React.createRef();

        this.state = {
            height,
            width,
            backgroundColor,
            content: this.props.layout, // REALLY ???
            draggedComponent: null,
            dialogs,
            hasError: false
        };

    }

    componentDidCatch(error, info){
        console.log(`error`,error)
        this.setState({hasError: true})
    }

    componentDidMount(){

        let {width, height} = this.state;
        
        if (width === undefined || height === undefined){
            const {height: clientHeight, width: clientWidth} = this.el.current.getBoundingClientRect();
            if (height === undefined){
                height = clientHeight;
            }
            if (width === undefined){
                width = clientWidth;
            }
            this.setState({height, width})
        }

        window.addEventListener('resize', this.resizeListener, false);
        // this.store.dispatch(initializeLayoutModel(this.state.layoutModel));
    }

    componentWillUnmount(){
        window.removeEventListener('resize', this.resizeListener, false);
    }

    render(){

        const {width, height, backgroundColor, dragging, hasError} = this.state;
        const style = {position: 'absolute', top: 0, left: 0,width,height, backgroundColor};
        const className = cx('Application', this.props.className);

        if (width === undefined || height === undefined){
            return <div style={{height: '100%'}} ref={this.el}/>;
        }
        else if (hasError){
            return <div style={style} className={className}>Error</div>
        }

        return (
            <div style={style} className={className} ref={this.el}>
                <Surface layoutModel={this.props.layoutModel}
                    style={{width,height}}
                    dragging={dragging}
                    onLayout={(command, options) => this.handleLayout(command, options)}
                    onLayoutModel={this.props.onLayoutModel}>
                    {this.getContent()}
                </Surface>
            </div>
        );
    }

    getContent(){

        var {children} = this.props;
        var {dialogs} = this.state;

        if (React.isValidElement(children)){
            if (dialogs.length === 0){
                return children;
            }
            else {
                children = [children];
            }
        }

        return children.concat(dialogs);

    }

    getLayoutModel(width, height, id=uuid()){

        console.log(`%cApplication.getLayoutModel width ${width} height ${height} id ${id}`,'color:blue;font-weight:bold');
        return {
            type: 'Surface', // Should it be 'Application' ?
            $id: id,
            $path: '0',
            $version: 1,
            style: {position: 'absolute', width, height},
            layout: {top: 0,left: 0, width, height},
            children: []
        };

    }

    componentWillReceiveProps(nextProps){
        const {dialogs} = nextProps;
        if (dialogs !== this.props.dialogs){
            // could this mess with dialogs already in state ?
            this.setState({dialogs});
        }
    }

    shouldComponentUpdate(nextProps, nextState){
        var {width, height} = this.state;

        return  nextState.width !== width || 
                nextState.height !== height ||
                nextState.draggedComponent !== undefined ||
                nextState.dialogs !== this.state.dialogs ||
                nextState.layoutModel !== this.state.layoutModel;
    }

    resizeListener(){
        // var {width, height} = document.body.getBoundingClientRect();

        // if (width !== this.state.width || height !== this.state.height){

        //     const {layoutModel} = this.state;

        //     this.store.dispatch(initializeLayoutModel(layout(layoutModel, {top:0,left:0,width,height}, layoutModel.$path, 'visible', true)));

        //     this.setState({	width, height });
        // }

    }

    handleLayout(command, options) {

        if (command === 'dialog'){
            // const dialog = componentFromLayout(layout(options.component));
            const {dialogs} = this.state;	
            this.setState({
                dialogs: dialogs.concat(options.component)
            });
        } else {
            var layoutModel = getLayoutModel(this.store.getState());

            if (command === 'replace'){
                this.store.dispatch(replaceInLayout(followPath(layoutModel, options.model.$path), options.model));
            } else if (command === 'switch-tab'){
                const {path, idx, nextIdx} = options;
                this.store.dispatch(switchTab(path, idx, nextIdx));
            } else {
                console.error(`Application.handleLayout dont't know what to do with ${command}`);
            }

        }

    }

	// TODO where does this belong
    getComponentState(componentId){

        const {componentState} = this.store.getState();
        return componentState[componentId];

    }

}

Application.defaultProps = {
    reducers: {},
    bootstrap: () => {}
};
