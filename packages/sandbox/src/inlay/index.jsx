import React from 'react';
import ReactDOM from 'react-dom';
import { Application, FlexBox, TabbedContainer, DynamicContainer, Component, registerClass } from '@heswell/inlay';

const SampleLayout = ({ sample, width, height }) => {

  switch (sample) {
    case 1: return layout1(width, height);
    case 2: return layout2(width, height);
    default: return layout1(width, height);
  }

}

const layout1 = (width = 500, height = 400) =>
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

const layout2 = (width = 900, height = 800) =>
  <Application>
    <FlexBox id="app-tower" className="SampleApp1" style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <FlexBox className="SampleApp2" style={{ flexDirection: "row", flex: 1 }}>
        <Component title="test 1" style={{ width: 100, backgroundColor: 'red' }} resizeable/>
        <DynamicContainer resizeable>
          <FlexBox className="SampleApp3" style={{ flexDirection: "column", flex: 1 }}>
            <FlexBox id="blanco" style={{ flexDirection: "row", flex: 1 }} resizeable>
              <Component title="Fixed Data Table" style={{ flex: 1 }} header={true} />
              <Component title="A Div" style={{ flex: 1, backgroundColor: 'cornflowerblue' }} header={true} />
              <Component title="Div 2" style={{ flex: 1, backgroundColor: 'ivory' }} header={true} />
              <FlexBox title='Div 3' style={{ flexDirection: "column", flex: 1 }} header={{ height: 24 }}>
                <Component style={{ flex: 1, backgroundColor: 'rebeccapurple' }} resizeable/>
                <Component style={{ flex: 1, backgroundColor: 'cornflowerblue' }} resizeable/>
              </FlexBox>
            </FlexBox>
            <FlexBox id="Flex1" style={{ flexDirection: "row", flex: 1 }} resizeable>
              <FlexBox style={{ flexDirection: "column", flex: 1 }}>
                <Component title="test 0.2" style={{ flex: 1 }} header={true} />
                <FlexBox style={{ flexDirection: "row", flex: 1 }}>
                  <Component title="test 0.2" style={{ flex: 1 }} header={true} />
                  <Component title="A Div" style={{ flex: 1, backgroundColor: 'tomato' }} header={true} />
                </FlexBox>
              </FlexBox>
              <Component title="test 0.4" style={{ flex: 0, width: 200, backgroundColor: 'green' }} header={true} />
              <Component id="C1" title="test 0.7" style={{ flex: 1 }} header={true} />
              <Component id="C2" title="A Divvy" style={{ flex: 1, backgroundColor: 'cornflowerblue' }} header={true} />
            </FlexBox>
            <TabbedContainer active={1} style={{ flex: 1 }}>
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
      <div style={{ height: 32, flex: 0, backgroundColor: 'green' }} />
    </FlexBox>
  </Application>


ReactDOM.render(
  <>
    <SampleLayout sample={2} />
  </>,
  document.getElementById('root'));
