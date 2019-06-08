
import React, { memo, useRef, forwardRef, useContext, useImperativeHandle} from 'react';
import cx from 'classnames';
import ColumnGroupHeader from './columnGroupHeader';
import * as Action from '../model/actions';
import GridContext from '../grid-context';

import css from '../style/grid';

export default memo(forwardRef(({
    className: propClassName,
    colGroupHeaderRenderer,
    colHeaderRenderer,
    model,
    height,
    style: propStyle
}, ref) => {
    console.log(`RENDER Header`)
    const { dispatch } = useContext(GridContext);
    const scrollingHeader = useRef(null);
    const scrollLeft = useRef(0);

    useImperativeHandle(ref, () => ({
        scrollLeft: pos => {
            scrollLeft.current = pos;
            scrollingHeader.current.scrollLeft(pos);
        }
      }))
    
    const handleColumnMove = (phase, column, distance) => {
        if (!column.isHeading) {
            const pos = scrollLeft.current;
            if (phase === 'move' && distance !== 0) {
                dispatch({ type: Action.MOVE, distance, scrollLeft: pos });
            } else if (phase === 'begin') {
                dispatch({ type: Action.MOVE_BEGIN, column, scrollLeft: pos });
            } else if (phase === 'end') {
                dispatch({ type: Action.MOVE_END, column });
            }
        }
    }

    const className = cx('Header', propClassName);
    const style = { ...css.Header, ...propStyle, height };

    return (
        <div className={className} style={style}>
            {
                model._groups.map((group, idx) => {
                    return (
                        // TODO we should pass the whole model    
                        <ColumnGroupHeader
                            key={idx}
                            ref={group.locked ? null : scrollingHeader}
                            columnGroup={group}
                            model={model}
                            onColumnMove={handleColumnMove}
                            colHeaderRenderer={colHeaderRenderer}
                            colGroupHeaderRenderer={colGroupHeaderRenderer}
                        />

                    );

                })}
        </div>
    );

}))
