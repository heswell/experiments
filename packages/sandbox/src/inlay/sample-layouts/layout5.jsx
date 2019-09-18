import React from 'react';
import { Application, FlexBox, Component } from '@heswell/inlay';

export default (width = 500, height = 400) =>
  <Application width={width} height={height}>
    <FlexBox id="app-tower" className="SampleApp1" style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ height: 32, backgroundColor: 'yellow' }}></div>
      <FlexBox className="SampleApp2"
        style={{ flexDirection: 'row', flex: 1, padding: 20, borderWidth: 10, borderColor: 'black', borderStyle: 'solid' }}>
        <Component title="test 1"
          style={{ width: 100, backgroundColor: 'orange', borderWidth: 5, borderColor: 'green', borderStyle: 'solid' }} resizeable />
        <Component title="test 1"
          style={{ flex: 1, backgroundColor: 'blue', padding: 20 }} resizeable />
      </FlexBox>
      <div style={{ height: 32, backgroundColor: 'green' }} />
    </FlexBox>
  </Application>
