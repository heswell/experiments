import React from 'react';
import { FlexBox, Component, DynamicContainer } from '@heswell/inlay';

export default () =>
  <FlexBox style={{width:600,height:300,flexDirection: 'row', backgroundColor: '#666'}}>
    <Component title='R Component' header={true} style={{backgroundColor: 'yellow',width: 150}} resizeable/>
    <DynamicContainer style={{flex:1}} resizeable contentModel={{
        $id: 'TC1', type: 'TabbedContainer', active: 1, style: {flex: 1}, children: [
          {$id: 'c1', type: 'Component', title:'Purple Rain', style:{backgroundColor: 'rebeccapurple'}},
          {$id: 'c2', type: 'Component', title:'Red Eye', style:{backgroundColor: 'red'}}
    ]}}/>
  </FlexBox>