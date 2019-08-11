export function expandStatesfromGroupState({columns},groupState){
    const results = Array(columns.length).fill(-1);
    let all = groupState && groupState['*'];
    let idx = 0;
    while (all){
        results[idx] = 1;
        all = all['*'];
    }
    return results;
}
