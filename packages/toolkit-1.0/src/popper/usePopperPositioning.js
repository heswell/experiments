import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ownerWindow } from "../utils";

const popperPlacement = {
  bottom: "bottom-start",
  top: "top-start",
};

export const usePopperPositioning = (anchorEl, popperRef, isOpen) => {
  const [maxHeight, setMaxHeight] = useState(undefined);
  const [popperPosition, setPopperPosition] = useState(popperPlacement.bottom);
  const preferredPopperHeight = useRef(-1);
  const availableSpace = useRef([0, 0]);
  const [spaceAbove, spaceBelow] = availableSpace.current;
  const anchor = anchorEl.current;

  useLayoutEffect(() => {
    // Measure the popper on first render only and save its preferred height
    if (isOpen && popperRef.current && preferredPopperHeight.current === -1) {
      preferredPopperHeight.current = popperRef.current.offsetHeight;
    }
  }, [isOpen, popperRef]);

  const measure = useCallback(() => {
    const { innerHeight: viewportHeight } = ownerWindow(anchor);
    const { top, bottom } = anchor.getBoundingClientRect();

    availableSpace.current = [
      Math.max(0, top),
      Math.max(0, viewportHeight - bottom),
    ];
  }, [anchor]);

  useEffect(() => {
    if (anchor && isOpen) {
      measure();

      const win = ownerWindow(anchor);
      win.addEventListener("resize", measure);
      win.addEventListener("scroll", measure);

      return () => {
        win.removeEventListener("resize", measure);
        win.removeEventListener("scroll", measure);
      };
    }
  }, [anchor, measure, isOpen]);

  useLayoutEffect(() => {
    if (isOpen) {
      let newMaxHeight = undefined;
      let position = undefined;

      if (spaceBelow >= preferredPopperHeight.current) {
        newMaxHeight = undefined;
        position = popperPlacement.bottom;
      } else if (spaceAbove > preferredPopperHeight.current) {
        newMaxHeight = undefined;
        position = popperPlacement.top;
      } else if (spaceAbove > spaceBelow) {
        newMaxHeight = spaceAbove;
        position = popperPlacement.top;
      } else {
        newMaxHeight = spaceBelow - 12;
        position = popperPlacement.bottom;
      }

      setMaxHeight(newMaxHeight);
      setPopperPosition(position);
    } else {
      // Reset on popper close
      setMaxHeight(undefined);
      setPopperPosition(undefined);
    }
  }, [isOpen, spaceAbove, spaceBelow]);

  return [popperPosition, maxHeight];
};
