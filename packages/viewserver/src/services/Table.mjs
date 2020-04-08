import {Table as BaseTable} from '@heswell/data-store';

export default class Table extends BaseTable {

    async loadData(dataPath){
        console.log(`import data from ${dataPath}.mjs`)
        try {
            const {default: data} = await import(`${dataPath}.mjs`);
            if (data) {
                this.parseData(data);
            } 
        } catch(e){
            console.error(`failed to load data from path '${dataPath}'`, e)
        }
    }

    async installDataGenerators({createPath, updatePath}){
        if (createPath){
            const {default:createGenerator} = await import(`${createPath}.mjs`);
            this.createRow = createGenerator;
        }
        if (updatePath){
            const {default: updateGenerator} = await import(`${updatePath}.mjs`);
            this.updateRow = updateGenerator;
        }
    }

}
