import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import cx from "classnames";
import useTabstrip from "./useTabstrip";
import useActivationIndicator from "./useActivationIndicator";
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

const OBSERVED_DIMENSIONS = ['height', 'width']


const Tabstrip = (props) => {
  const root = useRef(null);
  const hiddenItems = useRef([]);
  const { tabProps, tabRefs } = useTabstrip(props, root);
  const { indicatorProps } = useActivationIndicator(props, root, tabRefs);
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
          "data-index": index,
          "data-priority": 2,
          ref: tabRefs[index],
          selected: index === value
        }));
        out.push(<div key={`spacer-${index}`} style={{width: 0, height: 32, backgroundColor: 'red'}}/>)
        if (enableAddTab && index === length-1){
          out.push(<AddTabButton key="add-tab" data-index={index+1} data-priority={1} onClick={onAddTab} />);
          out.push(<div key={`spacer-${index+1}`} style={{width: 0, height: 32, backgroundColor: 'red'}}/>)
        } 
        return out;
      },[]
    );

    const heightProp = 32;  

    const handleResize = useCallback(({ height: measuredHeight }, overflowedIndices) => {
        if (measuredHeight > heightProp) {
          // noop if already overflowing, we don't check to avoid shaving a dependency
          // on overflowing
          setOverflowing(true);

          console.log(`overflowedIndices ${JSON.stringify(overflowedIndices)}`)

        } else if (measuredHeight === heightProp) {
          console.log(`set overflowing FALSE`);
          setOverflowing(false);
        }

    },[heightProp, setOverflowing])  

    // useResizeObserver(
    //   innerContainer,
    //   OBSERVED_DIMENSIONS,
    //   handleResize,
    //   true
    // );

  console.log('%cTabstrip render','color:blue;font-weight: bold;')

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
