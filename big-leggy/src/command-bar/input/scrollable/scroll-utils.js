export const auto = 'auto';
/**
*	given content of contentWidth, within a container of width,
*	calculate the scrollOffset to bring token fully into view.
*	ScrollOffset is returned as an offsetRight rather than offsetLeft value
*/
export function calculateScrollOffsetRight(
  scrollRight,
  width,
  contentWidth,
  tokenLeft,
  tokenWidth
) {
  if (contentWidth === auto) {
    return 0;
  } else if (width) {
    const visibleLeft = contentWidth - width + scrollRight;
    const visibleRight = visibleLeft + width;
    const tokenRight = tokenLeft + tokenWidth;
    if (tokenLeft < visibleLeft) {
      const right = -(Math.abs(scrollRight) + (visibleLeft - tokenLeft));
      return right;
    } else if (tokenRight > visibleRight) {
      const right = -(Math.abs(scrollRight) - (tokenRight - visibleRight))
      return right;
    }
  }
  return scrollRight;
}