import React from 'react';


import {
  // registerComponent,
  useViewContext,
  Component,
  Flexbox,
  Stack,
  View,
  DraggableLayout,
} from '@heswell/layout';
import Builder from '../components/layout-builder/layout-builder';

import "@heswell/layout/dist/index.css";
import '../assets/OpenSans.css';
import '../theme.css';
import './layout.css';
import './popup.css';
import './drop-menu.css';

export default {
  title: 'Layout/Drag and Drop',
  component: Flexbox
};

const Box = props => (
  <div style={{
    backgroundColor: 'lightgrey',
    cursor: 'pointer',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}
  {...props}
/>);

const DraggableBox = (props) => {

  const DraggableBoxBase = () => {
    const {dispatch, title} = useViewContext();
    const handleMouseDown = (e) => {
      // TODO should be able to just dispatch the event
      dispatch({type: 'mousedown'}, e);
    }
  return <Box onMouseDown={handleMouseDown}>{title}</Box>
  }

 return ( 
    <View {...props}>
       <DraggableBoxBase /> 
    </View>
  )
}

export const SimpleNesting = () =>
  <DraggableLayout>
    <Flexbox style={{ width: 800, height: 500, flexDirection: 'row' }}>
      <View header resizeable title='Test 1'>
        <Component style={{ flex: 1, backgroundColor: 'yellow' }}/>
      </View>
      <Flexbox style={{ flex: 1, flexDirection: 'column' }} resizeable>
        <Flexbox style={{ flex: 2, flexGrow: 1, flexShrink: 1, flexDirection: 'row' }} resizeable>
            <View header resizeable title='Test 2' style={{flex: 1}}>
              <Component style={{ height: '100%', backgroundColor: 'orange' }}/>
            </View>
          <View header resizeable title='Test 4' style={{flex: 1}}>
            <Component style={{ height: '100%', backgroundColor: 'rebeccapurple' }}  />
          </View>
        </Flexbox>
        <View header resizeable title='Test 5' style={{flex: 1}}>
          <Component style={{ height: '100%', backgroundColor: 'blue' }} />
        </View>
        <View header resizeable title='Test 6' style={{flex: 1}}>
          <Component style={{ height: '100%', backgroundColor: 'pink' }} />
        </View>
      </Flexbox>
    </Flexbox>
  </DraggableLayout>

export const CustomDrag = () =>
  // <SelectionProvider>
    <DraggableLayout>
      <Flexbox style={{ width: 800, height: 500, flexDirection: 'row' }} splitterSize={1}>
        <DraggableBox title='Y Component' style={{ flex: 1 }} resizeable />
        <Flexbox style={{ flex: 1, flexDirection: 'column' }} resizeable splitterSize={1}>
          <Flexbox style={{ flex: 2, flexGrow: 1, flexShrink: 1, flexDirection: 'row' }} resizeable splitterSize={1}>
            <Flexbox style={{ flex: 1, flexDirection: 'column' }} resizeable splitterSize={1}>
              <DraggableBox title='B Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1 }} resizeable />
              <DraggableBox title='R Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1 }} resizeable />
            </Flexbox>
            <DraggableBox title='T Component' style={{ flex: 1 }} resizeable />
          </Flexbox>
          <DraggableBox title='Q Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1 }} resizeable />
          <DraggableBox title='Z Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1 }} resizeable />
        </Flexbox>
      </Flexbox>
  </DraggableLayout>
  // </SelectionProvider>

export const ComplexNestedLayout = () =>
  <DraggableLayout>
    <Flexbox className="SampleApp1" style={{ flexDirection: "column", width: 1200, height: 1000 }}>
      <Flexbox className="SampleApp2" style={{ flexDirection: "row", flex: 1 }}>
        <Component title="test 1" style={{ width: 100, backgroundColor: 'red' }} resizeable />
          <Flexbox className="SampleApp3" style={{ flexDirection: "column", flex: 1 }}>
            <Flexbox id="blanco" style={{ flexDirection: "row", flex: 1 }} resizeable>
              <Component title="Fixed Data Table" style={{ flex: 1, backgroundColor: 'brown' }} header resizeable />
              <Component title="A Div" style={{ flex: 1, backgroundColor: 'cornflowerblue' }} header resizeable />
              <Component title="Div 2" style={{ flex: 1, backgroundColor: 'ivory' }} header resizeable />
              <Flexbox title='Div 3' style={{ flexDirection: "column", flex: 1 }} header={{ height: 24 }} resizeable>
                <Component style={{ flex: 1, backgroundColor: 'rebeccapurple' }} resizeable />
                <Component style={{ flex: 1, backgroundColor: 'cornflowerblue' }} resizeable />
              </Flexbox>
            </Flexbox>
            <Flexbox id="Flex1" style={{ flexDirection: "row", flex: 1 }} resizeable>
              <Flexbox style={{ flexDirection: "column", flex: 1 }} resizeable>
                <Component title="test 0.2" style={{ flex: 1 }} header resizeable />
                <Flexbox style={{ flexDirection: "row", flex: 1 }} resizeable>
                  <Component title="test 0.2" style={{ flex: 1 }} header resizeable />
                  <Component title="A Div" style={{ flex: 1, backgroundColor: 'tomato' }} header resizeable />
                </Flexbox>
              </Flexbox>
              <Component title="test 0.4" style={{ width: 200, backgroundColor: 'green' }} header resizeable />
              <Component id="C1" title="test 0.7" style={{ flex: 1 }} header resizeable />
              <Component id="C2" title="A Divvy" style={{ flex: 1, backgroundColor: 'cornflowerblue' }} header resizeable />
            </Flexbox>
            <Stack active={1} style={{ flex: 1 }} resizeable>
              <Component title="test 3" style={{ backgroundColor: 'ivory' }} header={true} />
              <Component title="test 7" style={{ backgroundColor: 'cornflowerblue' }} header={true} />
              <Component title="test long title 700" style={{ backgroundColor: 'steelblue' }} />
              <Component title="test 17" style={{ backgroundColor: 'cornflowerblue' }} />
              <Component title="test 27" style={{ backgroundColor: 'green' }} />
              <Component title="test 37" style={{ backgroundColor: 'orange' }} />
              <Component title="test 47" style={{ backgroundColor: 'red' }} />
            </Stack>
          </Flexbox>
      </Flexbox>
      <div style={{ height: 32, backgroundColor: 'green' }} />
    </Flexbox>
  </DraggableLayout>

export const NestadDragContainerWithPalette = () =>
  <Builder />
