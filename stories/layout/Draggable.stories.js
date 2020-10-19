import React from 'react';
import styled from '@emotion/styled';


import {
  Component,
  DynamicContainer,
  FlexBox,
  TabbedContainer,
  DraggableLayout,
  SelectionProvider
} from '@heswell/layout';

import './layout.css';
import './popup.css';
import './drop-menu.css';

export default {
  title: 'Layout/Draggable',
  component: FlexBox
};

const Box = styled.div`
  background-color: lightgrey;
  cursor: pointer;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DraggableBox = ({ style, onMouseDown }) =>
  <div style={style}>
    <Box onMouseDown={onMouseDown}> Hello Mum</Box>
  </div>

export const DeeperNesting = () =>
  <DraggableLayout>
    <FlexBox style={{ width: 800, height: 500, flexDirection: 'row' }}>
      <Component title='Y Component' style={{ flex: 1, backgroundColor: 'yellow' }} header resizeable />
      <FlexBox style={{ flex: 1, flexDirection: 'column' }} resizeable>
        <FlexBox style={{ flex: 2, flexGrow: 1, flexShrink: 1, flexDirection: 'row' }} resizeable>
          <FlexBox style={{ flex: 1, flexDirection: 'column' }} resizeable>
            <Component title='B Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'orange' }} header resizeable />
            <Component title='R Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'brown' }} header resizeable />
          </FlexBox>
          <Component title='R Component' style={{ flex: 1, backgroundColor: 'rebeccapurple' }} header resizeable />
        </FlexBox>
        <Component title='B Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'blue' }} header resizeable />
        <Component title='R Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'red' }} header resizeable />
      </FlexBox>
    </FlexBox>
  </DraggableLayout>

export const DeeperNestingNoHandles = () =>
  // <SelectionProvider>
  //   <DraggableLayout>
      <FlexBox style={{ width: 800, height: 500, flexDirection: 'row' }} splitterSize={1}>
        <DraggableBox title='Y Component' style={{ flex: 1, backgroundColor: 'yellow' }} resizeable />
        <FlexBox style={{ flex: 1, flexDirection: 'column' }} resizeable splitterSize={1}>
          <FlexBox style={{ flex: 2, flexGrow: 1, flexShrink: 1, flexDirection: 'row' }} resizeable splitterSize={1}>
            <FlexBox style={{ flex: 1, flexDirection: 'column' }} resizeable splitterSize={1}>
              <DraggableBox title='B Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'orange' }} resizeable />
              <DraggableBox title='R Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'brown' }} resizeable />
            </FlexBox>
            <DraggableBox title='R Component' style={{ flex: 1, backgroundColor: 'rebeccapurple' }} resizeable />
          </FlexBox>
          <DraggableBox title='B Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'blue' }} resizeable />
          <DraggableBox title='R Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'red' }} resizeable />
        </FlexBox>
      </FlexBox>
  //   </DraggableLayout>
  // </SelectionProvider>

export const ComplexNestedLayout = () =>
  <DraggableLayout>
    <FlexBox className="SampleApp1" style={{ flexDirection: "column", width: 1200, height: 1000 }}>
      <FlexBox className="SampleApp2" style={{ flexDirection: "row", flex: 1 }}>
        <Component title="test 1" style={{ width: 100, backgroundColor: 'red' }} resizeable />
        <DynamicContainer style={{ flex: 1 }} dropTarget resizeable>
          <FlexBox className="SampleApp3" style={{ flexDirection: "column", flex: 1 }}>
            <FlexBox id="blanco" style={{ flexDirection: "row", flex: 1 }} resizeable>
              <Component title="Fixed Data Table" style={{ flex: 1, backgroundColor: 'brown' }} header resizeable />
              <Component title="A Div" style={{ flex: 1, backgroundColor: 'cornflowerblue' }} header resizeable />
              <Component title="Div 2" style={{ flex: 1, backgroundColor: 'ivory' }} header resizeable />
              <FlexBox title='Div 3' style={{ flexDirection: "column", flex: 1 }} header={{ height: 24 }} resizeable>
                <Component style={{ flex: 1, backgroundColor: 'rebeccapurple' }} resizeable />
                <Component style={{ flex: 1, backgroundColor: 'cornflowerblue' }} resizeable />
              </FlexBox>
            </FlexBox>
            <FlexBox id="Flex1" style={{ flexDirection: "row", flex: 1 }} resizeable>
              <FlexBox style={{ flexDirection: "column", flex: 1 }} resizeable>
                <Component title="test 0.2" style={{ flex: 1 }} header resizeable />
                <FlexBox style={{ flexDirection: "row", flex: 1 }} resizeable>
                  <Component title="test 0.2" style={{ flex: 1 }} header resizeable />
                  <Component title="A Div" style={{ flex: 1, backgroundColor: 'tomato' }} header resizeable />
                </FlexBox>
              </FlexBox>
              <Component title="test 0.4" style={{ width: 200, backgroundColor: 'green' }} header resizeable />
              <Component id="C1" title="test 0.7" style={{ flex: 1 }} header resizeable />
              <Component id="C2" title="A Divvy" style={{ flex: 1, backgroundColor: 'cornflowerblue' }} header resizeable />
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
  </DraggableLayout>
