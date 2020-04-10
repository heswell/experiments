import React from 'react';
import { Application, FlexBox, Component } from '@heswell/layout';

export default (width = 500, height = 400) =>
<FlexBox style={{width:600,height:300,flexDirection: 'row'}}>
  <Component title='Y Component' style={{flex: 1, backgroundColor: 'yellow'}} resizeable/>
    <FlexBox style={{flex: 1, flexDirection: 'column'}} resizeable>
      <Component title='B Component' style={{flex: 1, backgroundColor: 'blue'}} resizeable/>
      <Component title='R Component' style={{flex: 1, backgroundColor: 'red'}} resizeable/>
  </FlexBox>
</FlexBox>
