/*global fetch */
import {EventEmitter} from '@heswell/utils';
import {buildColumnMap} from './columnUtils'

// meta fields are the idx and the primary key
const META_COUNT = 2;

export default class Table extends EventEmitter {

    constructor(config){
        super();

        const {name, columns=null, primaryKey, dataPath, data} = config;

        this.name = name;
        this.primaryKey = primaryKey;
        this.columns = columns;
        this.keys = {};
        this.index = {};
        this.rows = [];
        this.updateConfig = config.updates;

        this.inputColumnMap = buildColumnMap(columns);
        this.outputColumnMap = buildColumnMap(columns, META_COUNT);
        this.columnCount = 0;
        this.status = null;

console.log(`inputColumnMap ${JSON.stringify(this.inputColumnMap)}`)
console.log(`outputColumnMap ${JSON.stringify(this.outputColumnMap)}`)


        if (data){
            this.parseData(data);
        } else if (dataPath){
            this.loadData(dataPath);
        }

        this.installDataGenerators(config);
    }

    // ...updates = one or more pairs of (colIdx, colValue)
    update(rowIdx, ...updates){
        //onsole.log(`Table.update ${this.name} idx: ${rowIdx}  ${JSON.stringify(updates)}` );
        const results = [];
        let row = this.rows[rowIdx];
        for (let i=0;i<updates.length;i+=2){
            // return [colIdx, originalValue, newValue, ...]
            const absIdx = updates[i];
            const colIdx = absIdx - META_COUNT;
            const value = updates[i+1];
            results.push(colIdx, row[absIdx], value);
            row[absIdx] = value;
        }
        console.log(`table emit update ${results}`)
        this.emit('rowUpdated', rowIdx, results);
    }

    insert(data){
        let columnnameList = this.columns ? this.columns.map(c => c.name): null;
        const idx = this.rows.length;
        let row = this.rowFromData(idx, data, columnnameList);
        this.rows.push(row);
        this.emit('rowInserted', idx, row);
    }

    remove(key){
        if (this.keys[key]){
            const index = this.indices[key];
            delete this.keys[key];
            delete this.indices[key];
            this.rows.splice(index,1);

            for (let k in this.indices){
                if (this.indices[k] > index){
                    this.indices[k] -= 1;
                }
            }

            this.emit('rowRemoved', this.name, key);

        }
    }

    clear(){

    }

    toString(){
        const out = ['\n' + this.name];
        out.splice.apply(out, [1,0].concat(this.rows.map(function(row){return row.toString();})));
        return out.join('\n');
    }

    async loadData(url){
        console.log(`load data from ${url} for ${this.name}`)
        fetch(url,{

        })
            .then(data => data.json())
            .then(json => {
                console.log(`Table.loadData: got ${json.length} rows`);
                this.parseData(json);
            })
            .catch(err => {
                console.error(err);
            });

    }

    parseData(data){
        let columnnameList = this.columns ? this.columns.map(c => c.name): null;
        const rows = [];
        for (let i=0;i<data.length;i++){
            let row = this.rowFromData(i, data[i], columnnameList);
            rows.push(row);
        }
        this.rows = rows;

        if (this.columns === null){
            this.columns = columnsFromColumnMap(this.inputColumnMap);
            this.inputColumnMap = buildColumnMap(this.columns);
            this.outputColumnMap = buildColumnMap(this.columns, META_COUNT);
        }
        this.status = 'ready';
        this.emit('ready');
        if (this.updateConfig && this.updateConfig.applyUpdates !== false){
            setTimeout(() => {
                this.applyUpdates();
            },1000);
        }
        // move this
        if (this.updateConfig && this.updateConfig.applyInserts !== false){
            setTimeout(() => {
                this.applyInserts();
            },10000);
        }
    }

    rowFromData(idx, data, columnnameList){
        // 2 metadata items for each row, the idx and unique key
        const {index, primaryKey=null, inputColumnMap: map} = this;

        if (Array.isArray(data)){
            const key = data[map[this.primaryKey]];
            index[key] = idx;
            return [idx, key, ...data];
        } else {
            // This allows us to load data from objects as rows, without predefined columns, where
            // not every row may have every column. How would we handle primary key ?
            const columnMap = map || (this.inputColumnMap = {});
            const colnames = columnnameList || Object.getOwnPropertyNames(data);
            const row = [idx];
            let colIdx;

            for (let i=0; i<colnames.length; i++){
                const name = colnames[i];
                const value = data[name];
                if ((colIdx = columnMap[name]) === undefined){
                    colIdx = columnMap[name] = this.columnCount++;
                }
                row[colIdx+2] = value;
                // If we don't kno the primary key, assume it is the first column for now
                if ((name === primaryKey) || (primaryKey === null && i === 0)){
                    row[1] = value;
                    index[value] = idx;
                }
            }
            return row;
        }
    }

    //TODO move all these methods into an external helper
    applyInserts(){

        const idx = this.rows.length;
        const newRow = this.createRow(idx);
        if (newRow){
            this.insert(newRow);
        } else {
            console.log(`createRow did not return a new row`);
        }

        setTimeout(() => this.applyInserts(),5000);

    }

    applyUpdates(){
        for (let i=0;i<this.rows.length;i++){
            if (Math.random() > 0.75){
                const update = this.updateRow(i, this.rows[i], this.outputColumnMap);
                if (update){
                    this.update(i, ...update);
                }
            }
        }

        setTimeout(() => this.applyUpdates(),500);

    }

    createRow(idx){
        console.warn(`createRow ${idx} must be implemented as a plugin`);
    }

    updateRow(/*idx, row, columnMap*/){
        return null;
    }

    async installDataGenerators(/*config*/){
        //console.warn(`installDataGenerators must be implemented by a more specific subclass`);
    }

}

function columnsFromColumnMap(columnMap){

    const columnNames = Object.getOwnPropertyNames(columnMap);

    return columnNames
        .map(name => ({name, key: columnMap[name]}))
        .sort(byKey)
        .map(({name}) => ({name}));

}

function byKey(col1, col2){
    return col1.key - col2.key;
}
