import Konva from 'konva';
import './drop-menu.css';

const COLOURS = ['red', 'green', 'blue', 'yellow'];

// Konva properties
const PATH_SETTINGS = {
    fill: '#00D2FF',
    strokeWidth: 0
}

export default class DropMenu {

    constructor({ layer, hover }) {

        this._group = new Konva.Group();

        this._group.on('mouseleave', () => hover(null));

        layer.add(this._group);
        
        this.visible = isVisible => this._group.visible(isVisible)

        this.addPaths = paths => {

            paths.forEach(({ path, dropTarget }) => {
                this._group.add(path);
                path.on('mouseenter', () => hover(dropTarget));
            })
        }

    }

    computeMenuPosition(dropTarget, measurements, offsetTop = 0, offsetLeft = 0) {

        const { component, pos } = dropTarget;
        const box = measurements[component.$path];

        const dropTargets = getDropTargets(dropTarget);

        const [x, y] = menuPosition(pos, box, dropTargets.length, offsetTop, offsetLeft);

        this._group.position({ x, y });

        const paths = dropTargets.map((dropTarget, i) => ({
            path: new Konva.Path({
                strokeWidth: 0,
                fill: COLOURS[i],
                data: pathPosition(pos, i)
            }),
            dropTarget
        }));

        // do we have to care about removing eventlisteners ? Probably not
        this._group.removeChildren();

        this.addPaths(paths);
    }

}

function pathPosition(pos, idx) {

    const unit = 30;
    const depth = 32;

    const lo = i => i === 0 ? -unit / 2
        : i > 0 ? -1 * (unit / 2 + (idx * unit))
            : unit / 2 + ((-idx - 1) * unit);

    const [top, left, width, height] =
        pos.position.West ? [lo(idx), 0, depth, unit] :
            pos.position.East ? [lo(idx), -depth, depth, unit] :
                pos.position.South ? [-depth, lo(idx), unit, depth] :
    	/* North | Header */[0, lo(idx), unit, depth];

    // For pos 0 we draw just one item (the central item), for others we double up	
    return `M${left},${top}h${width}v${height}h-${width}v-${height}${idx > 0 ? pathPosition(pos, -idx) : ''}`;

}

function menuPosition(pos, box, count, offsetTop, offsetLeft) {

    return pos.position.West ? [box.left - offsetLeft + 26, pos.y - offsetTop]
        : pos.position.South ? [pos.x - offsetLeft, box.bottom - offsetTop - 26]
            : pos.position.East ? [box.right - offsetLeft - 26, pos.y - offsetTop]
        /* North | Header*/ : [pos.x - offsetLeft, box.top - offsetTop + 26];

}

// This might be a method on dropTarget ?
function getDropTargets(dropTarget) {

    const dropTargets = [dropTarget];

    while (dropTarget = dropTarget.nextDropTarget) {
        dropTargets.push(dropTarget);
    }

    return dropTargets;

}




