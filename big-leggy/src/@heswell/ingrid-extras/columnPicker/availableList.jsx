import React from 'react';

const List = ({
    items,
    onMouseDown,
    onItemAdded,
    style
}) => {
    
    const handleMouseDown = ({ target, pageX, pageY }, column) =>  {
        onMouseDown(column, target.getBoundingClientRect(), pageX, pageY);
    }
    
    const { width, height } = style;
    const listItems = items.map((item, idx) => {

        let mouseDownHandler = item.inUse ? null : e => handleMouseDown(e, item.column);

        return (
            <div key={item.column.name}
                onMouseDown={mouseDownHandler}
                className="ListItem demo8-item"
                style={{
                    width: width - 15,
                    height: 23,
                    lineHeight: '22px',
                    backgroundColor: item.inUse ? '#ccc' : 'white',
                    boxShadow: `rgba(0, 0, 0, 0.2) 0px 1px 2px 0px`,
                    transform: `translate3d(0, ${idx * 24}px, 0)`,
                    zIndex: idx,
                }}>
                <span>{`${idx + 1}  ${item.column.name}`}</span>
                {item.inUse ? null :
                    <div className="button add"
                        onClick={() => onItemAdded(item)}
                        onMouseDown={e => e.stopPropagation()}>
                        <i className="material-icons">add</i>
                    </div>}
            </div>
        );
    });

    return (
        <div className='List' style={style}>
            <div className="ViewPort" style={{ position: 'absolute', overflow: 'hidden', top: 0, left: 0, width, height }}>
                <div className="scrollable-content" style={{ position: 'absolute', top: 0, left: 0, width, height, overflow: 'auto' }}>
                    <div className="scrolling-canvas-container" style={{ width: width - 15, height: items.length * 24 }}>
                        {listItems}
                    </div>
                </div>
            </div>
        </div>

    );
}

export default List;


