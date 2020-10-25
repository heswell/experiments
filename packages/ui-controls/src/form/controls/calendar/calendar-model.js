import {addDays,subDays, addMonths, isSameDay, isSameMonth, subMonths, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek} from 'date-fns';
import * as StateEvt from '../../../state-machinery/state-events';

const DAY_D = 'd';

export default class CalendarModel {

  constructor({
    selectedDate = null,
    currentDate = selectedDate || new Date(),
    currentMonth = currentDate
  }){
    this.currentDate = currentDate;
    this.currentMonth = currentMonth;
    this.selectedDate = selectedDate;
  }

  setCurrentMonth(currentMonth){
    return new CalendarModel({
      currentMonth,
      currentDate: this.currentDate
    })
  }

  nextMonth(){
    return this.currentMonth = addMonths(this.currentMonth, 1)
  }

  prevMonth(){
    return this.currentMonth = subMonths(this.currentMonth, 1)
  }

  nextDate(stateEvt){
    switch (stateEvt.type){
      case StateEvt.DOWN.type:
        return this.currentDate = addDays(this.currentDate, 7);
      case StateEvt.UP.type:
        return this.currentDate = subDays(this.currentDate, 7);
      case StateEvt.LEFT.type:
        return this.currentDate = subDays(this.currentDate, 1);
      case StateEvt.RIGHT.type:
        return this.currentDate = addDays(this.currentDate, 1);
      case StateEvt.PAGEUP.type:
        return this.currentDate = subMonths(this.currentDate, 1);
      case StateEvt.PAGEDOWN.type:
        return this.currentDate = addMonths(this.currentDate, 1);
      case StateEvt.HOME.type:
        return this.currentDate = startOfMonth(this.currentDate);
      case StateEvt.END.type:
        return this.currentDate = endOfMonth(this.currentDate);
      default:
    }
  }
} 

export function getDates(currentMonth=new Date(), selectedDate=null, leadingMonth=null, trailingMonth=null){
  const monthStart = startOfMonth(leadingMonth || currentMonth);
  const monthEnd = endOfMonth(trailingMonth || currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const weeks = [];

  let day = startDate;
  while (day <= endDate) {
    const week = {days:[], otherMonth: false};
    for (let i = 0; i < 7; i++) {
      week.days.push({
        day,
        formattedDate: format(day, DAY_D),
        otherMonth: !isSameMonth(day, currentMonth),
        disabled: false,
        selected: isSameDay(day, selectedDate)
      });
      day = addDays(day, 1);
    }
    
    if (week.days.every(day => day.otherMonth)){
      week.otherMonth = true;
    }

    weeks.push(week);
  }
  return weeks;

}

export function getCalendarClassNames(weeks){
  const currentWeeks = weeks.filter(week => !week.otherMonth)
  const currentWeekCount = currentWeeks.length;
  const otherWeekCount = weeks.length - currentWeekCount
  const className = `weeks-in-month-${currentWeekCount}`

  if (weeks[0].otherMonth){
    return [className, `other-weeks-leading-${otherWeekCount}`]
  } else if (weeks[weeks.length-1].otherMonth){
    return [className, `other-weeks-trailing-${otherWeekCount}`]
  } else {
    return [className]
  }

}