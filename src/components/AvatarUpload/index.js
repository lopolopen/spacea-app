/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Upload, message, Badge, Icon, Tooltip } from 'antd';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

class AvatarUpload extends Component {
  add = ({ file }) => {
    let { onChange } = this.props;
    getBase64(file, url => onChange({
      url,
      uid: uuidv4().replaceAll('-', ''),
      file
    }));
  }

  remove = (e) => {
    e.stopPropagation()
    let { onChange } = this.props;
    onChange({
      url: null,
      uid: null
    });
  }

  varify(file) {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('请上传JPG/PNG格式图片');
    }
    const isLt200K = file.size / 1024 <= 200;
    if (!isLt200K) {
      message.error('上传图片不能超过200K');
    }
    return isJpgOrPng && isLt200K;
  }


  render() {
    let { value: avatar, children } = this.props;
    let { props: childProps } = children;
    let { uid } = avatar;
    return (
      <Badge count={
        <Tooltip title='移除头像'>
          <Icon type='close-circle' theme='filled' onClick={this.remove}
            style={{
              fontSize: 24,
              display: uid ? undefined : 'none'
            }}
          />
        </Tooltip>
      }>
        <Tooltip title='编辑头像，上传图片不能超过200K' placement='bottom'>
          <a style={{ display: 'block' }}>
            <Upload
              showUploadList={false}
              customRequest={this.add}
              beforeUpload={this.varify}
            >
              {
                React.cloneElement(children, {
                  member: childProps.member && { ...childProps.member, avatar },
                  project: childProps.project && { ...childProps.project, avatar },
                })
              }
            </Upload>
          </a>
        </Tooltip>
      </Badge>
    );
  }
}

export default AvatarUpload;
