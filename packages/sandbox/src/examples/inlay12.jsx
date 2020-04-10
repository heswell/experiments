import React from 'react';
import { FlexBox, Component } from '@heswell/layout';

export default (width = 500, height = 400) =>
  <FlexBox
    title='Flexie' 
    header={true} 
    style={{
      width:600,
      height:300,
      flexDirection: 'row', 
      border:'2px solid black',
      margin: 20, 
      padding: '10 30', 
      backgroundColor: '#ccc'}
      }>
    <Component 
      title='Y Component' 
      style={{
        flex: 1, 
        backgroundColor: 'yellow',
        border: '10px solid rgba(0,0,0,.4)'
        }
      }/>
    <Component 
      title='R Component' 
      style={{
        flex: 1, 
        backgroundColor: 'red'
        }
      }/>
  </FlexBox>
