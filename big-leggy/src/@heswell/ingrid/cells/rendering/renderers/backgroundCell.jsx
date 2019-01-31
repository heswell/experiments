import React from 'react';
import {renderCellContent} from '../../formatting/cellValueFormatter';
import Cell from '../../../core/cell';
import './backgroundCell.css';
import {Data} from '../../../../data';

const CHAR_ARROW_UP = String.fromCharCode(11014);
const CHAR_ARROW_DOWN = String.fromCharCode(11015);

// TODO these sre repeated from PriceFormatter - where shoud they live ?
const FlashStyle = {
    ArrowOnly : 'arrow',
    BackgroundOnly: 'bg-only',
    ArrowBackground: 'arrow-bg'
};

export default class BackgroundCell extends Cell {

    constructor(props){
        super(props);
        this.state = {
            direction : ''
        };
    }

    render(){

        const props = this.props;
        const {column: {width, type: {renderer:{flashStyle}}}} = props;
        const {direction} = this.state;
        
        const arrow = flashStyle === FlashStyle.ArrowOnly || flashStyle === FlashStyle.ArrowBackground
            ? direction === 'up1' || direction === 'up2' ? CHAR_ARROW_UP : 
              direction === 'down1' || direction === 'down2' ? CHAR_ARROW_DOWN : null
            : null; 

        const dirClass = direction ? ` ` + direction : ''; 
        const arrowClass = flashStyle === FlashStyle.ArrowOnly ? ' arrow-only' :
                           flashStyle === FlashStyle.ArrowBackground ? ' arrow' : ''; 

        return (
            <div className={`${this.getClassName(props)}${dirClass}${arrowClass}`} style={{width}}>
                <div className='flasher'>{arrow}</div>
                {renderCellContent(props)}
            </div>
        );
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.column !== this.props.column || nextProps.row[Data.KEY_FIELD] !== this.props.row[Data.KEY_FIELD]){
            this.setState({direction:''});
        } else if (nextProps.value !== this.props.value ){

            if (!Number.isFinite(nextProps.value)){
                this.setState({direction:''});
            } else {
                const direction = this.state.direction;
                let diff = nextProps.value - this.props.value;
                if (diff){
                    // make sure there is still a diff when reduced to number of decimals to be displayed
                    const {type:dataType} = nextProps.column;
                    let decimals = dataType && dataType.formatting && dataType.formatting.decimals;
                    if (typeof decimals === 'number') {
                        diff = +nextProps.value.toFixed(decimals) - +this.props.value.toFixed(decimals);
                    }
                }

                if (diff){
                    if (direction === ''){
                        if (diff < 0){
                            this.setState({direction:'down1'});
                        } else {
                            this.setState({direction:'up1'});
                        }
                    } else if (diff > 0){
                        if (direction === 'down1' || direction === 'down2' || direction === 'up2'){
                            this.setState({direction: 'up1'});
                        } else {
                            this.setState({direction: 'up2'});
                        }
                    } else if (direction === 'up1' || direction === 'up2' || direction === 'down2'){
                        this.setState({direction: 'down1'});
                    } else {
                        this.setState({direction: 'down2'});
                    }
                }
            }

        }
    }

}

