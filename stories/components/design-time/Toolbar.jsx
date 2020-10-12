import React from 'react';
import styled from '@emotion/styled';
import { Action, stretchAlign, stretchJustify } from '@heswell/layout';
import StateButton from './state-button';

const Toolbar = styled.div`
  background-color: white;
  display: flex;
  align-items: center;
  padding: 3px;
  border-bottom: solid 1px #ccc;
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

const DesignTimeToolbar = (props) => {

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
    <Toolbar style={props.style}>
      <StateButton.Group name="alignItems" onChange={handleChange} value={alignItems}>
        <StateButton label="Start" value="flex-start" icon="format_align_left"/>
        <StateButton label="Baseline" value="baseline" icon="format_underlined"  />
        <StateButton label="Center" value="center" icon="format_align_center"/>
        <StateButton label="End" value="flex-end" icon="format_align_right"/>
        <StateButton label="Stretch" value="stretch" icon="format_align_justify"/>
      </StateButton.Group>
      <StateButton.Group name="justifyContent" onChange={handleChange} value={justifyContent}>
        <StateButton label="Start" value="flex-start" icon="vertical_align_bottom"/>
        <StateButton label="Space around" value="space-around" icon="format_line_spacing"/>
        <StateButton label="Space between " value="space-between" icon="vertical_align_center"/>
        <StateButton label="Center" value="center" icon="border_top"/>
        <StateButton label="End" value="flex-end" icon="vertical_align_top"/>
      </StateButton.Group>
    </Toolbar>
  )
}

export default DesignTimeToolbar;