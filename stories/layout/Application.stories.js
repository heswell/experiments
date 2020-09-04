import React from 'react';

import { Application, DynamicContainer, FlexBox, Component } from '@heswell/layout';

export default {
  title: 'Layout/Application',
  component: Application
};

export const SingleChild = ({width = 500, height = 400}) =>
  <Application style={{width:800,height:300,backgroundColor: 'brown'}}>
    <Component title='R Component' header={true} style={{backgroundColor: 'yellow',left: 200,top:50,width: 100, height: 100}}/>
  </Application>

export const FullSizeFlexboxChild = () => 
  <Application width={600} height={300}>
    <FlexBox style={{flexDirection: 'row', width: '100%', height: '100%', border:'2px solid black',padding: '10 30', backgroundColor: '#ccc'}}>
      <Component title='Y Component' style={{flex: 1, backgroundColor: 'yellow'}} resizeable/>
      <Component title='R Component' style={{flex: 1, backgroundColor: 'red'}} resizeable/>
    </FlexBox>
  </Application>


export const TowerTerraceMarginsAndBorders = ({width = 800, height = 600}) =>
  <Application width={width} height={height}>
  <FlexBox id="app-tower" className="SampleApp1" style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
    <div style={{ height: 32, backgroundColor: 'yellow' }}></div>
    <FlexBox className="SampleApp2"
      style={{ flexDirection: 'row', flex: 1, padding: 20, border: '10px solid black'}}>
      <Component title="test 1"
        style={{ width: 100, backgroundColor: 'orange', border: '5px solid green' }} resizeable />
      <Component title="test 1"
        style={{ flex: 1, backgroundColor: 'blue', padding: 20 }} resizeable />
    </FlexBox>
    <div style={{ height: 32, backgroundColor: 'green' }} />
  </FlexBox>
  </Application>

export const FlexboxShuffle = () =>
  <Application width={900} height={500}>
    <DynamicContainer style={{width:900,height:500}}>
      <FlexBox style={{flexDirection: 'column', width: '100%', height: '100%',}}>
        <Component title='W Component' style={{height: 100, backgroundColor: 'rebeccapurple'}}/>
        <FlexBox style={{flex: 1, flexDirection: 'row'}} dragStyle='flexbox-shuffle'>
          <Component title='W Component' style={{flex:1, backgroundColor: 'red'}} resizeable header={true}/>
          <Component title='Y Component' style={{flex:1, backgroundColor: 'green'}} resizeable header={true}/>
          <Component title='ZY Component' style={{flex:1, backgroundColor: 'blue'}} resizeable header={true}/>
          <Component title='R Component' style={{flex: 1, backgroundColor: 'yellow'}} resizeable header={true}/>
        </FlexBox>
      </FlexBox>
    </DynamicContainer>
  </Application>
