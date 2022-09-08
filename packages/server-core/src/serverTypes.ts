export interface ServiceDefinition {
  name: string;
  module: string;
  API: string[];
}

export interface TableConfig {
  name: string;
}

export interface ServerConfig {
  DataTables: TableConfig[];
  services: ServiceDefinition[];
}
