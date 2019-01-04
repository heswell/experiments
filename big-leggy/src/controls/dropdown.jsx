import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames'
import env from '../utils/browser';

export default class Dropdown extends React.Component {

  constructor(props){
    super(props)
    if (env.isElectron){
      const {position: {top,left,width,height}} = props;

      window.openModal(`http://localhost:3000/calendar.html`, {
        top: top+height,
        left,
        width,
        height: 230
      })

      window.ipcRenderer.send('modal.register','modal.calendar');

      window.ipcRenderer.on('modal.calendar', (evt, arg) => {
        if (arg.type === 'commit'){
          this.props.onCommit(arg.value);
        } else if (arg.type === 'cancel'){
          this.props.onCancel();
        }
      })
      
    } else {
      this.el = React.createRef();
      this.documentClickListener = evt => this.handleClickAway(evt);
      this.listenforClickAway(true);
    }
  }

  componentWillUnMount(){
    this.listenforClickAway(false);
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
            onCommit,
            onCancel 
          })}
        </div>,
        document.body)
    }
   }

}
