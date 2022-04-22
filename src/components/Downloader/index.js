/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { createRef, Component } from 'react';

class Downloader extends Component {
  constructor(props) {
    super(props);
    this.linkRef = createRef();
  }

  handleAction = async () => {
    let { fileName, download } = this.props;
    let a = this.linkRef.current;
    if (a.href) return;
    const blob = await download();
    const href = window.URL.createObjectURL(blob);
    a.download = fileName;
    a.href = href;
    a.click();
  }

  render() {
    return (
      <a role='button' ref={this.linkRef} onClick={this.handleAction} >
        {this.props.children}
      </a>
    )
  }
}

export default Downloader;
