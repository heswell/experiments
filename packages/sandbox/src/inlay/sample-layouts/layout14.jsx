import React from 'react';
import { Application, DynamicContainer, FlexBox, Component } from '@heswell/inlay';

export default (width = 500, height = 400) =>
    <FlexBox style={{flexDirection: 'column', width: 500, height: 500,}}>
      <Component title='W Component' style={{height: 100, backgroundColor: 'rebeccapurple'}}/>
      <FlexBox style={{flex: 1, flexDirection: 'row'}}>
        <Component title='W Component' style={{flex:1, backgroundColor: 'red'}} resizeable header/>
        <Component title='Y Component' style={{flex:1, backgroundColor: 'green'}} resizeable header/>
        <Component title='ZY Component' style={{flex:1, backgroundColor: 'blue'}} resizeable header/>
        <Component title='R Component' style={{flex: 1, backgroundColor: 'yellow'}} resizeable header/>
      </FlexBox>
    </FlexBox>
