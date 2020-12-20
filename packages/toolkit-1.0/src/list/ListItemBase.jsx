import React, { memo, forwardRef, useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import { createUseStyles } from "react-jss";
import { useDensity } from "../theme";
import { useForkRef, useOverflowDetection } from "../utils";
import Highlighter from "./internal/Highlighter";

// import { useTooltipContext } from "./TooltipContext";

const densityToTypeSizePaletteIndex = {
  touch: 70,
  low: 60,
  medium: 50,
  high: 40,
};

export const useStyles = createUseStyles(
  (theme) => {
    const {
      selectable: { getSelectable, selectableStates },
      focusable: { getFocusable },
      disabled: { getDisabled },
      palette,
      spacing,
      typography,
    } = theme.toolkit;

    const defaultSelectableStyle = getSelectable(selectableStates.default);

    const createDensityStyle = (density) => {
      const spacingMixin = spacing[density].spacing;
      const { lineHeight, size: fontSize } = typography;

      return {
        lineHeight,
        fontSize: fontSize[densityToTypeSizePaletteIndex[density]],
        padding: spacingMixin(0, 1, 0, 1),
      };
    };

    return {
      root: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        left: 0,
        right: 0,
        boxSizing: "border-box",
        borderBottom: `1px solid ${defaultSelectableStyle.background}`,
        ...defaultSelectableStyle,
        "&$highlighted:not($selected)": getSelectable(selectableStates.active),
      },
      textWrapper: {
        flex: 1,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
      },
      textHighlight: {},
      highlighted: {},
      selected: getSelectable(selectableStates.selected),
      disabled: getDisabled(),
      focusVisible: {
        "&:after": {
          content: '""',
          position: "absolute",
          top: 2,
          right: 2,
          bottom: 2,
          left: 2,
          ...getFocusable(),
        },
        "&$selected": {
          "&:after": {
            outlineColor: palette.white,
          },
        },
      },
      touchDensity: createDensityStyle("touch"),
      lowDensity: createDensityStyle("low"),
      mediumDensity: createDensityStyle("medium"),
      highDensity: createDensityStyle("high"),
    };
  },
  { name: "ListItem" }
);

// just to keep line number parity
//
const ListItemBase = forwardRef(function ListItemBase(props, ref) {
  const {
    className,
    selected,
    highlighted,
    focusVisible,
    tooltipText,
    disabled,
    children,
    itemTextHighlightPattern,
    density: densityProp,
    ...restProps
  } = props;

  const classes = useStyles();
  const density = useDensity(densityProp);
  // const [openTooltip, setOpenTooltip] = useState(false);
  // const { Tooltip, enterDelay, leaveDelay, placement } = useTooltipContext();
  const { current: detectTruncation } = useRef(typeof children === "string");

  const [overflowRef, isOverflowed] = useOverflowDetection();
  const setItemRef = useForkRef(overflowRef, ref);

  // useEffect(() => {
  //   if (detectTruncation) {
  //     const timeout = setTimeout(
  //       () => setOpenTooltip(highlighted),
  //       highlighted ? enterDelay : leaveDelay
  //     );

  //     return () => {
  //       clearTimeout(timeout);
  //     };
  //   }
  // }, [highlighted, enterDelay, leaveDelay, detectTruncation]);

  const renderItem = () => (
    <div
      aria-label={typeof children === "string" ? children : undefined}
      {...restProps}
      className={classnames(
        classes.root,
        classes[`${density}Density`],
        {
          [classes.highlighted]: highlighted,
          [classes.selected]: selected,
          [classes.focusVisible]: focusVisible,
          [classes.disabled]: disabled,
        },
        className
      )}
      ref={detectTruncation ? ref : setItemRef}
    >
      {detectTruncation ? (
        <span className={classes.textWrapper} ref={overflowRef}>
          {itemTextHighlightPattern == null ? (
            children
          ) : (
            <Highlighter
              classes={{ highlight: classes.textHighlight }}
              matchPattern={itemTextHighlightPattern}
              text={children}
            />
          )}
        </span>
      ) : (
        children
      )}
    </div>
  );

  return isOverflowed ? (
    <>
      {/* <Tooltip open={openTooltip} placement={placement} title={tooltipText}> */}
      {renderItem()}
      {/* </Tooltip> */}
    </>
  ) : (
    renderItem()
  );
});

ListItemBase.propTypes = {
  /**
   * The content of the item.
   */
  children: PropTypes.node,
  /**
   * The className(s) of the component.
   */
  className: PropTypes.string,
  /**
   * The density of a component affects the style of the layout.
   *
   * A high density component uses minimal sizing and spacing to convey the intended UI design.
   * Conversely, a low density component, maximizes the use of space and size to convey the UI Design.
   */
  density: PropTypes.oneOf(["touch", "low", "medium", "high"]),
  /**
   * If `true`, the component will be disabled.
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, the component will have a focus ring around it.
   */
  focusVisible: PropTypes.bool,
  /**
   * If `true`, the component will have the highlighted style.
   */
  highlighted: PropTypes.bool,
  /**
   * Used for providing text highlight.
   *
   * It can be a capturing regex or a string for a straightforward string matching.
   */
  itemTextHighlightPattern: PropTypes.oneOfType([
    PropTypes.instanceOf(RegExp),
    PropTypes.string,
  ]),
  /**
   * If `true`, the component will have the selected style.
   */
  selected: PropTypes.bool,
  /**
   * Text displayed in tooltip when item text is truncated.
   *
   * Node that it will detect item text truncation only when its children is a string.
   */
  tooltipText: PropTypes.string,
};

export default memo(ListItemBase);
