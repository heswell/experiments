import React from 'react';
import styled from '@emotion/styled';
import {Header} from '../components/design-time';

import { FlexBox, TabbedContainer, DynamicContainer, Component } from '@heswell/layout';
import './layout.css';
import './popup.css';
import './drop-menu.css';

export default {
  title: 'Layout/Flexbox',
  component: FlexBox
};

const GreyFlexBox = styled(FlexBox)`
  background-color: #ccc;
`;

export const SingleChild = () => 
  <FlexBox style={{width:600,height:300,flexDirection: 'row', border:'2px solid black', backgroundColor: '#ccc'}}>
    <Component title='R Component' style={{flex: 1, backgroundColor: 'red', margin: 10, border: '3px solid black'}}/>
  </FlexBox>

export const TerraceTwoChildren = () =>
  <FlexBox style={{width:600,height:300,flexDirection: 'row', border:'2px solid black',margin: 20, padding: '10 30', backgroundColor: '#ccc'}}>
    <Component title='Y Component' style={{flex: 1, backgroundColor: 'yellow', border: '10px solid rgba(0,0,0,.4)'}}/>
    <Component title='R Component' style={{flex: 1, backgroundColor: 'red'}}/>
  </FlexBox>

export const TerraceWithHeader = () =>
<FlexBox title='Flexie' header={true} 
    style={{ width:600, height:300, flexDirection: 'row',  border:'2px solid black', margin: 20, padding: '10 30', backgroundColor: '#ccc'}}>
  <Component title='Y Component' 
    style={{ flex: 1, backgroundColor: 'yellow', border: '10px solid rgba(0,0,0,.4)' } }/>
  <Component title='R Component' style={{ flex: 1,  backgroundColor: 'red' }}/>
</FlexBox>

export const TowerWithinTerrace = () =>
<FlexBox style={{width:600,height:300,flexDirection: 'row'}}>
  <Component title='Y Component' style={{flex: 1, backgroundColor: 'yellow'}} resizeable/>
    <FlexBox style={{flex: 1, flexDirection: 'column'}} resizeable>
      <Component title='B Component' style={{flex: 1, backgroundColor: 'blue'}} resizeable/>
      <Component title='R Component' style={{flex: 1, backgroundColor: 'red'}} resizeable/>
  </FlexBox>
</FlexBox>

export const TerraceAlignment = () => {

  return (
  <GreyFlexBox
    header={{height: 60, component: Header}}
    style={{
      width:600,
      height:300,
      alignItems: 'center',
      justifyContent: 'space-around',
      flexDirection: 'row',
      border:'2px solid black',
      margin: 20, 
      padding: '10 30'}}>
    <Component style={{flex: '0 1 50px', height: 32, backgroundColor: 'yellow'}}/>
    <Component style={{width: '20%', height: 50, backgroundColor: 'red'}}/>
    <Component style={{width: '20%', height: 32, backgroundColor: 'cornflowerblue'}}/>
    <Component style={{width: '20%', height: 100, backgroundColor: 'brown'}}/>
  </GreyFlexBox>
  )};

export const QuadTerraceWithinTower = () =>
  <FlexBox style={{flexDirection: 'column', width: 500, height: 500,}}>
  <Component title='W Component' style={{height: 100, backgroundColor: 'rebeccapurple'}}/>
  <FlexBox style={{flex: 1, flexDirection: 'row'}}>
    <Component title='W Component' style={{flex:1, backgroundColor: 'red'}} resizeable header/>
    <Component title='Y Component' style={{flex:1, backgroundColor: 'green'}} resizeable header/>
    <Component title='ZY Component' style={{flex:1, backgroundColor: 'blue'}} resizeable header/>
    <Component title='R Component' style={{flex: 1, backgroundColor: 'yellow'}} resizeable header/>
  </FlexBox>
  </FlexBox>

export const DeeperNesting = () =>
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

export const DynamicContainerJSXContent = () =>
  <FlexBox style={{width:600,height:300,flexDirection: 'row', backgroundColor: '#666'}}>
    <Component title='R Component' header={true} style={{backgroundColor: 'yellow',width: 150}} resizeable/>
    <DynamicContainer style={{flex:1}} resizeable>
      <TabbedContainer style={{flex:1}} active={0} resizeable>
        <Component title='Purple' style={{backgroundColor: 'rebeccapurple'}}/>
        <Component title='Red' style={{backgroundColor: 'red'}}/>
      </TabbedContainer>
    </DynamicContainer>
  </FlexBox>

export const DynamicContainerJSONContent = () =>
  <FlexBox style={{width:600,height:300,flexDirection: 'row', backgroundColor: '#666'}}>
    <Component title='R Component' header={true} style={{backgroundColor: 'yellow',width: 150}} resizeable/>
    <DynamicContainer style={{flex:1}} resizeable contentModel={{
        $id: 'TC1', type: 'TabbedContainer', active: 1, style: {flex: 1}, children: [
          {$id: 'c1', type: 'Component', title:'Purple Rain', style:{backgroundColor: 'rebeccapurple'}},
          {$id: 'c2', type: 'Component', title:'Red Eye', style:{backgroundColor: 'red'}}
    ]}}/>
  </FlexBox>


export const ComplexNestedLayout = () =>
  <FlexBox id="app-tower" className="SampleApp1" style={{ flexDirection: "column", width: 1200, height: 1000 }}>
    <FlexBox className="SampleApp2" style={{ flexDirection: "row", flex: 1 }}>
      <Component title="test 1" style={{ width: 100, backgroundColor: 'red' }} resizeable/>
      <DynamicContainer style={{flex: 1}} dropTarget resizeable>
        <FlexBox className="SampleApp3" style={{ flexDirection: "column", flex: 1 }}>
          <FlexBox id="blanco" style={{ flexDirection: "row", flex: 1 }} resizeable>
            <Component title="Fixed Data Table" style={{ flex: 1, backgroundColor: 'brown' }} header={true} resizeable/>
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
