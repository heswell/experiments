import * as Data from './constants.js';

export function isEmptyRow(row){
    return row.length === 4;
}

export function assignRowIndices(rows, offset) {
    const s1 = new Date().getTime()
    for (let i = 0, len = rows.length; i < len; i++) {
        rows[i][Data.INDEX_FIELD] = i + offset;
    }
    const s2 = new Date().getTime()
    console.log(`assignRowIndices took ${s2-s1} ms`)
    return rows;
}

export function indexRows(rows, indexField) {
    return addRowsToIndex(rows, {}, indexField)
}

export function addRowsToIndex(rows, index, indexField = Data.UNIQUE_KEY_FIELD){
    for (let idx = 0, len=rows.length; idx < len; idx++) {
        index[rows[idx][indexField]] = idx; // USE THE PRIMARY KEY <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    }
    return index;
}

export function update(rows, range, updates) {
    const results = rows.slice();

    for (let i = 0; i < updates.length; i++) {
        const [idx, ...fieldUpdates] = updates[i];
        // slow, refactor for performance

        let row;
        for (let ii = 0; ii < rows.length; ii++) {
            if (rows[ii][Data.INDEX_FIELD] === idx) {
                row = rows[ii].slice();
                // updates = [colIdx, oldValue, newValue]*
                for (let j = 0; j < fieldUpdates.length; j += 2) {
                    //TODO where should the +4 be resolved ?
                    row[fieldUpdates[j] + 4] = fieldUpdates[j + 2];
                }
                results[ii] = row;

                break;

            }
        }
    }

    return results;
}


// export so we can test - see if we can't use rewire
// Called when client calls setRange, locally cached data is immediately
// trimmed to new range and missing data filled with empty rows. 
export function purgeAndFill({range:{lo, hi}, rows, offset = 0}) {

    const results = [];
    const len = rows.length;
    const low = lo + offset;
    const high = hi + offset;

    let row;
    let firstRowIdx = -1;


    // 1) do we need any fills at the beginning ? 
    while (row === undefined && firstRowIdx < len) {
        firstRowIdx += 1;
        row = rows[firstRowIdx];
    }

    let idx = row ? row[Data.INDEX_FIELD] : high;

    const end = Math.min(idx, high);
    for (let i = low; i < end; i++) {
        results.push([i, 0, 0, 0]);
    }

    if (end === high) {
        // we're done if we've already filled the results
        return results;
    }

    // 2) existing rows that still fall within range go into results
    for (let i = firstRowIdx; i < len; i++) {
        row = rows[i];
        if (row) {
            idx = row[Data.INDEX_FIELD];
            if (idx >= low && idx < high) {
                results.push(row);
            }
        } else {
            //onsole.log(`rowUtils.purgeAndFill gap at ${i}`);
            results.push([i, 0, 0, 0]);
        }
    }

    // 3) pad results to end of range
    const start = Math.max(idx + 1, low);
    for (let i = start; i < high; i++) {
        results.push([i, 0, 0, 0]);
    }

    return results;

}


// New data is merged into local cache
export function mergeAndPurge({range:{lo, hi}, rows, offset = 0}, newRows, size) {
    // console.groupCollapsed(`mergeAndPurge  existing range: ${lo} - ${hi} 
    //  old   rows: [${rows.length ? rows[0][0]: null} - ${rows.length ? rows[rows.length-1][0]: null}]
    //  new   rows: [${newRows.length ? newRows[0][0]: null} - ${newRows.length ? newRows[newRows.length-1][0]: null}]
    //     `);

    const results = [];
    const low = lo + offset;
    const high = Math.min(hi + offset, size + offset);

    let idx;
    let row;

    for (let i = 0; i < rows.length; i++) {
        if (row = rows[i]) {
            idx = row[Data.INDEX_FIELD];
            if (idx >= low && idx < high) {
                results[idx - low] = rows[i];
            }
        }
    }

    for (let i = 0; i < newRows.length; i++) {
        if (row = newRows[i]) {
            idx = row[Data.INDEX_FIELD];

            if (idx >= low && idx < high) {
                results[idx - low] = newRows[i];
            }
        }
    }

    // make sure the resultset contains entries for the full range
    // TODO make this more efficient
    const rowCount = hi - lo;
    for (let i=0;i<rowCount;i++){
        if (results[i] === undefined){
            results[i] = [i+low, 0, 0, 0];
        }
    }
    // console.log(`results ${JSON.stringify(results,null,2)}`);
    // console.groupEnd();
    return results;

}

