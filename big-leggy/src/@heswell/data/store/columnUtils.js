import {functor, overrideColName} from './filter';

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

export function projectColumns(map, columns, meta){
    const length = columns.length;
    const {IDX, DEPTH, COUNT, KEY, SELECTED} = meta;
    return startIdx => (row,i) => {
        const out = [];
        for (let i=0;i<length;i++){
            const colIdx = map[columns[i].name];
            out[i] = row[colIdx];
        }
        // assume row[0] is key for now
        // out.push(startIdx+i, 0, 0, row[0]);
        out[IDX] = startIdx+i;
        out[DEPTH] = 0;
        out[COUNT] = 0;
        out[KEY] = row[0];
        out[SELECTED] = 0;
        return out;
    }
}

export function projectColumnsFilter(map, columns, meta, filter){
    const length = columns.length;
    const {IDX, DEPTH, COUNT, KEY, SELECTED} = meta;

    // this is filterset specific where first col is always value
    const fn = filter ? functor(map, overrideColName(filter, 'value'), true)  : () => true;
    return startIdx => (row,i) => {
        const out = [];
        for (let i=0;i<length;i++){
            const colIdx = map[columns[i].name];
            out[i] = row[colIdx];
        }
        // assume row[0] is key for now
        // out.push(startIdx+i, 0, 0, row[0]);
        out[IDX] = startIdx+i;
        out[DEPTH] = 0;
        out[COUNT] = 0;
        out[KEY] = row[0];
        out[SELECTED] = fn(row) ? 1 : 0;

        return out;
    }
}

export const toKeyedColumn = (column, key) =>
    typeof column === 'string'
        ? { key, name: column }
        : typeof column.key === 'number'
            ? column
            : {...column, key};

export const toColumn = column =>
    typeof column === 'string'
        ? { name: column }
        : column;

export function getFilterType(column){
    return column.filter || getDataType(column);
}

// {name: 'Price', 'type': {name: 'price'}, 'aggregate': 'avg'},
// {name: 'MarketCap', 'type': {name: 'number','format': 'currency'}, 'aggregate': 'sum'},

export function getDataType({type=null}){
    if (type === null){
        return 'set';
    } else if (typeof type === 'string'){
        return type;
    } else {
        switch(type.name){
            case 'price':
                return 'number';
            default:
                return type.name;
        }
    }

}

//TODO cache result by length
export function metaData(columns){
    const start = Math.max(...columns.map((column, idx) => typeof column.key === 'number' ? column.key : idx));
    return {
        IDX: start + 1,
        DEPTH: start + 2,
        COUNT: start + 3,
        KEY: start + 4,
        SELECTED: start + 5,
        PARENT_IDX: start + 6,
        IDX_POINTER: start + 7,
        FILTER_COUNT: start + 8,
        NEXT_FILTER_IDX: start + 9,
        count: start + 10
    }
}
