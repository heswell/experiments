import React from 'react';

import { Component, LayoutItem } from '@heswell/layout';
import './material-design.css';

export default {
  title: 'Layout/Component',
  component: LayoutItem,
};

export const ComponentWithBorderAndHeader = ({width = 500, height = 400}) =>
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
