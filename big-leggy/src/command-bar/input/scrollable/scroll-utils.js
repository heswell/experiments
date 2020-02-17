export const auto = 'auto';
/**
*	given content of contentWidth, within a container of width,
*	calculate the scrollOffset to bring token fully into view.
*	ScrollOffset is returned as an offsetRight rather than offsetLeft value
*/
export function calculateScrollOffset(
  scrollLeft,
  width,
  contentWidth,
  tokenLeft,
  tokenWidth
) {
  if (contentWidth === auto) {
    return 0;
  } else if (width) {
    const visibleLeft = Math.abs(scrollLeft);
    const visibleRight = visibleLeft + width;
    const tokenRight = tokenLeft + tokenWidth;
    if (tokenLeft < visibleLeft) {
      return  -tokenLeft;
    } else if (tokenRight > visibleRight) {
      return scrollLeft - (tokenRight - visibleRight);
    }
  }
  return scrollLeft;
}