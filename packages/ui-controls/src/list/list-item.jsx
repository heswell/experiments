
import cx from 'classnames';

const ListItem = ({
  children,
  isHighlighted, 
  idx, 
  isSelected, 
  onMouseEnter,
  onClick,
  ...props}) => {

  const handleClick = evt =>  onClick(evt, idx);
  const handleMouseEnter = evt =>  onMouseEnter(evt, idx);

  return (
    <div
    role="list-item"
    data-idx={idx}
    className={cx("list-item", {
      selected: isSelected,
      hilited: isHighlighted
    })}
    {...props}
    onMouseEnter={handleMouseEnter}
    onClick={handleClick}>
    {children}
  </div>

  )

}

export default ListItem;