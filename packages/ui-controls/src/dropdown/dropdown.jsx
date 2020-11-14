import React, { forwardRef, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames'
import styled from 'styled-components';
// import env from '../utils/browser';
// import { getUrlForComponent } from './standalone-urls';

const StyledDropdpown = styled.div`
  border: solid 1px #ccc;
  font-family: Roboto;
`;

const Dropdown = forwardRef(function Dropdown(props, ref) {

  // if (env.isElectron){
  //   const {position: {top,left,width,height}, focusOnOpen=false, componentName, children: {props: childProps}} = props;
  //   const url = getUrlForComponent(componentName);
  //   const modalProps = Object.keys(childProps).reduce((o, propertyName) => {
  //     if (typeof propertyname === 'function'){
  //       // if we really needed to, we could convert callbacks to message-based api
  //       // so far, we don't need it
  //     } else {
  //       o[propertyName] = childProps[propertyName]
  //     }
  //     return o;
  //   }, {})

  //   window.openModal(url, {
  //     position: {
  //       top: top+height,
  //       left,
  //       width,
  //       height: 230
  //     },
  //     focusOnOpen,
  //     props: modalProps
  //   })

  //   this.handlePopupMessage = this.handlePopupMessage.bind(this);

  //   window.ipcRenderer.send('modal.register','modal.calendar');
  //   window.ipcRenderer.on('modal.calendar', this.handlePopupMessage)

  // }

  const rootEl = useRef(null);
  const childComponent = useRef(null);

  // this.childComponent = React.createRef();

  const listenforClickAway = (listen) => {
    if (listen) {
      document.body.addEventListener('click', handleClickAway, true);
    } else {
      document.body.removeEventListener('click', handleClickAway, true);
    }
  }

  const handleClickAway = (evt) => {
    const { target } = evt;
    const el = rootEl.current;
    const maybeAway = !equalsOrContains(el, target);
    if (maybeAway) {
      const definatelyAway = !equalsOrContains(props.inputEl, target);
      if (definatelyAway) {
        console.log(` ... ClickAway`)
        listenforClickAway(false);
        if (props.onCancel){
          props.onCancel();
        }
      }
    }
  }

  useEffect(() => {
    listenforClickAway(true);
    return () => listenforClickAway(false)
  }, [])

  // componentWillUnmount(){
  //   console.log(`Dropdown. componentWillUnmount`)
  //   if (env.isElectron){
  //     console.log(`about to remove commit listener`)
  //     window.ipcRenderer.removeListener('modal.calendar', this.handlePopupMessage)
  //     window.ipcRenderer.send('modal.unregister','modal.calendar');
  //   }
  // }

  // componentDidUpdate(prevProps){
  //   if (env.isElectron){
  //     const {values} = this.props.children.props;
  //     const prevValues = prevProps.children.props.values;
  //     if (values !== prevValues){
  //       window.ipcRenderer.send('modal.window', {
  //         type: 'props',
  //         props: {
  //           values
  //         }
  //       });
  //     }  
  //   }
  // }  

  // handlePopupMessage(evt, arg){
  //   if (arg.type === 'commit'){
  //     this.props.onCommit(arg.value);
  //   } else if (arg.type === 'cancel'){
  //     this.props.onCancel();
  //   }
  // }

  // focus(){
  //   if (env.isElectron){
  //     window.ipcRenderer.send('modal.window', {type: 'focus'});
  //   } else {
  //     console.log(`dropdown focus`)
  //     this.childComponent.current.focus();
  //   }
  // }
  const { className, position: { top, left, width, height }, listHeight, children, onCommit, onCancel } = props;

  // if (env.isElectron){
  //   return null
  // } else{
  return ReactDOM.createPortal(
    <StyledDropdpown ref={rootEl}
      className={cx("control-dropdown", className)}
      style={{ top: top + height, left, width, height: listHeight }}>
      {React.cloneElement(children, {
        ref: childComponent,
        onCommit,
        onCancel
      })}
    </StyledDropdpown>,
    document.body)
  // }

});

export default Dropdown;

const equalsOrContains = (el, targetEl) =>
  el && (el === targetEl || el.contains(targetEl));
