import { useRef } from 'react';

export default function useKeys(columns){
  const map = useRef(new Map(columns.map((column,idx) => [column.key, idx])));
  const maxKey = useRef(map.current.size);

  function nextKey(){
    const next = maxKey.current;
    maxKey.current += 1;
    console.log(`next key assigned ${next}`)
    return next;
  }

  console.log(`useKeys calculate next keys`)
  if (!columns.every(column => map.current.has(column.key))){

    const map1 = map.current;
    const map2 = new Map();
    const columnsAwaitingKeys = [];
  
    columns.forEach(column => {
      if (map1.has(column.key)){
        map2.set(column.key, map1.get(column.key));
        map1.delete(column.key);
      } else {
        columnsAwaitingKeys.push(column.key)
      }
    });
  
    const freeKeys = Array.from(map1.values());
    columnsAwaitingKeys.forEach(columnKey => {
      map2.set(columnKey, freeKeys.length ? freeKeys.shift(): nextKey());
    })
    
    map.current = map2;
    
  }

  return map.current;
}
