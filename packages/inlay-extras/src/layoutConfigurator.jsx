import React from 'react'
import './layoutConfigurator.css'

const DIMENSIONS = {
    margin: {
        top: 'marginTop',
        right: 'marginRight',
        bottom: 'marginBottom',
        left: 'marginLeft'
    },
    border: {
        top: 'borderTopWidth',
        right: 'borderRightWidth',
        bottom: 'borderBottomWidth',
        left: 'borderLeftWidth'
    },
    padding: {
        top: 'paddingTop',
        right: 'paddingRight',
        bottom: 'paddingBottom',
        left: 'paddingLeft'
    }
}

const LayoutBox = ({feature, children, style, onChange}) => {
    return (
        <div className={`LayoutBox layout-${feature} layout-outer`}>
            <div className={`layout-top`}>
                <span className='layout-title'>{feature}</span>
                <input className='layout-input'
                    value={style.top}
                    onChange={e => onChange(feature,'top', parseInt(e.target.value,10))}/>
            </div>
            <div className={`layout-inner`}>
                <div className={`layout-left`}>
                    <input className='layout-input'
                        value={style.left}
                        onChange={e => onChange(feature,'left', e.target.value)}/>
                </div>
                {children}
                <div className={`layout-right`}>
                    <input className='layout-input'
                        value={style.right}
                        onChange={e => onChange(feature,'right', e.target.value)}/>
                </div>
            </div>
            <div className={`layout-bottom`}>
                <input className='layout-input'
                    value={style.bottom}
                    onChange={e => onChange(feature,'bottom', e.target.value)}/>
            </div>
        </div>
    )
}

// BORDER_STYLES diplicated in inlay/layoutUtils
export const BORDER_STYLES = {
    border: true,
    borderWidth: true,
    borderTopWidth: true,
    borderRightWidth: true,
    borderBottomWidth: true,
    borderLeftWidth: true
}

const CSS_DIGIT = '(\\d+)(?:px)?';
const CSS_MEASURE = `^(?:${CSS_DIGIT}(?:\\s${CSS_DIGIT}(?:\\s${CSS_DIGIT}(?:\\s${CSS_DIGIT})?)?)?)$`
const CSS_REX = new RegExp(CSS_MEASURE)
const BORDER_REX = /^(?:(\d+)(?:px)\ssolid\s([a-zA-Z,0-9().]+))$/;
const BORDER_LIST = Object.keys(BORDER_STYLES);

export default class LayoutConfigurator extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            layoutStyle: normalizeLayoutStyles(props.layoutStyle)
        };
        this.handleChange = this.handleChange.bind(this);
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.layoutStyle !== this.props.layoutStyle){
            this.setState({
                layoutStyle: normalizeLayoutStyles(nextProps.layoutStyle)
            });
        }
    }

    handleChange(feature, dimension, strValue){
        const value = parseInt(strValue || '0',10);
        const {layoutStyle} = this.state;
        const property = DIMENSIONS[feature][dimension];
        this.setState({
            layoutStyle: {
                ...layoutStyle,
                [property]: value
            }
        }, () => {
            this.props.onChange(feature, dimension, value, this.state.layoutStyle)
        });
    }

    render(){
        const {width, height, style} = this.props
        const {marginTop: mt=0, marginRight: mr=0, marginBottom: mb=0, marginLeft: ml=0} = this.state.layoutStyle;
        const {borderTopWidth: bt=0, borderRightWidth: br=0, borderBottomWidth: bb=0, borderLeftWidth: bl=0} = this.state.layoutStyle;
        const {paddingTop: pt=0, paddingRight: pr=0, paddingBottom: pb=0, paddingLeft: pl=0} = this.state.layoutStyle;
        return (
            <div className='LayoutConfigurator' style={{width, height, ...style}}>
                <LayoutBox feature='margin' style={{top: mt, right: mr, bottom: mb, left: ml}} onChange={this.handleChange}>
                    <LayoutBox feature='border' style={{top: bt, right: br, bottom: bb, left: bl}} onChange={this.handleChange}>
                        <LayoutBox feature='padding' style={{top: pt, right: pr, bottom: pb, left: pl}} onChange={this.handleChange}>
                            <div className='layout-content' />
                        </LayoutBox>
                    </LayoutBox>
                </LayoutBox>
            </div>
        )
    }
}

// TODO merge the following two functions
export function normalizeLayoutStyles({margin, marginTop, marginRight, marginBottom, marginLeft,
    padding, paddingTop, paddingRight, paddingBottom, paddingLeft, ...style}=NO_STYLE){

    if (typeof margin === 'number'){
        style.marginTop = style.marginRight = style.marginBottom = style.marginLeft = margin;
    } else if (typeof margin === 'string'){
        const match = CSS_REX.exec(margin);
        if (match === null){
            console.error(`Invalid css value for margin '${margin}'`)
        } else {
            const [, pos1, pos2, pos3, pos4] = match;
            const pos123 = pos1 && pos2 && pos3
            if (pos123 && pos4){
                style.marginTop = parseInt(pos1,10);
                style.marginRight = parseInt(pos2,10);
                style.marginBottom = parseInt(pos3,10);
                style.marginLeft = parseInt(pos4,10);
            } else if (pos123){
                style.marginTop = parseInt(pos1,10);
                style.marginRight = style.marginLeft = parseInt(pos2,10);
                style.marginBottom = parseInt(pos3,10);
            } else if (pos1 && pos2){
                style.marginTop = style.marginBottom = parseInt(pos1,10);
                style.marginRight = style.marginLeft =parseInt(pos2,10);
            } else {
                style.marginTop = style.marginRight = style.marginBottom = style.marginLeft = parseInt(pos1,10);
            }
        }
    }
    if (typeof marginTop === 'number') style.marginTop = marginTop;
    if (typeof marginRight === 'number') style.marginRight = marginRight;
    if (typeof marginBottom === 'number') style.marginBottom = marginBottom;
    if (typeof marginLeft === 'number') style.marginLeft = marginLeft;

    if (typeof padding === 'number'){
        style.paddingTop = style.paddingRight = style.paddingBottom = style.paddingLeft = padding;
    } else if (typeof padding === 'string'){
        const match = CSS_REX.exec(padding);
        if (match === null){
            console.error(`Invalid css value for padding '${padding}'`)
        } else {
            const [, pos1, pos2, pos3, pos4] = match;
            const pos123 = pos1 && pos2 && pos3
            if (pos123 && pos4){
                style.paddingTop = parseInt(pos1,10);
                style.paddingRight = parseInt(pos2,10);
                style.paddingBottom = parseInt(pos3,10);
                style.paddingLeft = parseInt(pos4,10);
            } else if (pos123){
                style.paddingTop = parseInt(pos1,10);
                style.paddingRight = style.paddingLeft = parseInt(pos2,10);
                style.paddingBottom = parseInt(pos3,10);
            } else if (pos1 && pos2){
                style.paddingTop = style.paddingBottom = parseInt(pos1,10);
                style.paddingRight = style.paddingLeft =parseInt(pos2,10);
            } else {
                style.paddingTop = style.paddingRight = style.paddingBottom = style.paddinggLeft = parseInt(pos1,10);
            }
        }
    }
    if (typeof paddingTop === 'number') style.paddingTop = paddingTop;
    if (typeof paddingRight === 'number') style.paddingRight = paddingRight;
    if (typeof paddingBottom === 'number') style.paddingBottom = paddingBottom;
    if (typeof paddingLeft === 'number') style.paddingLeft = paddingLeft;

    return normalizeBorderStyle(style);
}

function normalizeBorderStyle(style=NO_STYLE){

    if (BORDER_LIST.some(bs => style[bs])){
        let match;

        let {border, borderWidth, borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth, borderColor, ...rest} = style;

        if (border || borderWidth || borderTopWidth || borderRightWidth || borderBottomWidth || borderLeftWidth){
            if (typeof border === 'string' && (match = BORDER_REX.exec(border))){
                // what if both border and borderWidth are specified ?
                ([,borderWidth,borderColor] = match);
                borderWidth = parseInt(borderWidth,10);                
            }

            if (borderWidth){
                borderTopWidth = borderTopWidth === undefined ? borderWidth : borderTopWidth;
                borderRightWidth = borderRightWidth === undefined ? borderWidth : borderRightWidth;
                borderBottomWidth = borderBottomWidth === undefined ? borderWidth : borderBottomWidth;
                borderLeftWidth = borderLeftWidth === undefined ? borderWidth : borderLeftWidth;
            }

            borderColor = borderColor || 'black';
            const boxShadow = `
                ${borderColor} ${borderLeftWidth || 0}px ${borderTopWidth || 0}px 0 0 inset, 
                ${borderColor} ${-borderRightWidth || 0}px ${-borderBottomWidth || 0}px 0 0 inset`;

            return {
                ...rest,
                boxShadow,
                borderColor,
                borderStyle: 'solid',
                borderTopWidth,
                borderRightWidth,
                borderBottomWidth,
                borderLeftWidth
            }

        } else {
            return style
        }
    } else {
        return style;
    }
}
