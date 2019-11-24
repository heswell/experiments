/*
  See UpdateQueue
*/
//TODO does this belong in view ?
import {EventEmitter} from '@heswell/utils';
import {DataTypes} from './types';

export default class UpdateQueue extends EventEmitter {

    // not the right name
    update(update, dataType = DataTypes.ROW_DATA) {
        this.emit(dataType, update);
    }

    resize(size) {
        console.log(`localUpdateQueue resize ${JSON.stringify(size)}`)
    }

    append(row, offset) {
        console.log(`localUpdateQueue append ${JSON.stringify(row)} offset ${offset}`)
    }

    replace(rows, size, range, offset) {
        console.log(`localUpdateQueue replace ${JSON.stringify(rows)} size ${size} offset ${offset}`)
        this.emit(DataTypes.ROW_DATA, {rows, size, range, offset})
    }

    popAll() {
        console.log(`localUpdateQueue popAll`)
    }
}
