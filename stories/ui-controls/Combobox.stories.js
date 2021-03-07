import React from 'react';

import { ComboBox } from '@heswell/ui-controls';
import {usa_states} from './usa_states';

export default {
  title: 'UI Controls/ComboBox',
  component: ComboBox
};

export const SimpleComboBox = () =>
  <>
    <input type="text" defaultValue="start" />
    <div style={{width: 150, height: 24, position: 'relative', border: 'solid 1px #ccc'}}>
      <ComboBox values={usa_states}/>
    </div>
    <input type="text" defaultValue="end" />
  </>

