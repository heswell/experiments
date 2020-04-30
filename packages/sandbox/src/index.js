import React from 'react';
import ReactDOM from 'react-dom';
import { ContextMenu, MenuItem, Separator, PopupService } from '@heswell/ui-controls';

import './style/material-design.css';
import './style/main.css';

const handleMenuAction = (action, data) => {
  render(action)
}

const sampleContextMenu =  
  <ContextMenu doAction={handleMenuAction}>
    <MenuItem action='inlay1' label='Component with border and header' />
    <MenuItem action='inlay2' label='Surface, no children' />
    <MenuItem action='inlay3' label='Surface, single child' />
    <MenuItem action='inlay4' label='Application, single child' />
    <MenuItem action='inlay5' label='Tower > Terrace, margins and borders' />
    <MenuItem action='layout-complex-nested' label='Complex nested layout' />
    <MenuItem action='inlay7' label='Dynamic container (JSON content), within Flexbox' />
    <MenuItem action='inlay8' label='Singleton FlexBox > Component, DynamicContainer > TabbedContainer' />
    <MenuItem action='inlay9' label='FlexBox, single child' />
    <MenuItem action='inlay10' label='FlexBox, with Tree & Configutator' />
    <MenuItem action='inlay11' label='FlexBox > 2 Components' />
    <MenuItem action='inlay12' label='FlexBox > 2 Components' />
    <MenuItem action='inlay13' label='FlexBox > 2 Components' />
    <MenuItem action='inlay14' label='Quad FlexBox' />
    <MenuItem action='inlay15' label='Quad FlexBox, Flexbox shuffle' />
    <MenuItem action='inlay16' label='Nested FlexBox' />
    <MenuItem action='inlay-builder' label='Layout Builder' />
    <MenuItem action='inlay18' label='Deeper nessting of FlexBoxes' />
    <MenuItem action='layout-tabs-01' label='TabbedContainer' />
    <Separator />
    <MenuItem action='grid1' label='Grid, local Instruments' />
    <MenuItem action='grid-viewserver' label='Grid, remote Instruments (node.js ViewServer)' />
    <MenuItem action='grid-vuu' label='Grid, remote Instruments (VUU ViewServer)' />
    <Separator />
    <MenuItem action='set-filter' label='Set filter' />
    <Separator />
    <MenuItem action='inform1' label='Form' />
  </ContextMenu>


/* Remote Grid */
// import './ingrid/remote/viewserver-simpsons.jsx';
// import './ingrid/remote/viewserver-order-blotter.jsx';
// import './ingrid/remote/viewserver-multiple.jsx';

async function load(id){
  const {default: component} = await import(`./examples/${id}.jsx`);
  return component;
}

async function render(id){

  const SampleLayout = await load(id);
  ReactDOM.render(
    <>
      <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 32, backgroundColor: 'green'}} onContextMenu={onContextMenu}/>
      <SampleLayout width={800} height={600}/>
    </>,
    document.getElementById('root')
  );

}

render('grid-1000x1000');

function onContextMenu(e){
  e.preventDefault();
  e.stopPropagation();
  const { clientX: left, clientY: top } = e;
  PopupService.showPopup({ left: Math.round(left), top: Math.round(top), component: sampleContextMenu });

}