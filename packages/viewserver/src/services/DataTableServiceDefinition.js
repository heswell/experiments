import path from 'path';
import url from 'url';

// TODO unify these with server-api/messages
const ServerApiMessageTypes = {
  addSubscription: 'AddSubscription'
}

const data_path = path.dirname(new url.URL(import.meta.url).pathname);

export const ServiceDefinition = {
  name: 'DataTableService',
  module: `${data_path}/DataTableService.mjs`,
  API: [
      'GetTableList',
      'GetTableMeta',
      ServerApiMessageTypes.addSubscription,
      'TerminateSubscription',
      'setViewRange',
      'GetFilterData',
      'GetSearchData',
      'ModifySubscription',
      'InsertTableRow',
      'groupBy',
      'sort',
      'filter',
      'select',
      'setGroupState',
      'ExpandGroup',
      'CollapseGroup',
      'unsubscribeAll'
  ]
};
