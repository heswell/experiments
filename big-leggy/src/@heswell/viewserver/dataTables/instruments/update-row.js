export function updateRow(idx, row, columnMap) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    return [columnMap['Price'], row[2] * (1 + direction * Math.random() / 10)];
}
