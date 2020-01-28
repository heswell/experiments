import React, { useState, Children } from 'react';
import { Surface, FlexBox,  PlaceHolder, DynamicContainer, handleLayout, registerClass } from '@heswell/inlay';
import {LayoutConfigurator,LayoutTreeViewer, ComponentPalette} from '@heswell/inlay-extras'
import {AppHeader} from './components/app-header';

const NO_STYLES = {};

export default ({width = 800, height = 1000}) => {

  const [state, setState] = useState({
    layoutModel: undefined,
    managedLayoutNode: null,
    selectedLayoutNode: null
  })

  const onLayoutModel = layoutModel => {
    setState({
      ...state,
      managedLayoutNode: layoutModel
    })
  }

  // TODO look at layout configurator
  const handleChange = (feature, dimension, value, layoutStyle) => {
  }

  const selectComponent = selectedLayoutNode => {
    // setState({
    //   ...state,
    //   selectedLayoutNode
    // })
  }

  function saveLayout(){
    const {managedLayoutNode: {children: layoutModel}} = state;
    const serializedLayout = JSON.stringify(layoutModel,layoutSerializer,2);
    console.log(`save ${serializedLayout}`)
  }

  const layoutStyle = state.selectedLayoutNode === null
  ? NO_STYLES
  : state.selectedLayoutNode.style;

  return (
      <FlexBox style={{flexDirection:"column",width: 900, height: 900, backgroundColor: 'rgb(90,90,90)'}}>
        <FlexBox style={{height: 60}}>
          <ComponentPalette style={{flex: 1, backgroundColor: 'inherit'}}/>
          <div className="layout-edit-controls" style={{backgroundColor: 'red',width: 150}}>
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
