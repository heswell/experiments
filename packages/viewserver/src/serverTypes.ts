// copied thtis here until we have typedefs in packagess

export interface ServiceDefinition {
  name: string;
  module: string;
  API: string[];
}

export interface TableProps {
  name: string;
}

export interface TableConfig extends TableProps {
  dataPath: string;
}

export interface ServerConfig {
  DataTables: TableConfig[];
  services: ServiceDefinition[];
}
