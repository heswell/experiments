import React, { useRef, useState } from 'react';

import { FlexBox,  PlaceHolder, DynamicContainer } from '@heswell/layout';
import { Control, Select } from '@heswell/ui-controls';

import LayoutConfigurator from '../layout-configurator';
import {  LayoutTreeViewer } from '../layout-tree-viewer';
import ComponentPalette from '../component-palette/componentPalette';

import './layout-builder.css';

const NO_STYLES = {};

const availableValues = [
  'test 1',
  'test 2',
  'test 3',
  'test 4'
]

export default function LayoutBuilder({width = 800, height = 1000}){
  const [state, setState] = useState({
    layoutModel: undefined,
    managedLayoutNode: null,
    selectedLayoutNode: null,
    selectedLayoutId: null
  })

  const onLayoutModel = layoutModel => {
      setState(prevState => ({
          ...prevState,
          managedLayoutNode: layoutModel
      }));
  }

  // TODO look at layout configurator
  const handleChange = (feature, dimension, value, layoutStyle) => {
  }

  const selectComponent = selectedLayoutNode => {
    console.log(`select node ${selectedLayoutNode.$path} ${selectedLayoutNode.$id}`)
    setState({
      ...state,
      selectedLayoutNode
    })
  }

  function saveLayout(){
    const {managedLayoutNode: {children: layoutModel}} = state;
    const serializedLayout = JSON.stringify(layoutModel,layoutSerializer,2);
    console.log(`save ${serializedLayout}`)
  }

  const selectLayout = layoutId => setState({
    ...state,
    selectedLayoutId: layoutId
  })


  const layoutStyle = state.selectedLayoutNode === null
  ? NO_STYLES
  : state.selectedLayoutNode.style;


  const selectedIdx = availableValues.indexOf(state.selectedLayoutId)

  return (
      <FlexBox style={{flexDirection:"column",width: 900, height: 900, backgroundColor: 'rgb(90,90,90)'}}>
        <FlexBox style={{height: 60}}>
          <ComponentPalette style={{flex: 1, backgroundColor: 'inherit'}}/>
          <div className="layout-edit-controls" style={{backgroundColor: 'red',width: 150}}>
            <Control><Select onCommit={selectLayout} availableValues={availableValues} selectedIdx={selectedIdx} value={state.selectedLayoutId}/></Control>
            <button onClick={saveLayout}>Save</button>
          </div>
        </FlexBox>
        <DynamicContainer style={{flex:1}} dropTarget 
          onLayoutModel={onLayoutModel}
          selectedNode={state.selectedLayoutNode ? {
            $id: state.selectedLayoutNode.$id,
            $path: state.selectedLayoutNode.$path
          }: null}
          >
          <PlaceHolder style={{width: '100%',height: '100%', backgroundColor: 'rgba(100,0,0,.2)'}} resizeable/>
        </DynamicContainer>
        <FlexBox style={{flexDirection: 'row', height: 400}}>
          <LayoutTreeViewer
            style={{width: '50%'}} 
            tree={state.managedLayoutNode}
            onSelectNode={selectComponent}/>
          <LayoutConfigurator
            style={{width: '50%'}}
            layoutStyle={layoutStyle}
            onChange={handleChange}/>
        </FlexBox>
      </FlexBox>
  )
}

function layoutSerializer(key, value){
  if (key === 'computedStyle' || key === 'layoutStyle' || key === 'visualStyle' || key === '$path'){
    return;
  }
  if (key === 'children' && value !== undefined && value.length === 1 && value[0].type === 'layout'){
    return undefined;
  }

  if (key === 'children' && this.type === 'FlexBox'){
    return value.filter(child => child.type !== 'Splitter');
  }

  return value;
}
