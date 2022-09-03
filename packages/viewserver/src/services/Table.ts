import { Table as BaseTable } from '@heswell/data';

export default class Table extends BaseTable {
  async loadData(dataPath) {
    console.log(`import data from ${dataPath}`);
    try {
      const { default: data } = await import(`${dataPath}`);
      if (data) {
        this.parseData(data);
      }
    } catch (e) {
      console.error(`failed to load data from path '${dataPath}'`, e);
    }
  }

  async installDataGenerators({ createPath, updatePath }) {
    if (createPath) {
      const { default: createGenerator } = await import(`${createPath}`);
      this.createRow = createGenerator;
    }
    if (updatePath) {
      const { default: updateGenerator } = await import(`${updatePath}`);
      this.updateRow = updateGenerator;
    }
  }
}
