import React from 'react';
import PropTypes from 'prop-types';
class Dragable extends React.Component {
  static propTypes = {
    children: PropTypes.element.isRequired
  };

  static defaultProps = {
    updateTransform: (transformStr, drableRef) => {
      drableRef.style.transform = transformStr;
    }
  };

  position = {
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0,
  };

  start = event => {
    if (event.button !== 0) {
      return;
    }
    document.addEventListener('mousemove', this.docMove);
    this.position.startX = event.pageX - this.position.dx;
    this.position.startY = event.pageY - this.position.dy;
  };

  docMove = event => {
    const tx = event.pageX - this.position.startX;
    const ty = event.pageY - this.position.startY;
    const transformStr = `translate(${tx}px,${ty}px)`;
    this.props.updateTransform(transformStr, this.drableRef);
    this.position.dx = tx;
    this.position.dy = ty;
  };

  docMouseUp = event => {
    document.removeEventListener('mousemove', this.docMove);
  };

  componentDidMount() {
    this.drableRef.addEventListener('mousedown', this.start);
    document.addEventListener('mouseup', this.docMouseUp);
  }

  componentWillUnmount() {
    // this.props.updateTransform('translate(0,0)', 0, 0, this.drableRef);
    this.drableRef.removeEventListener('mousedown', this.start);
    document.removeEventListener('mouseup', this.docMouseUp);
    document.removeEventListener('mousemove', this.docMove);
  }

  render() {
    const { children } = this.props;
    const newStyle = { ...children.props.style, cursor: 'move', userSelect: 'none' };
    return React.cloneElement(React.Children.only(children), {
      ref: ref => {
        return (this.drableRef = ref);
      },
      style: newStyle
    });
  }
}

class DragTitle extends React.Component {
  updateTransform = transformStr => {
    if (this.modalDom) {
      this.modalDom.style.transform = transformStr;
    }
  };
  componentDidMount() {
    this.modalDom = document.getElementsByClassName(
      'ant-modal-content'
    )[0];
  }
  render() {
    return (
      <Dragable updateTransform={this.updateTransform}>
        {this.props.children}
      </Dragable>
    );
  }
}

export default Dragable;
export { DragTitle };
