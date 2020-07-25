import React, { useEffect, useRef, useState } from 'react';
import {  FlexBox,  PlaceHolder, DynamicContainer } from '@heswell/layout';
import { Control, Select } from '@heswell/ui-controls';
import {LayoutConfigurator,LayoutTreeViewer, ComponentPalette} from '@heswell/layout-extras'
import {ComponentRegistryProvider} from '../../../layout/src/registry/component-registry';
import defaultComponents from '../../../layout/src/containers/mui-components';
import { LayoutRoot } from '../../../layout/src/containers/layout-root';

import './inlay-builder.css';

const NO_STYLES = {};

const availableValues = [
  'test 1',
  'test 2',
  'test 3',
  'test 4'
]

const {width: bodyWidth, height: bodyHeight} = document.body.getBoundingClientRect();
const appStyle = {flexDirection:"column",width: bodyWidth, height: bodyHeight, backgroundColor: 'rgb(90,90,90)'};


const InlayBuilder = ({width = 800, height = 1000}) => {

  const [state, setState] = useState({
    layoutModel: undefined,
    managedLayoutNode: null,
    selectedLayoutNode: null,
    selectedLayoutId: null
  })

  const onLayoutModel = layoutModel => {
      setState({
        ...state,
        managedLayoutNode: layoutModel
      })
}

  // TODO look at layout configurator
  const handleChange = (feature, dimension, value, layoutStyle) => {
    console.log(`handle CHange ${feature} ${dimension} ${value} ${layoutStyle}`)
  }

  const selectComponent = selectedLayoutNode => {
      setState({
        ...state,
        selectedLayoutNode
      })
  }

  function saveLayout(){
      const {managedLayoutNode: {children: layoutModel}} = state;
      const serializedLayout = JSON.stringify(layoutModel,layoutSerializer,2);
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
      <LayoutRoot>
        <FlexBox id="outer-container" style={appStyle}>
          <FlexBox style={{height: 60}}>
            <ComponentPalette style={{flex: 1, backgroundColor: 'inherit'}}/>
            <div className="layout-edit-controls" style={{backgroundColor: 'red',width: 150}}>
              <Control><Select onCommit={selectLayout} availableValues={availableValues} selectedIdx={selectedIdx} value={state.selectedLayoutId}/></Control>
              <button onClick={saveLayout}>Save</button>
            </div>
          </FlexBox>
          <DynamicContainer style={{flex:1}} dropTarget onLayoutModel={onLayoutModel}>
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
      </LayoutRoot>
  )
}

const InlayBuilderWithRegistry = props => 
  <ComponentRegistryProvider components={defaultComponents}>
    <InlayBuilder {...props} />
  </ComponentRegistryProvider>

export default InlayBuilderWithRegistry;


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
