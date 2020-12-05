import React from 'react';
import {TerraceAlignment} from '../components/alignment-tools/terrace-with-alignment';

import { Flexbox, Stack, Component } from '@heswell/layout';
import "@heswell/layout/dist/index.css";
import '../assets/OpenSans.css';
import '../theme.css';
import './layout.css';
import './popup.css';
import './drop-menu.css';

export default {
  title: 'Layout/Flexbox',
  component: Flexbox
};


export const Empty = () =>
  <Flexbox style={{ width: 600, height: 300, flexDirection: 'row', border: '2px solid black', backgroundColor: '#ccc' }}>
  </Flexbox>

export const SingleChild = () =>
  <Flexbox style={{ width: 600, height: 300, flexDirection: 'row', border: '2px solid black', backgroundColor: '#ccc' }}>
    <Component title='R Component' style={{ flex: 1, backgroundColor: 'red', margin: 10, border: '3px solid black' }} />
  </Flexbox>

export const TerraceTwoChildren = () =>
  <Flexbox style={{ width: 600, height: 300, flexDirection: 'row', border: '2px solid black', margin: 20, padding: '10px 30px', backgroundColor: '#ccc' }}>
    <Component title='Y Component' style={{ flex: 1, backgroundColor: 'yellow', border: '10px solid rgba(0,0,0,.4)' }} />
    <Component title='R Component' style={{ flex: 1, backgroundColor: 'red' }} />
  </Flexbox>

export const TerraceAutoSizing = () =>
  <Flexbox style={{ width: '80%', height: 300, flexDirection: 'row', border: '2px solid black', margin: 20, padding: '10px 30px', backgroundColor: '#ccc' }}>
    <Component title='Y Component' style={{ width: 200, minHeight: 200, maxHeight: 230, backgroundColor: 'yellow', border: '10px solid rgba(0,0,0,.4)' }} resizeable />
    <Component title='R Component' style={{ width: 300, height: 300, backgroundColor: 'red' }} resizeable />
  </Flexbox>

export const TerraceWithHeader = () =>
  <Flexbox title='Flexie' header={true}
    style={{ width: 600, height: 300, flexDirection: 'row', border: '2px solid black', margin: 20, padding: '10 30', backgroundColor: '#ccc' }}>
    <Component title='Y Component'
      style={{ flex: 1, backgroundColor: 'yellow', border: '10px solid rgba(0,0,0,.4)' }} />
    <Component title='R Component' style={{ flex: 1, backgroundColor: 'red' }} />
  </Flexbox>

export const TowerWithinTerrace = () =>
  <Flexbox style={{ width: 600, height: 300, flexDirection: 'row' }}>
    <Component title='Y Component' style={{ flex: 1, backgroundColor: 'yellow' }} resizeable />
    <Flexbox style={{ flex: 1, flexDirection: 'column' }} resizeable>
      <Component title='B Component' style={{ flex: 1, backgroundColor: 'blue' }} resizeable />
      <Component title='R Component' style={{ flex: 1, backgroundColor: 'red' }} resizeable />
    </Flexbox>
  </Flexbox>

export const TerraceWithAlignment = () => <TerraceAlignment />;

export const QuadTerraceWithinTower = () =>
  <Flexbox style={{ flexDirection: 'column', width: 500, height: 500, }}>
    <Component title='W Component' style={{ height: 100, backgroundColor: 'rebeccapurple' }} />
    <Flexbox style={{ flex: 1, flexDirection: 'row' }}>
      <Component title='W Component' style={{ flex: 1, backgroundColor: 'red' }} resizeable header />
      <Component title='Y Component' style={{ flex: 1, backgroundColor: 'green' }} resizeable header />
      <Component title='ZY Component' style={{ flex: 1, backgroundColor: 'blue' }} resizeable header />
      <Component title='R Component' style={{ flex: 1, backgroundColor: 'yellow' }} resizeable header />
    </Flexbox>
  </Flexbox>

export const DeeperNesting = () =>
  <Flexbox style={{ width: 800, height: 500, flexDirection: 'row' }}>
    <Component title='Y Component' style={{ flex: 1, backgroundColor: 'yellow' }} header resizeable />
    <Flexbox style={{ flex: 1, flexDirection: 'column' }} resizeable>
      <Flexbox style={{ flex: 2, flexGrow: 1, flexShrink: 1, flexDirection: 'row' }} resizeable>
        <Flexbox style={{ flex: 1, flexDirection: 'column' }} resizeable>
          <Component title='B Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'orange' }} header resizeable />
          <Component title='R Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'brown' }} header resizeable />
        </Flexbox>
        <Component title='R Component' style={{ flex: 1, backgroundColor: 'rebeccapurple' }} header resizeable />
      </Flexbox>
      <Component title='B Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'blue' }} header resizeable />
      <Component title='R Component' style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'red' }} header resizeable />
    </Flexbox>
  </Flexbox>

// export const DynamicContainerJSXContent = () =>
//   <Flexbox style={{ width: 600, height: 300, flexDirection: 'row', backgroundColor: '#666' }}>
//     <Component title='R Component' header={true} style={{ backgroundColor: 'yellow', width: 150 }} resizeable />
//     <DynamicContainer style={{ flex: 1 }} resizeable>
//       <TabbedContainer style={{ flex: 1 }} active={0} resizeable>
//         <Component title='Purple' style={{ backgroundColor: 'rebeccapurple' }} />
//         <Component title='Red' style={{ backgroundColor: 'red' }} />
//       </TabbedContainer>
//     </DynamicContainer>
//   </Flexbox>

// export const DynamicContainerJSONContent = () =>
//   <Flexbox style={{ width: 600, height: 300, flexDirection: 'row', backgroundColor: '#666' }}>
//     <Component title='R Component' header={true} style={{ backgroundColor: 'yellow', width: 150 }} resizeable />
//     <DynamicContainer style={{ flex: 1 }} resizeable contentModel={{
//       $id: 'TC1', type: 'TabbedContainer', active: 1, style: { flex: 1 }, children: [
//         { $id: 'c1', type: 'Component', title: 'Purple Rain', style: { backgroundColor: 'rebeccapurple' } },
//         { $id: 'c2', type: 'Component', title: 'Red Eye', style: { backgroundColor: 'red' } }
//       ]
//     }} />
//   </Flexbox>


export const ComplexNestedLayout = () =>
  <Flexbox id="app-tower" className="SampleApp1" style={{ flexDirection: "column", width: 1200, height: 1000 }}>
    <Flexbox className="SampleApp2" style={{ flexDirection: "row", flex: 1 }}>
      <Component title="test 1" style={{ width: 100, backgroundColor: 'red' }} resizeable />
        <Flexbox className="SampleApp3" style={{ flexDirection: "column", flex: 1 }}>
          <Flexbox id="blanco" style={{ flexDirection: "row", flex: 1 }} resizeable>
            <Component title="Fixed Data Table" style={{ flex: 1, backgroundColor: 'brown' }} header={true} resizeable />
            <Component title="A Div" style={{ flex: 1, backgroundColor: 'cornflowerblue' }} header={true} resizeable />
            <Component title="Div 2" style={{ flex: 1, backgroundColor: 'ivory' }} header={true} resizeable />
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
