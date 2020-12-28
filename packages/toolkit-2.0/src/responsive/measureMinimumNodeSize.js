const LEFT_RIGHT = ["left", "right"];
const TOP_BOTTOM = ["top", "bottom"];

export default function measureMinimumNodeSize(node, dimension = "width") {
  const { [dimension]: size } = node.getBoundingClientRect();
  const style = getComputedStyle(node);
  const [start, end] = dimension === "width" ? LEFT_RIGHT : TOP_BOTTOM;
  const marginStart = parseInt(style.getPropertyValue(`margin-${start}`), 10);
  const marginEnd = parseInt(style.getPropertyValue(`margin-${end}`), 10);

  let minWidth = size;
  const flexShrink = parseInt(style.getPropertyValue("flex-shrink", 10));
  if (flexShrink > 0) {
    const flexBasis = parseInt(style.getPropertyValue("flex-basis", 10));
    // TODO what about percentage values ?
    if (!isNaN(flexBasis)) {
      minWidth = flexBasis;
    }
  }

  return marginStart + minWidth + marginEnd;
}
