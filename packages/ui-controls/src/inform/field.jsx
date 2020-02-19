import React, {forwardRef, useImperativeHandle, useRef, useState } from 'react';
import cx from 'classnames';
import Control from './leggy-control';

export default forwardRef(function Field({
  field,
  leg,
  onCancel,
  onClick,
  onCommit,
  onFocusControl,
  onKeyDown,
  render
}, ref){

  const control = useRef(null);
  const [popupActive, setPopupActive] = useState(false);

  useImperativeHandle(ref, () => ({ field, focus }));

  function focus(idx){
    if (control.current && control.current.focus) {
      control.current.focus(idx)
    }
  }

  const handleClickCapture = () => onClick(field);
  const handleCancel = () => onCancel(field);
  const handleCommit = () => onCommit(field);
  const handleFocus = (controlIdx=0) => onFocusControl(field, controlIdx);

  function renderChild(){

    if (field.type === 'empty'){
      return <div className="empty" />;
    }
    let child = render(field, leg);

    const props = {
      ref: control,
      onCancel: handleCancel,
      onPopupActive: setPopupActive,
      onFocus: handleFocus
    }

    if (child.props.onCommit){
      const _commit = child.props.onCommit;
      props.onCommit = value => {
        handleCommit();
        _commit(value);
      }
    } else {
      props.onCommit = handleCommit
    }

    return (
      <Control tabIdx={field.tabIdx}>
        {React.cloneElement(child, props)}
      </Control>
    )
  }

  const className = cx("field", {
    "popup-active": popupActive
  });

  return (
    <div className={className} 
      data-idx={field.tabIdx}
      onClickCapture={handleClickCapture}
      onKeyDownCapture={onKeyDown}>
        {renderChild()}
    </div>
  )
});
