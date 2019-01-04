import React from 'react';
import cx from 'classnames';
import dateFns from 'date-fns';
import * as StateEvt from '../../state-machinery/state-events';
import CalendarModel, {getDates, getCalendarClassNames} from './calendar-model';
import {getKeyboardEvent} from '../../utils/key-code';

import './calendar.css';

const NAVIGATION_PATTERN = /^(home|end|page-up|page-down|down|up|right|left)$/
const isNavigationEvent = stateEvt => NAVIGATION_PATTERN.test(stateEvt.type);

export default class Calendar extends React.Component {

  constructor(props){
    super(props)
    const date = new Date(props.value)
    const selectedDate = date.toString() === 'Invalid Date'
      ? new Date()
      : date;

    this.model = new CalendarModel({currentMonth: selectedDate, selectedDate});
    const weeks = getDates(this.model.currentMonth, selectedDate)
    this.state = {
      weeks,
      classNames: getCalendarClassNames(weeks)
    }

    this.calendarBody = React.createRef()

    this.nextMonth = this.nextMonth.bind(this);
    this.prevMonth = this.prevMonth.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMonthAnimationEnd = this.handleMonthAnimationEnd.bind(this);
  }

  componentDidMount(){
    this.setCurrentDate(this.model.currentDate);
  }

  componentDidUpdate(){
    this.setCurrentDate(this.model.currentDate);
  }

  nextMonth(){
    const weeks = getDates(this.model.nextMonth(),this.model.selectedDate)
    this.setState({
      weeks,
      classNames: getCalendarClassNames(weeks)
    });
  }

  prevMonth(){
    const weeks = getDates(this.model.prevMonth(),this.model.selectedDate)
    this.setState({
      weeks,
      classNames: getCalendarClassNames(weeks)
    });
  }

  handleKeyDown(e){
    const stateEvt = getKeyboardEvent(e);
    const {model} = this;
    if (stateEvt){
      console.log(`CalendarLayout.getKeyboardEvent ${JSON.stringify(stateEvt)}`)
      if (stateEvt === StateEvt.ESC){
        this.props.onCancel()
      } else if (stateEvt === StateEvt.ENTER){
        this.props.onCommit(model.currentDate)
      } else if (isNavigationEvent(stateEvt)){
        const {currentDate, currentMonth} = model;
        const nextDate = model.nextDate(stateEvt);
        console.log(`next date = ${nextDate}`)
        if (nextDate !== currentDate){
          const monthDiff = dateFns.differenceInCalendarMonths(nextDate, currentDate);
          if (monthDiff){
            const weeks = monthDiff > 0
              ? getDates(model.nextMonth(),this.model.selectedDate,currentMonth)
              : getDates(model.prevMonth(),this.model.selectedDate, null, currentMonth);
            this.setState({weeks, classNames: getCalendarClassNames(weeks)})
          } else {
            this.setCurrentDate(nextDate)
          }
        }
      } 
    }
  }

  render(){
    return (
      <div className="calendar">
        {this.renderHeader()}
        {this.renderDaysOfWeek()}
        {this.renderDateCells()}
      </div>
    )
  }

  renderHeader(){
    const dateFormat = "MMMM YYYY";
    const {currentMonth} = this.model;
    return (
      <div className="calendar-header calendar-row">
        <div className="icon" onClick={this.prevMonth}>chevron_left</div>
        <div className="current-month">
          <span>
            {dateFns.format(currentMonth, dateFormat)}
          </span>
        </div>
        <div className="icon"  onClick={this.nextMonth}>chevron_right</div>
      </div>
    );
  }

  renderDaysOfWeek(){
    const dateFormat = "dd";
    const {currentMonth} = this.model;
    const days = [];
    let startDate = dateFns.startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="calendar-cell" key={i}>
          {dateFns.format(dateFns.addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="calendar-days calendar-row">{days}</div>;
  }

  renderDateCells(){
    const {onCommit, children: dateRenderer} = this.props;
    const {classNames, weeks} = this.state;
    return (
      <div className={cx("calendar-body", ...classNames)} ref={this.calendarBody}>
        <div className="calendar-body-inner-container"
          onAnimationEnd={this.handleMonthAnimationEnd}>
          {weeks.map((week,idx) => 
            <div className="calendar-row" key={idx}>
              {week.days.map(({day, formattedDate, disabled,selected, otherMonth}) => 
                <div key={day} tabIndex={0}
                  data-day={dateFns.format(day, "YYYY-MM-DD")}
                  className={cx("calendar-cell", {disabled,selected, otherMonth})}
                  onClick={() => onCommit(dateFns.parse(day))}
                  onKeyDown={this.handleKeyDown}>
                  {dateRenderer(formattedDate)}
                </div>
              )}
            </div>)}
        </div>
      </div>
    )
  }

  setCurrentDate(date){
    const key = dateFns.format(date, "YYYY-MM-DD");

    const dateCell = this.calendarBody.current.querySelector(`.calendar-cell[data-day = '${key}']`);
    if (dateCell){
      dateCell.focus();
    }
  }

  handleMonthAnimationEnd(){
    const weeks = this.state.weeks.filter(week => !week.otherMonth);
    this.setState({
      classNames: getCalendarClassNames(weeks),
      weeks
    })
  }

}