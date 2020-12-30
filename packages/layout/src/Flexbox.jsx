import React, { useCallback, useEffect, useRef, useState } from "react";
import cx from "classnames";
import Splitter from "./Splitter";
import useLayout from "./useLayout";
import { Action } from "./layout-action";
import { getProp } from "./utils";
import { registerComponent } from "./registry/ComponentRegistry";

import "./Flexbox.css";

// TODO factor this out into utils
const useSizesRef = () => {
  const sizesRef = useRef([]);
  const [, setState] = useState(sizesRef.current);
  const setSizes = useCallback((fn) => {
    sizesRef.current = fn(sizesRef.current);
    setState(sizesRef.current);
  }, []);

  const clear = () => (sizesRef.current = []);

  return [sizesRef, setSizes, clear];
};

const Flexbox = function Flexbox(inputProps) {
  const [props, dispatch, ref] = useLayout("Flexbox", inputProps);
  const { children = [], className, layoutId: id, path, style } = props;
  const isColumn = style.flexDirection === "column";
  const [sizesRef, setSizes, clearSizes] = useSizesRef([]);
  const dimension = isColumn ? "height" : "width";

  const handleDragStart = useCallback(() => {
    setSizes(() =>
      Array.from(ref.current.childNodes)
        .filter((el) => !el.classList.contains("Splitter"))
        .map((el) => Math.round(el.getBoundingClientRect()[dimension]))
    );
  }, [ref, dimension, setSizes]);

  const handleDrag = useCallback(
    (idx, distance) => {
      setSizes((prevSizes) => {
        const newSizes = prevSizes.slice();
        newSizes[idx] += distance;
        newSizes[idx + 1] -= distance;
        return newSizes;
      });
    },
    [setSizes]
  );

  const handleDragEnd = useCallback(() => {
    const sizes = sizesRef.current;
    clearSizes();
    dispatch({
      type: Action.SPLITTER_RESIZE,
      path,
      sizes,
    });
  }, [clearSizes, dispatch, path, sizesRef]);

  const createSplitter = (i) => (
    <Splitter
      column={isColumn}
      dispatch={dispatch}
      index={i}
      key={`splitter-${i}`}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      path={path}
    />
  );

  const injectSplitters = (list, child, i, arr) => {
    const { flexBasis, [dimension]: layoutSize } = child.props.style;
    const draggedSize = sizesRef.current[i];

    const cloneChild =
      draggedSize !== undefined &&
      draggedSize !== flexBasis &&
      draggedSize !== layoutSize;

    if (cloneChild) {
      const dolly = React.cloneElement(child, {
        style: {
          ...child.props.style,
          flexBasis: draggedSize,
          [dimension]: "auto",
        },
      });
      list.push(dolly);
    } else {
      list.push(child);
    }
    // TODO we have to watch out for runtime changes to resizeable
    if (getProp(child, "resizeable") && getProp(arr[i + 1], "resizeable")) {
      list.push(createSplitter(i));
    }
    return list;
  };
  return (
    <div className={cx("Flexbox", className)} id={id} ref={ref} style={style}>
      {children.reduce(injectSplitters, [])}
    </div>
  );
};
Flexbox.displayName = "Flexbox";

export default Flexbox;

registerComponent("Flexbox", Flexbox, "container");
