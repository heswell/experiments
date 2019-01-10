import React from 'react';
import ReactDOM from 'react-dom';
import Calendar from './controls/calendar/calendar-layout';
import env from './utils/browser';

import './index.css'

class StandaloneCalendar extends React.Component {
  constructor(props){
    super(props)
    this.handleCancel = this.handleCancel.bind(this)
    this.handleCommit = this.handleCommit.bind(this)
  }
  render(){
    return (
      <Calendar
        onSelect={this.handleCommit}
        onCommit={this.handleCommit}
        onCancel={this.handleCancel}>
        {formattedDate =>
          <span className="calendar-day">{formattedDate}</span>
        }
      </Calendar>
    )
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
  <StandaloneCalendar />,
  document.getElementById('root'));
