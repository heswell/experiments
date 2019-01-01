import React from 'react';
import ReactDOM from 'react-dom';
import env from '../utils/browser';

export default class Dropdown extends React.Component {

  render(){
    const {position: {top,left,width,height}, children} = this.props;

    let host = env.isElectron
      ? window.openModal()
      : document.body;

    return ReactDOM.createPortal(
      <div className="control-dropdown" style={{top:top+height,left, width}}>
        {children}
      </div>,
      host)
  }
}
