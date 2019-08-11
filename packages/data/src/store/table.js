/*global fetch */
import {EventEmitter} from '@heswell/utils';
import {buildColumnMap} from './columnUtils'

const defaultUpdateConfig = {
    applyUpdates: false,
    applyInserts: false,
    interval: 500
}

export default class Table extends EventEmitter {

    constructor(config){
        super();

        const {name, columns=null, primaryKey, dataPath, data, updates = {}} = config;

        this.name = name;
        this.primaryKey = primaryKey;
        this.columns = columns;
        this.keys = {};
        this.index = {};
        this.rows = [];
        this.updateConfig = {
            ...defaultUpdateConfig,
            ...updates
        }
        this.columnMap = buildColumnMap(columns);
        this.columnCount = 0;
        this.status = null;

        // console.log(`Table 
        //     columns = ${JSON.stringify(columns,null,2)}
        //     columnMap = ${JSON.stringify(this.columnMap,null,2)}    
        //     `)


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
            const colIdx = updates[i];
            const value = updates[i+1];
            results.push(colIdx, row[colIdx], value);
            row[colIdx] = value;
        }
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
            this.columnMap = buildColumnMap(this.columns);
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
        const {index, primaryKey=null, columnMap: map} = this;

        if (Array.isArray(data)){
            const key = data[map[this.primaryKey]];
            index[key] = idx;
            return [...data, idx, key];
        } else {
            // This allows us to load data from objects as rows, without predefined columns, where
            // not every row may have every column. How would we handle primary key ?
            const columnMap = map || (this.columnMap = {});
            const colnames = columnnameList || Object.getOwnPropertyNames(data);
            const row = [idx];
            let colIdx;
            let key;

            for (let i=0; i<colnames.length; i++){
                const name = colnames[i];
                const value = data[name];
                if ((colIdx = columnMap[name]) === undefined){
                    colIdx = columnMap[name] = this.columnCount++;
                }
                row[colIdx] = value;
                // If we don't know the primary key, assume it is the first column for now
                if ((name === primaryKey) || (primaryKey === null && i === 0)){
                    key = value;
                    index[value] = idx;
                }
            }
            // doesn't this risk pushing the metadata into the wrong slots if not every row has every 
            // field
            row.push(idx, key)
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
        const {rows} = this;
        // const count = Math.round(rows.length / 50);
        const count = 100;

        for (let i=0; i<count; i++){
            const rowIdx = getRandomInt(rows.length - 1);
            const update = this.updateRow(rowIdx, this.rows[rowIdx], this.columnMap);
            if (update){
                this.update(rowIdx, ...update);
            }
        }

        setTimeout(() => this.applyUpdates(),this.updateConfig.interval);

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

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
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
