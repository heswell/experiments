import React from 'react';

import { DatePicker } from '@heswell/ui-controls';


export default {
  title: 'UI Controls/DatePicker',
  component: DatePicker
};

export const SimpleDatePicker = () =>
  <>
    <input type="text" defaultValue="start" />
    <div style={{width: 150, height: 24, position: 'relative', border: 'solid 1px #ccc'}}>
      <DatePicker />
    </div>
    <input type="text" defaultValue="end" />
  </>

