import React from 'react';
import cx from 'classnames';
import TokenList, { TokenType, } from '../../parsing/token-list';

import './token-mirror.css';
const styles = {
  tokenMirror: 'token-mirror',
  invalid: 'invalid'
}

const EmptyTokenList = new TokenList();
const WhitespaceToken = ({ token }) => (
  <span className={'whitespace-wrapper'}>
    <span key="ws" className='whitespace'>
      {token.text}
    </span>
  </span>
)

const TextToken = ({ idx, isComplete, token, className }) => {
  const wrapperClassName = `token-wrapper${isComplete ? ' complete' : ''}`;
  return (
    <div className={wrapperClassName} data-idx={idx}>
      <div
        key='token'
        className={cx('token', className, {
          [styles.invalid]: token.invalid === true
        })}
      >
        {token.text}
      </div>
    </div >
  );
};

export class TokenMirror extends React.Component {

  constructor(props){
    super(props);
    this.el = React.createRef();
    this.containerWidth = props.width;
    this.currentWidth = undefined;
  }

  componentDidMount() {
    if (this.el.current){
      const {width} = this.el.current.getBoundingClientRect();
      // TODO also need to detect further resize
      this.props.onContainerResize(width);
    }
  }

  componentWillReceiveProps(nextProps){
    if (nextProps.width !== this.props.width){
      this.containerWidth = nextProps.width;
    }
  }

  componentDidUpdate(){
    if (this.el.current){
      const count = this.props.tokenList.tokens.length;
      let width;
      if (count > 0){
        const lastChild = this.el.current.querySelector(`:nth-child(${count})`)      
        const {offsetLeft, offsetWidth} = lastChild;
        width = offsetLeft + offsetWidth;
  
      } else {
        ({width} = this.el.current.getBoundingClientRect());
      }
      const currentWidth = Math.ceil(width);
      if (currentWidth > this.containerWidth){
        if (currentWidth !== this.currentWidth){
          this.currentWidth = currentWidth;
          this.props.onContentResize(currentWidth);
        }
      } else if (this.currentWidth){
        this.currentWidth = undefined;
        this.props.onContentResize(undefined);
      }
    }
  }

  render() {
    const { tokenList = EmptyTokenList } = this.props;
    const tokens = tokenList ? tokenList.tokens : [];
    let tokenCount = 0;
    const childTokens = tokens.map((token, idx, terms) => {
      let result;
      if (token.type === TokenType.Text) {
        const tokenDescriptor = tokenList.descriptors[tokenCount];
        // an unrecognised token indicates that user has entered a complete command, but kept typing
        const beyondRequiredTokens = tokenDescriptor === undefined;
        const isComplete = idx < terms.length - 1 || beyondRequiredTokens;
        console.log(`${token.text} isComplete ${isComplete} invalid ${token.invalid}`)
        const className = tokenDescriptor ? tokenDescriptor.tokenStyle : undefined;
        result = (
          <TextToken
            key={`term-${idx}`}
            token={token}
            className={className}
            idx={idx}
            isComplete={isComplete}
          />
        );
        tokenCount += 1;
      } else {
        result = <WhitespaceToken token={token} key={'ws=' + idx} />;
      }
      return result;
    });
    return <div ref={this.el} className={styles.tokenMirror}>{childTokens}</div>;
  }

}
