import React, { useState } from 'react';
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

  const storeLayoutModel = layoutModel => {
		console.log(`storeLayoutModel`,layoutModel)
        // const [{children: [,managedLayoutNode]}] = layoutModel.children;
        // setState({
        //   layoutModel,
        //   selectedLayoutNode: managedLayoutNode,
        //   managedLayoutNode
        // })
  }

  const handleChange = (feature, dimension, value, layoutStyle) => {
		// const {selectedLayoutNode} = state;
		// const layoutModel = handleLayout(state.layoutModel, 'replace', {
		// 	targetNode: selectedLayoutNode,
		// 	replacementNode: {
		// 		...selectedLayoutNode,
		// 		style: layoutStyle
		// 	} 
		// });
	  // const [{children: [,managedLayoutNode]}] = layoutModel.children;
	  // setState({
		//   layoutModel,
    //   managedLayoutNode,
    //   selectedLayoutNode: null
	  // });

  }

  const selectComponent = selectedLayoutNode => {
    // setState({
    //   ...state,
    //   selectedLayoutNode
    // })
  }

  const layoutStyle = state.selectedLayoutNode === null
  ? NO_STYLES
  : state.selectedLayoutNode.style;

  return (
      <FlexBox style={{flexDirection:"column",width: 900, height: 900, backgroundColor: 'rgb(90,90,90)'}}>
        <AppHeader style={{height: 60}}>
          <ComponentPalette />
        </AppHeader>
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
