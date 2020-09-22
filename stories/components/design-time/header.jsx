import React from 'react';
import styled from '@emotion/styled';
import { Action, stretchAlign, stretchJustify } from '@heswell/layout';
import StateButton from './state-button';

const Header = styled.div`
  background-color: green;
`;

const RadioGroup = styled.div`
  background-color: red;
  display: flex;
  align-items: center;
`;

const stretchStyle = (attribute, value) => {
  return attribute === 'alignItems'
    ? stretchAlign(value)
    : attribute === 'justifyContent'
      ? stretchJustify(value)
      : 0;
}

const recomputeLayoutStyle = (layoutModel, attribute, value) => {
  const { layoutStyle, style } = layoutModel;
  return {
    ...layoutModel,
    style: {
      ...style,
      [attribute]: value
    },
    layoutStyle: {
      ...layoutStyle,
      [attribute]: stretchStyle(attribute, value)
    }

  }
}

const DesignTimeHeader = (props) => {

  const { dispatch, layoutModel } = props;
  const { style: { alignItems = "stretch", justifyContent = "flex-start" } } = layoutModel;

  const handleChange = (name, value) => {
    const replacement = recomputeLayoutStyle(layoutModel, name, value)

    dispatch({
      type: Action.REPLACE,
      target: layoutModel,
      replacement
    });

  }

  return (
    <Header style={props.style}>
      <StateButton.Group name="alignItems" onChange={handleChange} value={alignItems}>
        <StateButton label="Start" value="flex-start" />
        <StateButton label="Baseline" value="baseline" />
        <StateButton label="Center" value="center" />
        <StateButton label="End" value="flex-end" />
        <StateButton label="Stretch" value="stretch" />
      </StateButton.Group>
      <StateButton.Group name="justifyContent" onChange={handleChange} value={justifyContent}>
        <StateButton label="Start" value="flex-start" />
        <StateButton label="Space around" value="space-around" />
        <StateButton label="Space between " value="space-between" />
        <StateButton label="Center" value="center" />
        <StateButton label="End" value="flex-end" />
      </StateButton.Group>
    </Header>
  )
}

export default DesignTimeHeader;