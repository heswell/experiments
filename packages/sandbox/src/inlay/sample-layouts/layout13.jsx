import React from 'react';
import { Application, FlexBox, Component } from '@heswell/inlay';

export default (width = 500, height = 400) =>
<Application width={600} height={300}>
  <FlexBox style={{flexDirection: 'row', width: '100%', height: '100%', border:'2px solid black',padding: '10 30', backgroundColor: '#ccc'}}>
    <Component title='Y Component' style={{flex: 1, backgroundColor: 'yellow'}} resizeable/>
    <Component title='R Component' style={{flex: 1, backgroundColor: 'red'}} resizeable/>
  </FlexBox>
</Application>
