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

  constructor(props) {
    super(props);
    this.el = React.createRef();
    this.currentWidth = -1;
    this.tokenPositions = [];
  }

  componentDidUpdate(prevProps) {
    const { tokenList } = this.props;
    if (this.el.current && prevProps.tokenList !== tokenList) {
      const count = tokenList.tokens.length;
      let width;
      if (count > 0) {
        // const lastChild = this.el.current.querySelector(`:nth-child(${count})`)
        // const { offsetLeft, offsetWidth } = lastChild;
        // width = offsetLeft + offsetWidth;
         ({scrollWidth: width} = this.el.current);
        // console.log(`TokenMirror componentDidUpdate offsetLeft=${offsetLeft} offsetWidth=${offsetWidth} === ${offsetLeft + offsetWidth}`)
        this.tokenPositions = this.measureTerms();
      } else {
        ({ width } = this.el.current.getBoundingClientRect());
      }
      const newWidth = Math.ceil(width);
      if (newWidth !== this.currentWidth) {
        this.currentWidth = newWidth;
        this.props.onContentResize(newWidth);
      }
    }
  }

  getPositionOfTokenAtOffset(offset) {
    const token = this.props.tokenList.getTokenAtOffset(offset)
    if (token && token.idx !== undefined) {
      return this.tokenPositions[token.idx]
    }
  }

  measureTerms() {
    // lets try reading boxshadow/clipText from the dom and see if it's quick enough
    // also, what about :before/:after ?
    if (this.el.current) {
      const { left: offsetLeft } = this.el.current.getBoundingClientRect();
      const termWrappers = Array.from(this.el.current.querySelectorAll('.token-wrapper[data-idx]'));
      return termWrappers.map(termWrapper => {
        // const term = termWrapper.querySelector('.term');
        const term = termWrapper;
        const { left, top, right, bottom } = term.getBoundingClientRect();
        // const runtimeStyle = window.getComputedStyle(term, null);
        // const boxShadow = runtimeStyle.getPropertyValue(`box-shadow`);
        // const clipPath = runtimeStyle.getPropertyValue(`clip-path`);
        // const [ofTop, ofRight, ofBottom, ofLeft] = calculateOverflow(boxShadow, clipPath);
        const [ofTop, ofRight, ofBottom, ofLeft] = [0, 0, 0, 0];
        const absLeft = Math.round(left) - ofLeft;
        return {
          offsetLeft: absLeft - Math.round(offsetLeft),
          left: absLeft,
          top: Math.round(top) - ofTop,
          right: Math.round(right) + ofRight,
          bottom: Math.round(bottom) + ofBottom,
          idx: parseInt(termWrapper.dataset.idx, 10)
        }
      });

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
        // console.log(`${token.text} isComplete ${isComplete} invalid ${token.invalid}`)
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
