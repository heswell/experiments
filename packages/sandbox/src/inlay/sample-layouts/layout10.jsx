import React, {useState} from 'react';
import { FlexBox, Component } from '@heswell/inlay';
import ConfigurableLayout from '../configurable-layout.jsx';

export default ({width = 820, height = 800}) => {

  const [selectedPos, setSelectedPos] = useState(null)

  const select = (e) => {
    setSelectedPos([e.clientX, e.clientY]);
  }

  // how do we identify the correct node from the model ?
  console.log(`selectedPos = ${selectedPos}`)

  return (
      <ConfigurableLayout selectedPos={selectedPos}>
        <FlexBox style={{width:820,height:390,flexDirection: 'row'}}>
          <Component resizeable title='Y Component' header={true}
            style={{flex:1, backgroundColor: 'red'}}
            onClick={select}/>
          <Component resizeable title='R Component' header={true}
            style={{
              flex: 1, backgroundColor: 'yellow',
              borderTop: '3px solid black'
            }}
            onClick={select}/>
        </FlexBox>
      </ConfigurableLayout>
  )
}
