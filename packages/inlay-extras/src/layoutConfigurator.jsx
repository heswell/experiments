import React from 'react'
import {normalizeLayoutStyles} from '@heswell/inlay'
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
