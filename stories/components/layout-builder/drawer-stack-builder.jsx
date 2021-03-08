import React, { useRef, useState } from 'react';

import { Chest, Drawer, Flexbox, Component as PlaceHolder, DraggableLayout, Stack, View } from '@heswell/layout';
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

export default function DrawerStackBuilder({ width = 800, height = 1000 }) {
  const [state, setState] = useState({
    layoutModel: undefined,
    managedLayoutNode: null,
    selectedLayoutNode: null,
    selectedId: null
  })

  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const onLayoutModel = layoutModel => {
    console.log({ layoutModel })
    // setState(prevState => ({
    //     ...prevState,
    //     managedLayoutNode: layoutModel
    // }));
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

  function saveLayout() {
    const { managedLayoutNode: { children: layoutModel } } = state;
    const serializedLayout = JSON.stringify(layoutModel, layoutSerializer, 2);
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
    <DraggableLayout style={{ width: '100vw', height: '100vh' }}>
      <Flexbox className="LayoutBuilder" style={{ flexDirection: "column", width: '100%', height: '100%' }}>
        <div style={{ height: 60, borderBottom: 'solid 1px #ccc' }} />
        <Chest style={{ flex: 1 }}>
          <Drawer className="builder-top" peekaboo position="left" open={drawerOpen} inline onClick={toggleDrawer}>
            <Palette orientation="vertical" style={{ backgroundColor: 'inherit' }} />
          </Drawer>
          <DraggableLayout style={{ width: '100%', height: '100%' }} dropTarget onLayoutModel={onLayoutModel}>
            <Stack showTabs style={{ width: '100%', height: '100%' }}>
              <View title="Page 1" style={{ flex: 1 }}>
                <PlaceHolder style={{ width: '100%', height: '100%', backgroundColor: 'white' }} data-resizeable />
              </View>
              <View title="Page 2" style={{ flex: 1 }}>
                <PlaceHolder style={{ width: '100%', height: '100%', backgroundColor: 'white' }} data-resizeable />
              </View>
            </Stack>
          </DraggableLayout>
        </Chest>
      </Flexbox>
    </DraggableLayout>
  )
}

function layoutSerializer(key, value) {
  if (key === 'computedStyle' || key === 'layoutStyle' || key === 'visualStyle' || key === '$path') {
    return;
  }
  if (key === 'children' && value !== undefined && value.length === 1 && value[0].type === 'layout') {
    return undefined;
  }

  if (key === 'children' && this.type === 'FlexBox') {
    return value.filter(child => child.type !== 'Splitter');
  }

  return value;
}
