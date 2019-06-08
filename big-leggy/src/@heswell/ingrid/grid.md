Column dragging, scrolling

Grid: handleColumnMove, dispach MOVE, distance, scrollLeft.current

Model: calculate
  movingColumn (left, virtualLeft)
  _overTheLine (max 20)

Grid.useEfect _overTheLine dispatch SCROLL_RIGHT 3

Model: scrollRight calculate
  _movingColumn (virtualLeft)
  scrollLeft
  column positions wrt moving column

Grid.useEffect scrollLeft
  scrollTo scrollLeft


logic needs to be

1) handleColumnMove, dispatch MOVE, distance, scrollLeft
2) model.onMove calculate _overTheLine
3) while overTheLine
    dispatch SCROLL_RIGHT

4) Grid.useEffect scrollLeft
  scrollTo scrollLeft



Notes:
3) requestAnimationFrame loop that checks overTheLine after each iteration

useEffect: overTheLine

loop(){
  if (overTheLine){
    dispatch SCROLL_RIGHT
    scrollAnimation.current = requestAnimationFrame(loop)
  }
}
loop()

// this will cancel when overTheLine changes. If it still has a value, a new loop will start
// if it is now zero, scrolling will stop
return () => cancelAnimation(scrollAnimationCurrent)


useEffect: scrollLeft
  whenever scrollLeft changes
  scrollTo scrollLeft

  could do this in ANimationFrame as well so very rapid scrolls can be coalesced
  TODO how do we animate the scrolling ?