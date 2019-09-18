import React from 'react';
import { Application, FlexBox, TabbedContainer, DynamicContainer, Component } from '@heswell/inlay';

export default (width = 900, height = 800) =>
  <Application>
    <FlexBox id="app-tower" className="SampleApp1" style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <FlexBox className="SampleApp2" style={{ flexDirection: "row", flex: 1 }}>
        <Component title="test 1" style={{ width: 100, backgroundColor: 'red' }} resizeable/>
        <DynamicContainer resizeable>
          <FlexBox className="SampleApp3" style={{ flexDirection: "column", flex: 1 }}>
            <FlexBox id="blanco" style={{ flexDirection: "row", flex: 1 }} resizeable>
              <Component title="Fixed Data Table" style={{ flex: 1 }} header={true} resizeable/>
              <Component title="A Div" style={{ flex: 1, backgroundColor: 'cornflowerblue' }} header={true}  resizeable/>
              <Component title="Div 2" style={{ flex: 1, backgroundColor: 'ivory' }} header={true}  resizeable/>
              <FlexBox title='Div 3' style={{ flexDirection: "column", flex: 1 }} header={{ height: 24 }}  resizeable>
                <Component style={{ flex: 1, backgroundColor: 'rebeccapurple' }} resizeable/>
                <Component style={{ flex: 1, backgroundColor: 'cornflowerblue' }} resizeable/>
              </FlexBox>
            </FlexBox>
            <FlexBox id="Flex1" style={{ flexDirection: "row", flex: 1 }} resizeable>
              <FlexBox style={{ flexDirection: "column", flex: 1 }} resizeable>
                <Component title="test 0.2" style={{ flex: 1 }} header resizeable />
                <FlexBox style={{ flexDirection: "row", flex: 1 }} resizeable>
                  <Component title="test 0.2" style={{ flex: 1 }} header resizeable/>
                  <Component title="A Div" style={{ flex: 1, backgroundColor: 'tomato' }} header resizeable />
                </FlexBox>
              </FlexBox>
              <Component title="test 0.4" style={{ width: 200, backgroundColor: 'green' }} header resizeable/>
              <Component id="C1" title="test 0.7" style={{ flex: 1 }} header resizeable/>
              <Component id="C2" title="A Divvy" style={{ flex: 1, backgroundColor: 'cornflowerblue' }} header resizeable/>
            </FlexBox>
            <TabbedContainer active={1} style={{ flex: 1 }} resizeable>
              <Component title="test 3" style={{ backgroundColor: 'ivory' }} header={true} />
              <Component title="test 7" style={{ backgroundColor: 'cornflowerblue' }} header={true} />
              <Component title="test long title 700" style={{ backgroundColor: 'steelblue' }} />
              <Component title="test 17" style={{ backgroundColor: 'cornflowerblue' }} />
              <Component title="test 27" style={{ backgroundColor: 'green' }} />
              <Component title="test 37" style={{ backgroundColor: 'orange' }} />
              <Component title="test 47" style={{ backgroundColor: 'red' }} />
            </TabbedContainer>
          </FlexBox>
        </DynamicContainer>
      </FlexBox>
      <div style={{ height: 32, backgroundColor: 'green' }} />
    </FlexBox>
  </Application>
