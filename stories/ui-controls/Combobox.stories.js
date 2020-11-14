import React from 'react';
import styled from 'styled-components';

import { ComboBox } from '@heswell/ui-controls';
import {usa_states} from './usa_states';

const StyledControl = styled.div`
  width: 150px;
  height: 24px;
  border: solid 1px #ccc;
  position: relative;
`;

export default {
  title: 'UI Controls/ComboBox',
  component: ComboBox
};

export const SimpleComboBox = () =>
  <>
    <input type="text" defaultValue="start" />
    <StyledControl>
      <ComboBox values={usa_states}/>
    </StyledControl>
    <input type="text" defaultValue="end" />
  </>

