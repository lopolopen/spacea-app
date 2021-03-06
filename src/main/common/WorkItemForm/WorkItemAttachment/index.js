/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { Table, Divider, Icon, Upload, Tooltip, Dropdown, Menu, Button } from 'antd';
import moment from 'moment';
import update from 'immutability-helper';
import utility from '../../../../utility';
import Downloader from '../../../../components/Downloader';
import FileIcon from '../../../../components/FileIcon';
import MemberAvatar from '../../../../components/MemberAvatar';
import AttachmentClient from '../../../../services/api/AttachmentClient';
import AttachmentState from '../../../../stores/AttachmentState';
import FilePreview from './FilePreview';
import 'react-photo-view/dist/react-photo-view.css';
import './style.less';

const imgExtSet = new Set(["jpg", "jpeg", "png", "bmp", "gif", "svg"]);

class WorkItemAttachment extends Component {
  upload = async ({ file }) => {
    let { value: value1, onChange } = this.props;
    let atta = {
      id: file.uid,
      fileName: file.name,
      state: AttachmentState.adding
    };
    onChange([...(value1 || []), atta]);
    let attachment = await AttachmentClient.upload(file);
    let { value: value2 } = this.props;
    let index = value2.findIndex(a => a.id === file.uid);
    onChange(update(value2, {
      [index]: {
        id: { $set: attachment.id },
        size: { $set: attachment.size },
        uploadedTime: { $set: attachment.uploadedTime },
        creator: { $set: attachment.creator },
        state: { $set: AttachmentState.toadd }
      }
    }));
  }

  delete = (attachment) => {
    let { value, onChange } = this.props;
    //之前增加的附件state为undefined(AttachmentState.added)
    if (attachment.state === AttachmentState.added) {
      let index = value.findIndex(a => a.id === attachment.id);
      onChange(update(value, {
        [index]: {
          state: { $set: AttachmentState.todel }
        }
      }));
    } else {
      let newvalue = (value || []).filter(a => a.id !== attachment.id);
      onChange(newvalue);
    }
  }

  imagePreview = async (attachment) => {
    let { id, fileName, previewUrl, ref } = attachment;
    if (previewUrl) return;
    let url = await AttachmentClient.preview(id, fileName);
    await utility.delay(500);
    attachment.previewUrl = url;
    ref && ref.forceUpdate();
  }

  render() {
    let { value } = this.props;
    let attachments = (value || []).filter(a =>
      a.state !== AttachmentState.todel &&
      a.state !== AttachmentState.deleted);
    attachments.sort((x, y) => {
      return new Date(x.uploadedTime) - new Date(y.uploadedTime);
    });
    const columns = [
      {
        title: (
          <span>
            附件
            <Divider type='vertical' style={{ margin: '0 16px' }} />
            <Upload
              showUploadList={false}
              customRequest={this.upload}
            >
              <a className='attachment-btn'>
                <Icon type='plus' style={{ color: 'green', marginRight: 6 }} />
                <span>新增</span>
              </a>
            </Upload>
          </span>
        ),
        dataIndex: 'fileName',
        render: (fileName, { state }) => {
          return (
            <span>
              <span style={{ marginRight: 4 }} >
                {
                  state === AttachmentState.adding ?
                    <Icon type='loading' />
                    :
                    <FileIcon fileName={fileName} />
                }
              </span>
              <span>{fileName}</span>
            </span>
          );
        }
      },
      {
        title: '',
        render: (record) => {
          let isImg = imgExtSet.has(record.fileName.split('.').pop());
          return (
            record.state === AttachmentState.adding ? null :
              <span className='btns-operation'>
                <Tooltip title='更多'>
                  <Dropdown trigger={['click']} overlay={
                    <Menu>
                      <Menu.Item key='preview'
                        disabled={!isImg}
                        onClick={() => this.imagePreview(record)} >
                        <FilePreview file={record} ref={ref => record.ref = ref} >
                          <Icon type='eye' style={{ color: '#1890ff' }} />
                          <span>预览</span>
                        </FilePreview>
                      </Menu.Item>
                      <Menu.Item key='download' >
                        <span className='attachment-menu-item-fix'>
                          <Downloader
                            fileName={record.fileName}
                            download={() => AttachmentClient.download(record.id, record.fileName)}
                          >
                            <Icon type='download' style={{ color: '#1890ff' }} />
                            <span>下载</span>
                          </Downloader>
                        </span>
                      </Menu.Item>
                      <Menu.Item key='delete'
                        className='attachment-menu-item'
                        onClick={() => this.delete(record)}>
                        <Icon type='close' style={{ color: 'red' }} />
                        <span>删除</span>
                      </Menu.Item>
                    </Menu >
                  }>
                    <a><Icon type='ellipsis' /></a>
                  </Dropdown >
                </Tooltip>
              </span>
          )
        }
      },
      {
        title: '大小',
        dataIndex: 'size',
        render: size => {
          if (!size) return null;
          if (size < 102) return `${size} B`;
          size = size / 1024;
          if (size < 102) return `${size.toFixed(1)} K`;
          size = size / 1024;
          if (size < 102) return `${size.toFixed(1)} M`;
          size = size / 1024;
          return `${size.toFixed(1)} G`;
        }
      },
      {
        title: '上传时间',
        dataIndex: 'uploadedTime',
        render: time => time && moment(time).format('YYYY-MM-DD HH:mm')
      },
      {
        title: '上传人',
        dataIndex: 'creator',
        render: creator => creator && <MemberAvatar member={creator} size='small' labeled />
      },
      {
        title: '',
        width: '30%'
      }
    ];
    return (
      <div className='WorkItemAttachment'>
        {
          !value || value.length === 0 ?
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: 96
            }}
            >
              <Icon type='paper-clip' style={{ fontSize: 96, transform: 'rotate(135deg)' }} />
              <span style={{ fontSize: 20 }}>还没有添加任何附件</span>
              <Upload
                showUploadList={false}
                customRequest={this.upload}
              >
                <Button type='primary' style={{ marginTop: 16 }}>
                  <Icon type='plus' />
                  新增附件
                </Button>
              </Upload>
            </div>
            :
            <div>
              <Table rowKey='id'
                size={'small'}
                pagination={false}
                columns={columns}
                dataSource={attachments}
              />
            </div >
        }
      </div >
    );
  }
}

export default WorkItemAttachment;
