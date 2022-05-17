import React, { Component } from 'react';
import { Modal, Icon } from 'antd';
import Frame from 'react-frame-component';
import './style.less';

class DevErrorModal extends Component {
  state = {
    visible: true,
    html: null
  };

  async componentDidUpdate() {
    let { error } = this.props;
    if (!error || !error.response) return null;
    let data = error.response.data
    if (data instanceof Blob) {
      data = await error.response.data.text()
    }
    this.setState({
      html: data
    });
  }

  render() {
    let { visible, html } = this.state;
    let { error } = this.props;
    if (!html) return null;
    return (
      <Modal className='DevErrorModal'
        title={<span className='title'><Icon type="close-circle" />{`Code ${error.response.status}: ${error.response.statusText}`}</span>}
        width='95vw'
        height='95vh'
        visible={error && visible}
        okText={'忽略'}
        cancelButtonProps={{ style: { display: 'none' } }}
        onCancel={() => this.setState({ visible: false })}
        onOk={() => this.setState({ visible: false })}
      >
        {
          <Frame initialContent={html} />
        }
      </Modal>
    );
  }
}

export default DevErrorModal;
