import dateFns from 'date-fns';
import * as StateEvt from '../../../state-machinery/state-events';

const DAY_D = 'D';

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
    return this.currentMonth = dateFns.addMonths(this.currentMonth, 1)
  }

  prevMonth(){
    return this.currentMonth = dateFns.subMonths(this.currentMonth, 1)
  }

  nextDate(stateEvt){
    switch (stateEvt.type){
      case StateEvt.DOWN.type:
        return this.currentDate = dateFns.addDays(this.currentDate, 7);
      case StateEvt.UP.type:
        return this.currentDate = dateFns.subDays(this.currentDate, 7);
      case StateEvt.LEFT.type:
        return this.currentDate = dateFns.subDays(this.currentDate, 1);
      case StateEvt.RIGHT.type:
        return this.currentDate = dateFns.addDays(this.currentDate, 1);
      case StateEvt.PAGEUP.type:
        return this.currentDate = dateFns.subMonths(this.currentDate, 1);
      case StateEvt.PAGEDOWN.type:
        return this.currentDate = dateFns.addMonths(this.currentDate, 1);
      case StateEvt.HOME.type:
        return this.currentDate = dateFns.startOfMonth(this.currentDate);
      case StateEvt.END.type:
        return this.currentDate = dateFns.endOfMonth(this.currentDate);
      default:
    }
  }
} 

export function getDates(currentMonth=new Date(), selectedDate=null, leadingMonth=null, trailingMonth=null){
  const monthStart = dateFns.startOfMonth(leadingMonth || currentMonth);
  const monthEnd = dateFns.endOfMonth(trailingMonth || currentMonth);
  const startDate = dateFns.startOfWeek(monthStart);
  const endDate = dateFns.endOfWeek(monthEnd);
  const weeks = [];

  let day = startDate;
  while (day <= endDate) {
    const week = {days:[], otherMonth: false};
    for (let i = 0; i < 7; i++) {
      week.days.push({
        day,
        formattedDate: dateFns.format(day, DAY_D),
        otherMonth: !dateFns.isSameMonth(day, currentMonth),
        disabled: false,
        selected: dateFns.isSameDay(day, selectedDate)
      });
      day = dateFns.addDays(day, 1);
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