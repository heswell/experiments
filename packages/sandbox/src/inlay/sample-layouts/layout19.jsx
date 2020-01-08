import React from 'react';
import { FlexBox, Component, DynamicContainer, TabbedContainer } from '@heswell/inlay';

export default (width = 500, height = 400) =>
    <TabbedContainer style={{width: 800, height: 500}} active={0} resizeable>
      <Component title='Rebecca' style={{backgroundColor: 'rebeccapurple'}} header/>
      <Component title='Red' style={{backgroundColor: 'red'}} header/>
      <Component title='Alice' style={{backgroundColor: 'aliceblue'}}/>
      <Component title='Cornflower' style={{backgroundColor: 'cornflowerblue'}}/>
    </TabbedContainer>
