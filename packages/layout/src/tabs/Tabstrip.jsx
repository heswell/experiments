import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import cx from "classnames";
import useTabstrip from "./useTabstrip";
import useResizeObserver from "../responsive/useResizeObserver";
import OverflowMenu from '../responsive/OverflowMenu';
import {getOverflowedItems} from '../responsive/overflowUtils';
import { AddIcon } from "../icons";

import "./Tabstrip.css";

const AddTabButton = (props) => {
  return (
    <div className="tab-add" {...props}>
      <AddIcon />
    </div>
  );
};

const OBSERVED_DIMENSIONS = ['height']


const Tabstrip = (props) => {
  const root = useRef(null);
  const hiddenItems = useRef([]);
  const { indicatorProps, tabProps, tabRef } = useTabstrip(props, root);
  const { enableAddTab, onAddTab, style, value } = props;
  const children = React.Children.toArray(props.children);
  const [overflowing, setOverflowing] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);

  const overflowButton = useRef(null);
  const innerContainer = useRef(null);

  const handleOverflowClick = () => {
    setShowOverflow((show) => !show);
  };

  const renderTabs = () => 
    children.reduce((out, child, index, {length}) => {
      out.push(
        React.cloneElement(child, {
          index,
          ...tabProps,
          "data-priority": 2,
          ref: tabRef[index],
          selected: index === value
        }));
        out.push(<div key={`spacer-${index}`} style={{width: 0, height: 32, backgroundColor: 'red'}}/>)
        if (enableAddTab && index === length-1){
          out.push(<AddTabButton key="add-tab" data-priority={1} onClick={onAddTab} />);
          out.push(<div key={`spacer-${index+1}`} style={{width: 0, height: 32, backgroundColor: 'red'}}/>)
        } 
        return out;
      },[]
    );

    const heightProp = 32;  

    const handleResize = useCallback(({ height: measuredHeight }) => {
        if (measuredHeight > heightProp && !overflowing) {
          setOverflowing(true);
        } else if (measuredHeight === heightProp && overflowing) {
          console.log(`set overflowing FALSE`)
          setOverflowing(false);
        }

    },[heightProp, overflowing])  

    useResizeObserver(
      innerContainer,
      OBSERVED_DIMENSIONS,
      handleResize
    );

  return (
    <div className={cx("Tabstrip")} ref={root} role="tablist" style={style}>
      <div className="Tabstrip-inner" ref={innerContainer} style={{lineHeight: '32px'}}>
        {renderTabs()}
      </div>
      {overflowing ? (
        <OverflowMenu onClick={handleOverflowClick} ref={overflowButton} />
      ) : null}
      {indicatorProps ? (
        <div className="ActiveIndicator" {...indicatorProps} />
      ) : null}
    </div>
  );
};

Tabstrip.displayName = "Tabstrip"

export default Tabstrip;
