import url from 'url';

// const data_path = path.dirname(new url.URL(import.meta.url).pathname);
const data_path = url.pathToFileURL(__dirname).toString();

export const ServiceDefinition = {
  name: 'DataTableService',
  module: `${data_path}/DataTableService.js`
};
