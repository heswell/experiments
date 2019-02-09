
export default class KeyMap {

    constructor(displayStart, displayEnd, indexOfFirstRow=0, keys=null){

        this.displayStart = displayStart;
        this.displayEnd = displayEnd;
        this.indexOfFirstRow = indexOfFirstRow;

        if (keys){
            for (let k in keys){
                this[k] = keys[k];
            }
        } else {
            for (let i=displayStart,idx=0;i<displayEnd;i++,idx++){
                this[i] = idx;
            }
        }
    }

    contains(key){
        return key >= this.displayStart && key <= this.displayEnd;
    }

    moveTo(displayStart, displayEnd, indexOfFirstRow){
        const insertAtHead = displayStart === this.displayStart &&
            displayEnd === this.displayEnd &&
            indexOfFirstRow < this.indexOfFirstRow;

        //onsole.log(`KeyMap.moveTo [${displayStart} - ${displayEnd}] indexOfFirstRow: ${indexOfFirstRow} insertAtHead=${insertAtHead}`);
        //TODO we need to determine how many rows have been inserted
        const keys = insertAtHead && false
            ? shiftKeys(this, displayStart, displayEnd, this.indexOfFirstRow - indexOfFirstRow)
            : scrollKeys(this, displayStart, displayEnd);

        return new KeyMap(displayStart, displayEnd, indexOfFirstRow, keys);
    }
}

function shiftKeys(keyMap, displayStart, displayEnd, shiftCount){

    let key;
    const keys = {};
    const usedKeys = [];

    if (shiftCount >= displayEnd - displayStart){
        return null;
    }

    // this assumes displayStart is zero
    for (let i=displayStart;i<displayEnd-shiftCount;i++){
        if (keyMap.contains(i)){
            //key = keys[i] = keyMap[i]-shiftCount;
            key = keys[i+shiftCount] = keyMap[i];
            usedKeys[key] = true;
        }
    }

    const nextKey = getNext(usedKeys);

    for (let i=displayStart;i<displayEnd;i++){
        if (typeof keys[i] === 'undefined'){
            keys[i] = nextKey();
        }
    }

    return keys;

}

function scrollKeys(keyMap, displayStart, displayEnd){
    if (displayEnd < keyMap.displayStart || displayStart > keyMap.displayEnd){
        //onsole.log(`scrollKeys reset keys [${displayStart} - ${displayEnd}]`);
        // keys will be reset
        return null;
    }

    // console.groupCollapsed(`scrollKeys [${displayStart} - ${displayEnd}]`);
    // console.log(` >>> ${JSON.stringify(keyMap)}`);

    let key;
    const keys = {};
    const usedKeys = [];

    for (let i=displayStart;i<displayEnd;i++){
        if (keyMap.contains(i)){
            key = keys[i] = keyMap[i];
            usedKeys[key] = true;
        }
    }

    const nextKey = getNext(usedKeys);

    for (let i=displayStart;i<displayEnd;i++){
        if (typeof keys[i] === 'undefined'){
            keys[i] = nextKey();
        }
    }

    // console.log(`<<< ${JSON.stringify(keys)}`);
    // console.groupEnd();
    return keys;

}

function getNext(taken){
    let _idx = 0;
    return function(){
        while (taken[_idx]){
            _idx += 1;
        }
        return _idx++;
    };
}