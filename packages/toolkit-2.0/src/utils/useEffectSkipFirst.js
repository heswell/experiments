import { useLayoutEffect, useRef } from "react";

// eslint-disable-next-line react-hooks/exhaustive-deps
const useLayoutEffectSkipFirst = (func, deps) => {
  const goodToGo = useRef(false);
  useLayoutEffect(() => {
    if (goodToGo.current) {
      func();
    } else {
      goodToGo.current = true;
    }
  }, deps);
};

export default useLayoutEffectSkipFirst;
