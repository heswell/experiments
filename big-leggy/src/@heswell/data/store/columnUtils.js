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

export function buildColumnMap(columns, leadMetaCount=0){
    if (columns){
        return columns.reduce((map, column, i) => {
            if (typeof column === 'string'){
                map[column] = leadMetaCount + i;
            } else if (column.key) {
                map[column.name] = leadMetaCount + column.key;
            } else {
                map[column.name] = leadMetaCount + i;
            }
            return map;
        },{})
    } else {
        return null;
    }
}

export function ColumnMap(cols) {
    return cols.reduce((map, col) => {
        map[col.name] = col.key; return map;
    }, {});
}

export function rowColumnMap(columns, columnMap){
    const results = [];
    columns.forEach(column => {
        if (column.composite){
            results.push(column.colummns.map(colName => columnMap[colName]));
        } else {
            results.push(columnMap[column.name]);
        }
    })
    return results;
}

export function projectColumns(map, columns){
    const length = columns.length;
    return startIdx => (row,i) => {
        const out = Array(length+4);
        out[0] = startIdx + i;
        out[1] = 0;
        out[2] = 0;
        out[3] = row[1];
        for (let i=0;i<length;i++){
            const colIdx = map[columns[i].name];
            out[i+4] = row[colIdx];
        }
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
    let metaStart = 4;
    const next = () => len + metaStart++;
    return {
        DEPTH: 1,
        COUNT: 2,
        PARENT_IDX: next(),
        IDX_POINTER: next(),
        FILTER_COUNT: next(),
        NEXT_FILTER_IDX: next()
    }
}
