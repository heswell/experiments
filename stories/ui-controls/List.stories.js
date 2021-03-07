import React, { useState } from 'react';

import { List, ListItem } from '@heswell/ui-controls';
import {usa_states} from './usa_states';


export default {
  title: 'UI Controls/List',
  component: List
};

export const SimpleList = () => {
  const [selectedValue, setSelectedValue] = useState('');
  console.log(`render example`)
  return (
    <>
      <input type="text" />
      <div style={{fontFamily: "Roboto", width: 150, height: 400, position: 'relative', border: 'solid 1px #ccc'}}>
        <List
          values={usa_states}
          onChange={value => setSelectedValue(value)}
        />
      </div>
      <input type="text" />
      <div>{usa_states[selectedValue]}</div>
    </>
  )
}

export const DeclarativeList = () => {
  const [selectedValue, setSelectedValue] = useState('');
  console.log(`render example`)
  return (
    <>
      <input type="text" />
      <div style={{fontFamily: "Roboto", width: 150, height: 400, position: 'relative', border: 'solid 1px #ccc'}}>
        <List
          onChange={value => setSelectedValue(value)}
        >
          <ListItem>Value 1</ListItem>
          <ListItem>Value 2</ListItem>
          <ListItem>Value 3</ListItem>
          <ListItem>Value 4</ListItem>
        </List>
      </div>
      <input type="text" />
      <div>{usa_states[selectedValue]}</div>
    </>
  )
}

export const ControlledList = () => {
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [hilitedIdx, setHilitedIdx] = useState(-1);

  const handleChangeControlled = idx => {
    console.log(`controlled clicked ${idx}`)
  }

  return (
    <div style={{ display: 'flex' }}>
      <div>
        <input type="text" />
        <StyledControl>
          <List
            values={usa_states}
            onChange={idx => setSelectedIdx(idx)}
            onHilight={idx => setHilitedIdx(idx)}
          />
        </StyledControl>
        <input type="text" />
      </div>
      <div>
        <input type="text" />
        <StyledControl>
          <List
            hilitedIdx={hilitedIdx}
            selectedIdx={selectedIdx}
            values={usa_states}
            onChange={handleChangeControlled}
          />
        </StyledControl>
        <input type="text" />
      </div>
    </div>
  )
}
