import React, { useRef, useState } from 'react';

import { Flexbox,  Component as PlaceHolder, DraggableLayout } from '@heswell/layout';
import { Control, Select } from '@heswell/ui-controls';

// import LayoutConfigurator from '../layout-configurator';
// import {  LayoutTreeViewer } from '../layout-tree-viewer';
import Palette from '../palette/Palette';

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
    selectedId: null
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

  const selectLayout = id => setState({
    ...state,
    selectedId: id
  })


  const layoutStyle = state.selectedLayoutNode === null
  ? NO_STYLES
  : state.selectedLayoutNode.style;


  const selectedIdx = availableValues.indexOf(state.selectedId)

  return (
    <DraggableLayout>
      <Flexbox className="LayoutBuilder" style={{flexDirection:"column",width: 900, height: 900}}>
        <Flexbox className="builder-top" style={{height: 60, backgroundColor: 'rgb(90,90,90)'}}>
          <Palette style={{flex: 1, backgroundColor: 'inherit'}}/>
          <div className="layout-edit-controls" style={{backgroundColor: 'red', width: 250}}>
            <Control><Select onCommit={selectLayout} availableValues={availableValues} selectedIdx={selectedIdx} value={state.selectedId}/></Control>
            <button onClick={saveLayout}>Save</button>
          </div>
        </Flexbox>
        <DraggableLayout style={{flex:1}} dropTarget 
          onLayoutModel={onLayoutModel}
          // selectedNode={state.selectedLayoutNode ? {
          //   $id: state.selectedLayoutNode.$id,
          //   $path: state.selectedLayoutNode.$path
          // }: null}
          >
          <PlaceHolder style={{width: '100%',height: '100%', backgroundColor: 'lightgrey'}} resizeable/>
        </DraggableLayout>
        {/* <Flexbox style={{flexDirection: 'row', height: 400}}>
          {<LayoutTreeViewer
            style={{width: '50%'}} 
            tree={state.managedLayoutNode}
            onSelectNode={selectComponent}/>}
          <LayoutConfigurator
            style={{width: '50%'}}
            layoutStyle={layoutStyle}
            onChange={handleChange}/>
        </Flexbox> */}
      </Flexbox>
    </DraggableLayout>
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
