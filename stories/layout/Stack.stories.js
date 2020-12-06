import React from 'react';

import { Component, Stack } from '@heswell/layout';

export default {
  title: 'Layout/Stack',
  component: Stack,
};


export const FourTabs = () =>
<Stack style={{width: 800, height: 500}} active={0} resizeable>
  <Component title='Rebecca' style={{backgroundColor: 'rebeccapurple'}} header/>
  <Component title='Red' style={{backgroundColor: 'red'}} header/>
  <Component title='Alice' style={{backgroundColor: 'aliceblue'}} header/>
  <Component title='Cornflower' style={{backgroundColor: 'cornflowerblue'}} header/>
</Stack>
