import React from 'react';
import { FlexBox, Component } from '@heswell/layout';

export default (width = 500, height = 400) =>
  <FlexBox style={{width:600,height:300,flexDirection: 'row', border:'2px solid black', backgroundColor: '#ccc'}}>
    <Component title='R Component' style={{flex: 1, backgroundColor: 'red', margin: 10, border: '3px solid black'}}/>
  </FlexBox>