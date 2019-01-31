let size;

export function getScrollbarSize() {
    if (size === undefined) {

        let outer = document.createElement('div');
        outer.className = 'scrollable-content';
        outer.style.width = '50px';
        outer.style.height = '50px';
        outer.style.overflowY = 'scroll';
        outer.style.position = 'absolute';
        outer.style.top = '-200px';
        outer.style.left = '-200px';
        const inner = document.createElement('div');
        inner.style.height = '100px';
        inner.style.width = '100%';
        outer.appendChild(inner);
        document.body.appendChild(outer);
        const outerWidth = outer.offsetWidth;
        const innerWidth = inner.offsetWidth;
        document.body.removeChild(outer);
        size = outerWidth - innerWidth;
        outer = null;
    }

    return size;
}

export function getColumnWidth(column) {
    const {columns} = column;
    let outer = document.createElement('div');
    outer.className = 'Grid GroupbyHeaderCell';
    outer.style.cssText = 'display:inline-block';
    outer.innerText = columns.map(col => col.name).join(``);
    document.body.appendChild(outer);
    const w = outer.offsetWidth;
    document.body.removeChild(outer);
    outer = null;
    return w + 50 + (columns.length-1) * 50;
}
