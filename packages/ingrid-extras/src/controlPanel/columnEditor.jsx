import React from 'react';
import StringFormatter from './formatters/stringFormatter';
import NumberFormatter from './formatters/numberFormatter';
import DataTypes, {registerFormatter, registerRenderer} from './datatypeRegistry';
import BackgroundCell from '@heswell/fingrid/src/cells/rendering/renderers/backgroundCell';

//TODO where is the best place to perform the registration
registerFormatter('number', NumberFormatter);
registerRenderer('background', BackgroundCell);

const NULL_RENDERER = () => null;
const DEFAULT_TYPE = {name:''};

export default class ColumnEditor extends React.Component {

    render(){
        const {style, column, columnType:type=DEFAULT_TYPE, formatters=[]} = this.props;
        const Formatter =  
            type.name === 'string' ? StringFormatter :
            type.name === 'number' ? NumberFormatter :
            DataTypes[type.name] || NULL_RENDERER;
        
        if (column === null){
            return <div>Please select one or more columns</div>;
        }

        const columnTypes = ['number','string','date','time','boolean'].concat(formatters);
        const options = columnTypes.map(value => <option key={value} value={value}>{value}</option>);

        return (
            <div className="ColumnEditor" style={style}>
                <div>{column.name}</div>
                <select value={type.name} onChange={this.changeDataType}>
                    {options}
                </select>
                <Formatter onRuleChange={this.changeRules} validation={type.validation} 
                    formatting={type.formatting} renderer={type.renderer}/>
            </div>
        );
    }

    changeDataType = (evt) => {
        const value = evt.target.value;
        this.props.onChange(this.props.column, {name:value});
    }

    changeRules = (category, rules) => {
        console.log(`change rules ${category} ${JSON.stringify(rules)}`)
        const {columnType} = this.props;
        this.props.onChange(this.props.column, {...columnType, [category]: rules});
    }

}