import React from 'react';
import ReactDOM from 'react-dom';
import List from './controls/list';
import env from './utils/browser';

import './index.css'

class StandaloneList extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      componentProps: window.props
    }

    this.hasFocus = false

    this.handleCancel = this.handleCancel.bind(this)
    this.handleCommit = this.handleCommit.bind(this)
    this.handleFocus = this.handleFocus.bind(this);
    this.handleModalProps = this.handleModalProps.bind(this);

    this.list = React.createRef();

    window.ipcRenderer.on('modal.props', this.handleModalProps)
    window.ipcRenderer.on('modal.focus', this.handleFocus)

  }

  handleModalProps(evt, args){
    this.setState({
      componentProps: {
        ...this.state.componentProps,
        ...args.props
      }
    })
  }

  componentWillUnmount(){
    window.ipcRenderer.removeListener('modal.props', this.handleModalProps)
    window.ipcRenderer.removeListener('modal.focus', this.handleFocus)
  }

  render(){
    return (
      <List {...this.state.componentProps}
        ref={this.list}
        onSelect={this.handleCommit}
        onCommit={this.handleCommit}
        onCancel={this.handleCancel} />
    )
  }

  handleFocus(){
    window.ipcRenderer.send('modal.message', 
      `handleFocus alreadyFocussed ? ${this.hasFocus}`)

      if (!this.hasFocus){
      this.hasFocus = true;
      this.list.current.focus();
    }
  }

  handleCancel(){
    if (env.isElectron){
      window.ipcRenderer.send('modal.calendar', {type: 'cancel'})
    }
  }

  handleCommit(value){
    if (env.isElectron){
      window.ipcRenderer.send('modal.calendar', {type:'commit', value})
    }
  }
}

ReactDOM.render(
  <StandaloneList />,
  document.getElementById('root'));
