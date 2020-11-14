import React from 'react';
import styled from 'styled-components';

import { Select } from '@heswell/ui-controls';
import {usa_states} from './usa_states';

const StyledControl = styled.div`
  width: 150px;
  height: 24px;
  border: solid 1px #ccc;
  position: relative;
`;

export default {
  title: 'UI Controls/Select',
  component: Select
};

export const SimpleSelect = () =>
  <>
    <input type="text" defaultValue="start" />
    <StyledControl>
      <Select values={usa_states}/>
    </StyledControl>
    <input type="text" defaultValue="end" />
  </>

