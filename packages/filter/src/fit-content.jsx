import React, {useLayoutEffect, useRef, useState} from 'react';

const FitContent = ({children}) => {
  const el = useRef(null);
  const [[width, height], setSize] = useState([0,0]);
  useLayoutEffect(() => {
      const {width, height} = el.current.getBoundingClientRect();
      setSize([width, height])
  },[])
  if (width === 0 && height === 0){
      return <div ref={el} style={{width: '100%', height: '100%'}} />
  } else {
      return children(width, height)
  }
}

export default FitContent;