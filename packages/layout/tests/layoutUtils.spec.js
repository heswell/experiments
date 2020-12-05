import React from 'react';
import { applyLayout } from '../src/layoutUtils';
import { Flexbox, Component } from '../index';

describe('applyLayout', () => {

  it('injects dispatch, layoutId and path into descendant props', () => {
    const dispatch = () => undefined;
    const component = (
      <Flexbox style={{flexDirection: 'row', width: 200, height: 100}}>
        <Component style={{flex:1}}/>
        <Component style={{flex:1}}/>
      </Flexbox>
    )
    const props = applyLayout('Flexbox', component.props, dispatch);

    expect(props.layoutId).toBeDefined();
    expect(props.path).toEqual('0')
    expect(props.dispatch).toEqual(dispatch);  
    expect(props.children[0].props.layoutId).toBeDefined();  
    expect(props.children[0].props.path).toEqual('0.0');  
    expect(props.children[0].props.dispatch).toEqual(dispatch);  
    expect(props.children[1].props.layoutId).toBeDefined();  
    expect(props.children[1].props.path).toEqual('0.1');  
    expect(props.children[1].props.dispatch).toEqual(dispatch);  
  });

})
