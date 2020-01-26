import React from 'react';
import { Application, DynamicContainer, FlexBox, Component } from '@heswell/inlay';

export default (width = 500, height = 400) =>
<Application width={900} height={500}>
  <DynamicContainer style={{width:900,height:500}}>
    <FlexBox style={{flexDirection: 'column', width: '100%', height: '100%',}}>
      <Component title='W Component' style={{height: 100, backgroundColor: 'rebeccapurple'}}/>
      <FlexBox style={{flex: 1, flexDirection: 'row'}} dragStyle='flexbox-shuffle'>
        <Component title='W Component' style={{flex:1, backgroundColor: 'red'}} resizeable header={true}/>
        <Component title='Y Component' style={{flex:1, backgroundColor: 'green'}} resizeable header={true}/>
        <Component title='ZY Component' style={{flex:1, backgroundColor: 'blue'}} resizeable header={true}/>
        <Component title='R Component' style={{flex: 1, backgroundColor: 'yellow'}} resizeable header={true}/>
      </FlexBox>
    </FlexBox>
  </DynamicContainer>
</Application>
