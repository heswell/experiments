import React from 'react';
import {roundDecimal} from '@heswell/fingrid/src/cells/formatting/utils/number';

const defaultFormatting = {};
const numberOr = (value, fallback) => typeof value === 'number' ? value : fallback;

export default class NumberFormatter extends React.Component {
    
    static formatter = (value, {formatting=defaultFormatting}) => {
        const {decimals, zeroPad, align, alignOnDecimals=false} = formatting;
        const numberOfDecimals = numberOr(decimals,4);
        return <div className='num'>{roundDecimal(value, numberOfDecimals, align, zeroPad, alignOnDecimals)}</div>;
    }

    render(){

        const {formatting={}} = this.props;
        const {decimals='', zeroPad=false, align='left',alignOnDecimals=false} = formatting; 
        const alignOptions = [
            <option key='left' value='left'>{'Left'}</option>,
            <option key='center' value='center'>{'Center'}</option>,
            <option key='right' value='right'>{'Right'}</option>
        ];

        // if we align right or center and select zeroPad, alignOnDecimals is meaningless and should be disabled
        return (
            <div className="ColumnFormatter Price" style={{backgroundColor:'pink'}}>

                <div className='field'>
                    <label>Decimals: <input type='text' name='decimals' value={decimals} onChange={this.changeNumberOfDecimals}/></label>
                </div>
                <div className='field' onChange={this.changeFormatting}>
                    <label>Zero Pad: <input type='checkbox' name='zeroPad' checked={zeroPad} onChange={this.changeFormatting}/></label>
                </div>
                <div className='field' onChange={this.changeFormatting}>
                    <label>Align: <select name='align' options={alignOptions} value={align} onChange={this.changeAlign}>
                        {alignOptions}
                    </select>
                    </label>
                </div>
                <div className='field' onChange={this.changeFormatting}>
                    <label>Align on decimals: <input type='checkbox' name='alignOnDecimals' checked={alignOnDecimals} onChange={this.changeFormatting}/></label>
                </div>            
        
            </div>
        );
    }

    changeAlign = ({value}) => {
        const {formatting={}} = this.props;
        this.props.onRuleChange('formatting', {...formatting, align: value});
    }

    changeNumberOfDecimals = ({target}) => {
        const value = target.value;
        const {formatting={}} = this.props;
        const number = parseInt(value);
        if (isNaN(number)){
            this.props.onRuleChange('formatting', {...formatting, [target.name]: undefined});
        }
        else {
            this.props.onRuleChange('formatting', {...formatting, [target.name]: number});
        }
    }

    changeFormatting = ({target}) => {
        const {formatting={}} = this.props;
        const value = 
            target.type === 'checkbox' ? target.checked 
            : target.name === 'decimals' 
                ? parseInt(target.value)
                : target.value;        
        this.props.onRuleChange('formatting', {...formatting, [target.name]: value});
    };
    
} 