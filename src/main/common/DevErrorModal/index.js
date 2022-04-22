import React, { Component } from 'react';
import { Modal, Icon } from 'antd';
import Frame from 'react-frame-component';
import './style.less';

class DevErrorModal extends Component {
  state = {
    visible: true
  };

  render() {
    let { visible } = this.state;
    let { error } = this.props;
    if (!error || !error.response) return null;
    return (
      <Modal className='DevErrorModal'
        title={<span className='title'><Icon type="close-circle" />{'Error 500'}</span>}
        width='95vw'
        height='95vh'
        visible={error && visible}
        okText={'忽略'}
        cancelButtonProps={{ style: { display: 'none' } }}
        onCancel={() => this.setState({ visible: false })}
        onOk={() => this.setState({ visible: false })}
      >
        {
          <Frame initialContent={error.response.data} />
        }
      </Modal>
    );
  }
}

export default DevErrorModal;
