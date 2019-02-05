import {Table as BaseTable} from '../../data';

export default class Table extends BaseTable {

    async loadData(dataPath){
        const data = await import(dataPath);
        if (data) {
            this.parseData(data);
        } 
    }

    async installDataGenerators({createPath, updatePath}){
        if (createPath){
            const createGenerator = await import(createPath);
            this.createRow = createGenerator;
        }
        if (updatePath){
            const updateGenerator = await import(updatePath);
            this.updateRow = updateGenerator;
        }
    }

}
