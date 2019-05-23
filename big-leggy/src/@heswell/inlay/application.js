
import React from 'react';
import {Surface} from './layoutContainers';
import './components/ComponentIcon';
import {followPath} from './model';
import cx from 'classnames';
import {
    switchTab,
    replace as replaceInLayout
} from './redux/actions';
import {getLayoutModel} from './redux/layoutReducer';
import './application.css';

const UUID = require('pure-uuid');


// Redux -------------------------
// import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
// import componentState from './redux/componentReducer';
// import thunk from 'redux-thunk';

const NO_STYLE = {}

export default class Application extends React.Component {

    static displayName = 'Application';

    static defaultProps = {
        reducers: {},
        bootstrap: () => {}
    };

    constructor(props){
        super(props);

        var {width: appWidth, height: appHeight, dialogs=[], style: {width=appWidth, height=appHeight, backgroundColor}=NO_STYLE} = props;

        // const reduxDevTools = window.devToolsExtension ? window.devToolsExtension() : f => f;

        // const reducers = combineReducers({
        //     ...this.props.reducers,
        //     componentState,
        //     layoutModel
        // });

        // this.store = createStore(
        //     reducers,
        //     compose(applyMiddleware(thunk/*, logger*/), reduxDevTools)
        // );

        // this.store.subscribe(this.handleChange);

        this.state = {
            height,
            width,
            backgroundColor,
            content: this.props.layout, // REALLY ???
            draggedComponent: null,
            dialogs,
            hasError: false
            // layoutModel: this.getLayoutModel(width, height)
        };

        // this.props.bootstrap(this.store.dispatch);
    }

    componentDidCatch(error, info){
        console.log(`error`,error)
        this.setState({hasError: true})
    }

    render(){
        // dragging will suppress render in all children except the DragSurface
        const {width, height, backgroundColor, dragging, hasError} = this.state;
        const style = {position: 'absolute', top: 0, left: 0,width,height, backgroundColor};
        const className = cx('Application', this.props.className);

        //TODO make the default Container a Surface, which can host dialogs/popups as well
        // as root layout. Default style will be 100% x 100%
        //TODO maybe DragSurface should be part of Surface ?

        // TRY scrap the DragSurface. pass dragging to each child. If it is set and they do not
        // match do not render. So dialogs can be moved without dom removal. Layout items 
        // will be transplanted to Surface. Means every container and LayoutItem will have to
        // implement this in shouldComponentUpdate
        // if (nextProps.dragOperation && nextProps.dragOperation.draggedComponent !== this)

        // we want something like 
        // <Surface dragOperation={{draggedComponent,x,y}}

        if (hasError){
            return <div style={style} className={className}>Error</div>
        }

        return (
            <div style={style} className={className}>
                <Surface layoutModel={this.props.layoutModel}
                    style={{width,height}}
                    dragging={dragging}
                    onLayout={this.handleLayout}
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

    handleChange = () => {
        const layoutModel = getLayoutModel(this.store.getState());

        // console.log(`Application.handleChange 
        // 	state version ${this.state ? this.state.layoutModel.$version : 'null'}
        // 	store version ${layoutModel ? layoutModel.$version : 'null'}`);

        if (layoutModel !== null && layoutModel !== this.state.layoutModel){
            //onsole.log(`Application:store change triggers setState EXPECT RENDER`);
            this.setState({layoutModel});
        }
    }

    getLayoutModel(width, height, id=new UUID(1)){

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

    componentDidMount(){
        window.addEventListener('resize', this.resizeListener, false);
        // this.store.dispatch(initializeLayoutModel(this.state.layoutModel));
    }

    componentWillUnmount(){
        window.removeEventListener('resize', this.resizeListener, false);
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

    resizeListener = () => {
        // var {width, height} = document.body.getBoundingClientRect();

        // if (width !== this.state.width || height !== this.state.height){

        //     const {layoutModel} = this.state;

        //     this.store.dispatch(initializeLayoutModel(layout(layoutModel, {top:0,left:0,width,height}, layoutModel.$path, 'visible', true)));

        //     this.setState({	width, height });
        // }

    }

    handleLayout = (command, options) => {

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
