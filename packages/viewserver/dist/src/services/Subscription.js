import { DataView as View, columnUtils, DataTypes } from "@heswell/data";
function Subscription(table, viewportId, { requestId, ...options }, queue) {
  const { columns: requestedColumns, filterSpec, groupBy, range, sort } = options;
  const { name: tablename, columns: availableColumns } = table;
  const columns = requestedColumns.length > 0 ? requestedColumns : availableColumns;
  let view = new View(table, { columns, filterSpec, groupBy, sort });
  let timeoutHandle;
  const tableMeta = columnUtils.metaData(columns);
  console.log(`Subscription ${tablename} ${JSON.stringify(options, null, 2)} table.status ${table.status} view.status ${view.status}`);
  queue.push({
    requestId,
    sessionId: "",
    token: "",
    user: "",
    body: {
      table: tablename,
      type: "CREATE_VP_SUCCESS",
      tablename,
      columns,
      size: view.size,
      offset: view.offset,
      viewportId
    }
  });
  if (view.status === "ready") {
    const data = view.setRange(range);
    if (data.rows.length) {
      console.log(`initial set of data returned immediately on Subscription ${JSON.stringify(range)} (${data.rows.length} rows)`);
      queue.push({
        viewport,
        type: "snapshot",
        data
      });
    }
  }
  function collectUpdates() {
    let { updates, range: range2 } = view.updates;
    updates.forEach((batch) => {
      const { type, updates: updates2, rows, size, offset } = batch;
      if (type === "rowset") {
        queue.push({
          priority: 2,
          viewport,
          type,
          tablename,
          data: {
            rows,
            size,
            offset,
            range: range2
          }
        }, tableMeta);
      } else {
        queue.push({
          priority: 2,
          viewport,
          type,
          tablename,
          updates: updates2,
          rows,
          size,
          offset,
          range: range2
        }, tableMeta);
      }
    });
    timeoutHandle = setTimeout(collectUpdates, 100);
  }
  timeoutHandle = setTimeout(collectUpdates, 1e3);
  return Object.create(null, {
    invoke: {
      value: (method, queue2, type, ...params) => {
        let data, filterData;
        if (method === "filter") {
          [data, ...filterData] = view[method](...params);
        } else {
          data = view[method](...params);
        }
        const meta = type === DataTypes.FILTER_DATA ? columnUtils.setFilterColumnMeta : tableMeta;
        if (data) {
          queue2.push({
            priority: 1,
            viewport,
            type,
            data
          }, meta);
        }
        filterData && filterData.forEach((data2) => {
          queue2.push({
            priority: 1,
            viewport,
            type: DataTypes.FILTER_DATA,
            data: data2
          }, columnUtils.setFilterColumnMeta);
        });
      }
    },
    update: { value: (options2, queue2) => {
      const { range: range2, ...dataOptions } = options2;
      queue2.push({
        priority: 1,
        viewport,
        type: "rowset",
        tablename,
        data: {
          rows: view.rows(range2, options2),
          size: view.size,
          offset: view.offset
        }
      });
    } },
    cancel: { value: () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
      view.destroy();
      view = null;
    } }
  });
}
export {
  Subscription as default
};
//# sourceMappingURL=Subscription.js.map
