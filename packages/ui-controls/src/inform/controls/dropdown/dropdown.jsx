import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames'
import env from '../../../utils/browser';
import {getUrlForComponent} from './standalone-urls';

export default class Dropdown extends React.Component {

  constructor(props){
    super(props)

    if (env.isElectron){
      const {position: {top,left,width,height}, focusOnOpen=false, componentName, children: {props: childProps}} = props;
      const url = getUrlForComponent(componentName);
      const modalProps = Object.keys(childProps).reduce((o, propertyName) => {
        if (typeof propertyname === 'function'){
          // if we really needed to, we could convert callbacks to message-based api
          // so far, we don't need it
        } else {
          o[propertyName] = childProps[propertyName]
        }
        return o;
      }, {})

      window.openModal(url, {
        position: {
          top: top+height,
          left,
          width,
          height: 230
        },
        focusOnOpen,
        props: modalProps
      })

      this.handlePopupMessage = this.handlePopupMessage.bind(this);

      window.ipcRenderer.send('modal.register','modal.calendar');
      window.ipcRenderer.on('modal.calendar', this.handlePopupMessage)

    } else {
      this.el = React.createRef();
      this.childComponent = React.createRef();
      this.documentClickListener = evt => this.handleClickAway(evt);
      this.listenforClickAway(true);
    }
  }

  componentWillUnmount(){
    if (env.isElectron){
      console.log(`about to remove commit listener`)
      window.ipcRenderer.removeListener('modal.calendar', this.handlePopupMessage)
      window.ipcRenderer.send('modal.unregister','modal.calendar');
    } else {
      this.listenforClickAway(false);
    }
  }

  componentDidUpdate(prevProps){
    if (env.isElectron){
      const {values} = this.props.children.props;
      const prevValues = prevProps.children.props.values;
      if (values !== prevValues){
        window.ipcRenderer.send('modal.window', {
          type: 'props',
          props: {
            values
          }
        });
      }  
    }
  }  

  handlePopupMessage(evt, arg){
    if (arg.type === 'commit'){
      this.props.onCommit(arg.value);
    } else if (arg.type === 'cancel'){
      this.props.onCancel();
    }
  }

  listenforClickAway(listen){
    if (listen){
      document.body.addEventListener('click',this.documentClickListener,true);
    } else {
      document.body.removeEventListener('click',this.documentClickListener,true);
    }
  }

  handleClickAway(evt){
    const {target} = evt;
    const el = this.el.current;
    if (el && target !== el && !el.contains(target)){
      this.listenforClickAway(false);
      this.props.onCancel();
    }
  }

  focus(){
    if (env.isElectron){
      window.ipcRenderer.send('modal.window', {type: 'focus'});
    } else {
      this.childComponent.current.focus();
    }
  }

  render(){
    const {className, position: {top,left,width,height}, children, onCommit, onCancel} = this.props;

    if (env.isElectron){
      return null
    } else{
      return ReactDOM.createPortal(
        <div ref={this.el}
          className={cx("control-dropdown", className)}
          style={{top:top+height,left, width}}>
          {React.cloneElement(children, {
            ref: this.childComponent,
            onCommit,
            onCancel 
          })}
        </div>,
        document.body)
    }
   }

}
