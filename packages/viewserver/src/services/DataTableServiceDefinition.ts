import path from 'path';
import url from 'url';

// TODO unify these with server-api/messages
const ServerApiMessageTypes = {
  addSubscription: 'AddSubscription'
};

// const data_path = path.dirname(new url.URL(import.meta.url).pathname);
const data_path = url.pathToFileURL(__dirname).toString();

export const ServiceDefinition = {
  name: 'DataTableService',
  module: `${data_path}/DataTableService.js`,
  API: [
    'HB_RESP',
    'GET_TABLE_LIST',
    'GET_TABLE_META',
    'CREATE_VP',
    'CHANGE_VP',
    'CHANGE_VP_RANGE',
    'TerminateSubscription',
    'GetFilterData',
    'GetSearchData',
    'ModifySubscription',
    'InsertTableRow',
    'groupBy',
    'filter',
    'select',
    'selectAll',
    'selectNone',
    'setGroupState',
    'ExpandGroup',
    'CollapseGroup',
    'unsubscribeAll'
  ]
};
