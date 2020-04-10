import React from 'react';
import { LayoutItem, Component } from '@heswell/layout';

export default ({width = 500, height = 400}) =>
  <LayoutItem
    title="Tye Boss" 
    header
    style={{
      width,
      height,
      padding: 20,
      border: '5px solid black',
      backgroundColor: 'yellow'
      }} >
    <Component />
  </LayoutItem>