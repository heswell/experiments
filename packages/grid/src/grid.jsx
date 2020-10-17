import React from 'react';
import PropTypes from 'prop-types';
import PropHelper from './prop-helper';
import Measure, {useMeasure} from './measure';
import GridBase from './grid-base';
import {Footer, Header, InlineHeader} from './grid-adornments';

// TODO use a null datasource and empty columns defs
// display a warning if loaded with no dataSOurce

const Grid = (props) => {

  const [{height, width}, setSize] = useMeasure(props);
  if (height === '100%' || width === '100%'){
    return (
      <Measure onMeasure={setSize} height={height} width={width}/>
    )
  } else if (!props.dataSource){
    return (
      <PropHelper style={{height, width}}/>
    )
  } else {
    return (
      <GridBase {...props} height={height} width={width} />
    )
  }

}

Grid.Header = Header;
Grid.InlineHeader = InlineHeader;
Grid.Footer = Footer;


export default Grid;

Grid.propTypes = {
  /**
   * CSS class name for Grid component.
   */
  className: PropTypes.string,
  /**
   * Definitions for Grid columns.
   */
  columns: PropTypes.arrayOf(
    PropTypes.shape({
    label: PropTypes.string,
    name: PropTypes.string.isRequired,
    width: PropTypes.number
  })),
  dataSource: PropTypes.any,
  /**
   * Grid width. May either a pixel value or one of `auto` or `fill`
   * `auto` width is determined by content, but will not exceed available space.
   * `fill` width will take up all available space.
   */
  height: PropTypes.oneOfType(
    [
      PropTypes.number, 
      PropTypes.oneOf(['auto', 'fill'])
    ]),
  /**
   * Grid height. May either a pixel value or one of 'auto' or 'fill'
   * `auto` height is determined by content, but will not exceed available space.
   * `fill` height will take up all available space.
   */
  width: PropTypes.oneOfType(
    [
      PropTypes.number, 
      PropTypes.oneOf(['auto', 'fill'])
    ]),
}