export function findKey(arr, test){
    for (let i=0;i<arr.length;i++){
        if (test(arr[i])){
            return arr[i].key;
        }
    }
}

export function indexOf(arr, test){
    for (let i=0;i<arr.length;i++){
        if (test(arr[i])){
            return i;
        }
    }
    return -1;
}

export function replace(arr,idx, value){
    const result = arr.slice();
    result[idx] = value;
    return result;
}

