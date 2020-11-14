import React from 'react';
import styled from 'styled-components';

import { DatePicker } from '@heswell/ui-controls';
import {usa_states} from './usa_states';

const StyledControl = styled.div`
  width: 150px;
  height: 24px;
  border: solid 1px #ccc;
  position: relative;
`;

export default {
  title: 'UI Controls/DatePicker',
  component: DatePicker
};

export const SimpleDatePicker = () =>
  <>
    <input type="text" defaultValue="start" />
    <StyledControl>
      <DatePicker />
    </StyledControl>
    <input type="text" defaultValue="end" />
  </>

