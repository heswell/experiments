import React, { useCallback, useRef, useState } from "react";
import cx from "classnames";
import useTabstrip from "./useTabstrip";
import useOverflowObserver from "./useOverflowObserver";
import ActivationIndicator from './ActivationIndicator';
import OverflowMenu from '../responsive/OverflowMenu';
import { AddIcon } from "../icons";

import "./Tabstrip.css";

const AddTabButton = (props) => {
  return (
    <div className="tab-add" {...props}>
      <AddIcon />
    </div>
  );
};

const Tabstrip = (props) => {
  const root = useRef(null);
  const { tabProps, tabRefs } = useTabstrip(props, root);
  const { enableAddTab, onAddTab, showActivationIndicator=true, style, value } = props;
  const children = React.Children.toArray(props.children);
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
        if (enableAddTab && index === length-1){
          out.push(<AddTabButton key="add-tab" data-index={index+1} data-priority={1} onClick={onAddTab} />);
        } 
        return out;
      },[<div className="row-pillar" key="spacer" style={{height: 32}}/>]
    );

    const handleResize = useCallback(() => {
      console.log(`[Tabstrip] handleResize`)
    },[])  

    const overflowing = useOverflowObserver(
      innerContainer,
      handleResize
    );


  console.log(`%cTabstrip render overflowing ${overflowing}`,'color:blue;font-weight: bold;')

  return (
    <div className={cx("Tabstrip")} ref={root} role="tablist" style={style}>
      <div className="Tabstrip-inner" ref={innerContainer} style={{lineHeight: '32px'}}>
        {renderTabs()}
      </div>
      {overflowing ? (
        <OverflowMenu onClick={handleOverflowClick} ref={overflowButton} show={showOverflow}/>
      ) : null}
      {showActivationIndicator ? (
        <ActivationIndicator tabRefs={tabRefs} value={value}/>
      ) : null}
    </div>
  );
};

Tabstrip.displayName = "Tabstrip"

export default Tabstrip;
