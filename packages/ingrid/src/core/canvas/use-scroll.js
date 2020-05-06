import { useEffect, useRef } from 'react';

/** @type {ScrollingCanvasHook} */
export default function useScroll(scrollContainer, scrollThreshold, callback){
  const handler = useRef(null);
  const scrollTimer = useRef(null);
  const scrollPos = useRef(0);
  const checkpoint = useRef(0);

  const el = scrollContainer.current;

  useEffect(() => {
    if (el){
      const onScrollEnd = () => {
        scrollTimer.current = null;
        callback('scroll-end-horizontal', scrollPos.current);
      }
      //TODO need to throttle function
      handler.current = () => {
        console.log(`use H scroll`)
        const {scrollLeft} = el; 
        if (scrollLeft === scrollPos.current){
          return;
        }

        scrollPos.current = scrollLeft;
        if (scrollTimer.current){
          clearTimeout(scrollTimer.current);
          if (Math.abs(scrollPos.current - checkpoint.current) > scrollThreshold){
            checkpoint.current = scrollPos.current;
            callback('scroll-threshold', scrollPos.current);
          }
         } else {
          callback('scroll-start-horizontal', scrollPos.current);

          if (Math.abs(scrollPos.current - checkpoint.current) > scrollThreshold){
            checkpoint.current = scrollPos.current;
            callback('scroll-threshold', scrollPos.current);
          }
        }
        scrollTimer.current = setTimeout(onScrollEnd,200);
      };
    }
  },[el]); 


  return handler.current;
}

