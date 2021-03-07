import React from 'react';

import { Select } from '@heswell/ui-controls';
import {usa_states} from './usa_states';


export default {
  title: 'UI Controls/Select',
  component: Select
};

export const SimpleSelect = () =>
  <>
    <input type="text" defaultValue="start" />
    <div style={{width: 150, height: 24, position: 'relative', border: 'solid 1px #ccc'}}>
      <Select values={usa_states}/>
    </div>
    <input type="text" defaultValue="end" />
  </>

