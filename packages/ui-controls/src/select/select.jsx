import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import SelectBase, {ComponentType} from '../select-base/select-base';

import './select.css';

const defaultValues = ["Alabama", "Arizona", "California", "Colorado", "Florida", "Georgia", "Idaho",
  "Kentucky", "Louisiana", "Maine", "Montana", "Missouri", "Mississippi", "Nevada", "New England",
  "New Jersey", "New Mexico", "New York", "North Dakota", "Ohio", "Philadelphia", "South Dakota",
  "Tennessee", "Texas", "Virginia"];

export default forwardRef(function Select(props, ref){
  const selector = useRef(null);
  const [value, setValue] = useState(props.value)
  const {values=defaultValues, ...restProps} = props;

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (selector.current){
        selector.current.focus(false)
      }
    }
  }));

  const handleCommit = value => {
    setValue(value);

    if (props.onCommit){
      props.onCommit(value)
    }
  }

    return (
      <SelectBase ref={selector}
        {...restProps}
        values={values}
        onCommit={handleCommit}
        typeToNavigate
        value={value}
        >
        {child =>
          child === ComponentType.Input && (
            <div tabIndex={0} className="control-text select-input">
              {value}
            </div>
          )
        }
      </SelectBase>
    );
});
