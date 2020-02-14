import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import Selector, {ComponentType} from '../inform/controls/selector/selector.jsx';
import {searcher} from '../inform/controls/list/searcher';

import './select.css';

const defaultValues = ["Alabama", "Arizona", "California", "Colorado", "Florida", "Georgia", "Idaho",
  "Kentucky", "Louisiana", "Maine", "Montana", "Missouri", "Mississippi", "Nevada", "New England",
  "New Jersey", "New Mexico", "New York", "North Dakota", "Ohio", "Philadelphia", "South Dakota",
  "Tennessee", "Texas", "Virginia"];

export default forwardRef(function Select(props, ref){

  const selector = useRef(null);
  const [state, setState] = useState({
    hilitedIdx: null
  });

  const onItemSelectedBySearch = (hilitedIdx) => {
    if (hilitedIdx !== state.hilitedIdx){
      setState({
        ...state,
        hilitedIdx
      })
    }
  }

  const availableValues = props.availableValues || defaultValues;
  const searchKeyHandler = searcher(availableValues, onItemSelectedBySearch);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (selector.current){
        selector.current.focus(false)
      }
    }
  }));

  // TODO don't need value AND selectedIdx
    return (
      <Selector ref={selector}
        {...props}
        availableValues={availableValues}
        typeaheadListNavigation
        hilitedIdx={state.hilitedIdx}
        onKeyDown={searchKeyHandler}>
        {child =>
          child === ComponentType.Input && (
            <div tabIndex={0} className="control-text select-input">
              {props.value}
            </div>
          )
        }
      </Selector>
    );
});
