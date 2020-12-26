const LEFT_RIGHT = ["left", "right"];
const TOP_BOTTOM = ["top", "bottom"];

export default function measureNode(node, dimension = "width") {
  const { [dimension]: size } = node.getBoundingClientRect();
  const style = getComputedStyle(node);
  const [start, end] = dimension === "horizontal" ? LEFT_RIGHT : TOP_BOTTOM;
  const marginStart = parseInt(style.getPropertyValue(`margin-${start}`), 10);
  const marginEnd = parseInt(style.getPropertyValue(`margin-${end}`), 10);
  return marginStart + size + marginEnd;
}
