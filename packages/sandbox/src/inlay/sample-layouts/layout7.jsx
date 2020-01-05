import React from 'react';
import { FlexBox, Component, DynamicContainer, TabbedContainer } from '@heswell/inlay';

export default (width = 500, height = 400) =>
  <FlexBox style={{width:600,height:300,flexDirection: 'row', backgroundColor: '#666'}}>
    <Component title='R Component' header={true} style={{backgroundColor: 'yellow',width: 150}} resizeable/>
    <DynamicContainer style={{flex:1}} resizeable>
      <TabbedContainer style={{flex:1}} active={0} resizeable>
        <Component title='Purple' style={{backgroundColor: 'rebeccapurple'}}/>
        <Component title='Red' style={{backgroundColor: 'red'}}/>
      </TabbedContainer>
    </DynamicContainer>
  </FlexBox>