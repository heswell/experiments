
const SORT_ASC = 'asc';

export function mapSortCriteria(sortCriteria, columnMap) {
    return sortCriteria.map(s => {
        if (typeof s === 'string') {
            return [columnMap[s], 'asc'];
        } else if (Array.isArray(s)) {
            const [columnName, sortDir] = s;
            return [columnMap[columnName], sortDir || SORT_ASC];
        } else {
            throw Error('columnUtils.mapSortCriteria invalid input');
        }

    });
}

export function buildColumnMap(columns){
    if (columns){
        return columns.reduce((map, column, i) => {
            if (typeof column === 'string'){
                map[column] = i;
            } else if (typeof column.key === 'number') {
                map[column.name] = column.key;
            } else {
                map[column.name] = i;
            }
            return map;
        },{})
    } else {
        return null;
    }
}

export function projectColumns(map, columns){
    const length = columns.length;
    return startIdx => (row,i) => {
        const out = [];
        for (let i=0;i<length;i++){
            const colIdx = map[columns[i].name];
            out[i] = row[colIdx];
        }
        // assume row[0] is key for now
        out.push(startIdx+i, 0, 0, row[0]);
        return out;
    }
}

export const toColumn = column =>
    typeof column === 'string'
        ? { name: column }
        : column;

export function getFilterType(column){
    return column.filter || getDataType(column);
}

export function getDataType({type=null}){
    return type === null
        ? 'set'
        : typeof type === 'string'
            ? type
            : typeof type === 'object'
                ? type.name
                : 'set';

}

//TODO cache result by length
export function metaData(columns){
    const len = columns.length;
    let metaStart = 0;
    const next = () => len + metaStart++;
    return {
        IDX: next(),
        DEPTH: next(),
        COUNT: next(),
        KEY: next(),
        PARENT_IDX: next(),
        IDX_POINTER: next(),
        FILTER_COUNT: next(),
        NEXT_FILTER_IDX: next(),
        count: columns.length + metaStart
    }
}
