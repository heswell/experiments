import React from 'react';
import ReactDOM from 'react-dom';
import { ContextMenu, MenuItem, Separator, PopupService } from '@heswell/ui-controls';

const handleMenuAction = (action, data) => {
  render(action)
}

const sampleContextMenu =  
  <ContextMenu doAction={handleMenuAction}>
    <MenuItem action='1' label='Component with border and header' />
    <MenuItem action='2' label='Surface, no children' />
    <MenuItem action='3' label='Surface, single child' />
    <MenuItem action='4' label='Application, single child' />
    <MenuItem action='5' label='Tower > Terrace, margins and borders' />
    <MenuItem action='6' label='Complex nested layout' />
    <MenuItem action='7' label='Dynamic container (JSON content), within Flexbox' />
    <MenuItem action='8' label='Singleton FlexBox > Component, DynamicContainer > TabbedContainer' />
    <MenuItem action='9' label='FlexBox, single child' />
    <MenuItem action='10' label='FlexBox, with Tree & Configutator' />
    <MenuItem action='11' label='FlexBox > 2 Components' />
    <MenuItem action='12' label='FlexBox > 2 Components' />
    <MenuItem action='13' label='FlexBox > 2 Components' />
    <MenuItem action='14' label='Quad FlexBox' />
    <MenuItem action='15' label='Quad FlexBox, Flexbox shuffle' />
    <MenuItem action='16' label='Nested FlexBox' />
    <MenuItem action='17' label='Layout Builder' />
    <MenuItem action='18' label='Deeper nessting of FlexBoxes' />
    <MenuItem action='19' label='TabbedContainer' />
  </ContextMenu>


async function load(sampleNo){
  const {default: component} = await import(`./sample-layouts/layout${sampleNo}.jsx`);
  return component;
}

async function render(id){

  const SampleLayout = await load(id);
  console.log(`reactDOM render`)
  ReactDOM.render(
    <>
      <div style={{height: 32, backgroundColor: 'green'}} onContextMenu={onContextMenu}/>
      <div style={{position: 'relative'}}>
        <SampleLayout width={800} height={600}/>
      </div>
    </>,
    document.getElementById('root')
  );

}

render(1);

function onContextMenu(e){
  e.preventDefault();
  e.stopPropagation();
  const { clientX: left, clientY: top } = e;
  PopupService.showPopup({ left: Math.round(left), top: Math.round(top), component: sampleContextMenu });

}