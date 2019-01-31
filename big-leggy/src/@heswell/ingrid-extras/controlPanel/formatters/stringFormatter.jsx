import React from 'react';
/*
    must support features like 
    
    capitalisation - purely a display characteristic
    length - both display (can drive col width) and validation

*/

const capitalise = 'capitalise';
const upperCase = 'uppercase';
const lowerCase = 'lowercase';

export default class StringFormatter extends React.Component {
    render(){
        const {formatting={}, validation={}} = this.props;
        const {capitalisation='none'} = formatting; 
        const isCapitalised = capitalisation === capitalise;
        const isUppercase = capitalisation === upperCase;
        const isLowercase = capitalisation === lowerCase;


        return (
            <div className="ColumnFormatter Number" style={{backgroundColor:'red'}}>

                <div className="formatting-rules">

                    <div className="field" onChange={this.changeFormatting}>
                        <label>Capitalise: <input type='radio' name='capitalisation' value='capitalise' checked={isCapitalised}/></label>
                        <label>Lowercase: <input type='radio' name='capitalisation' value='lowercase' checked={isLowercase}/></label>
                        <label>Uppercase: <input type='radio' name='capitalisation' value='uppercase' checked={isUppercase}/></label>
                    </div>                    

                </div>
            
            </div>
        );
    }

    changeFormatting = ({target}) => {
        const {formatting={}} = this.props;
        this.props.onRuleChange('formatting', {...formatting, [target.name]: target.value});
    };
} 