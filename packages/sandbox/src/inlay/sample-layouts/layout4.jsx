import React from 'react';
import { Application, Component } from '@heswell/inlay';

export default (width = 500, height = 400) =>
  <Application style={{width:800,height:300,backgroundColor: 'brown'}}>
    <Component title='R Component' header={true} style={{backgroundColor: 'yellow',left: 200,top:50,width: 100, height: 100}}/>
  </Application>