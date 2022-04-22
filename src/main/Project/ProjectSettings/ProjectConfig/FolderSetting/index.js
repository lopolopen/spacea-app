/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Divider, Table, Form, Tooltip, Icon, Dropdown, Menu, message, Avatar } from 'antd';
import utility from '../../../../../utility'
import NewFolderForm from '../../TeamConfig/NewFolderForm';
import './style.less';

const WrappedNewFolderForm = Form.create({ name: 'new_folder_form' })(NewFolderForm);
let lastFolderId;

@inject('appStore')
@observer
class FolderSetting extends Component {

  state = {
    folder: null,
    visible: false,
    confirmLoading: false,
    selectedRowKey: '',
    isEditing: false,
    isDeleting: false
  }

  handleNewFolderFormOk = (folder, isEditing, isDeleting) => {
    let { projectConfigStore } = this.props.appStore;
    let { form } = this.newFolderFormRef.props;
    form.validateFields(async (err, { name, locationId }) => {
      try {
        if (err) return;
        this.setState({
          confirmLoading: true
        });
        let { parent } = folder;
        if (isEditing) {
          await projectConfigStore.updateFolder(folder.id, {
            name,
            path: `${parent.path || ''}/${name}`
          }, folder);
        } else if (isDeleting) {
          await projectConfigStore.removeFolderWithSubs(folder, locationId);
        } else {
          await projectConfigStore.createFolder({
            name,
            path: `${parent.path || ''}/${name}`
          });
        }
        message.success(`文件夹${isEditing ? '更新' : isDeleting ? '删除' : '创建'}成功`);
        this.handleNewFolderFormCancel();
        form.resetFields();
        this.forceUpdate();
      } catch (error) {
        this.setState({
          confirmLoading: false
        });
        throw error;
      }
    });
  }

  handleNewFolderFormCancel = () => {
    this.setState({
      visible: false,
      confirmLoading: false
    });
  }

  showNewFolderModal = (folder, isEditing = false, isDeleting = false) => {
    let { form } = this.newFolderFormRef.props;
    let selectedId = folder && folder.id;
    if (lastFolderId !== selectedId) {
      form.resetFields();
      lastFolderId = selectedId;
    }
    this.setState({
      visible: true,
      folder,
      isEditing,
      isDeleting
    })
  }

  render() {
    // const { getFieldDecorator, getFieldValue, setFieldsValue } = this.props.form;
    let {
      project: {
        rootFolderId,
        folders,
        folderTree,
        teams
      }
    } = this.props.appStore;

    let rootFolder = folders.find(f => f.id === rootFolderId);

    let {
      folder,
      visible,
      confirmLoading,
      selectedRowKey,
      isEditing,
      isDeleting
    } = this.state;

    this.folderColumns = [{
      title: (
        <span>
          文件夹
          <Divider type='vertical' style={{ margin: '0 16px' }} />
          <a onClick={() => this.showNewFolderModal({ parent: rootFolder })}>
            <Icon type='plus' style={{ color: 'green', marginRight: 6 }} />
            <span>新建</span>
          </a>
        </span>
      ),
      dataIndex: 'name'
    },
    {
      title: '',
      render: (record) => {
        return (
          <span className='btns-operation'>
            <Tooltip title='操作'>
              <Dropdown trigger={['click']} overlay={
                <Menu>
                  <Menu.Item key='createChild'
                    onClick={() => this.showNewFolderModal({ parent: record })} >
                    <span>
                      <Icon type='plus-circle' style={{ color: '#1890ff' }} />
                      <span>新建子级</span>
                    </span>
                  </Menu.Item>
                  <Menu.Item key='edit'
                    onClick={() => this.showNewFolderModal(record, true)}>
                    <span>
                      <Icon type='edit' style={{ color: '#1890ff' }} />
                      <span>编辑</span>
                    </span>
                  </Menu.Item>
                  <Menu.Item key='delete'
                    onClick={() => this.showNewFolderModal(record, false, true)}
                    disabled={record.id === rootFolderId}>
                    <span>
                      <Icon type='close' style={{ color: 'red' }} />
                      <span>删除</span>
                    </span>
                  </Menu.Item>
                </Menu >
              }>
                <a><Icon type='ellipsis' /></a>
              </Dropdown >
            </Tooltip>
          </span >
        );
      }
    }, {
      title: '团队',
      render: ({ id }) => {
        return (teams || []).filter(t => t.folders && t.folders.some(f => f.id === id))
          .map(({ id, name, acronym }) => {
            let color = utility.hashColor(name);
            return (
              <Avatar size='small' key={id} style={{ backgroundColor: color, marginRight: 4 }}>
                {(acronym || name.charAt(0)).toUpperCase()}
              </Avatar>
            );
          })
      }
    }, {
      title: '',
      width: '40%'
    }];

    return (
      <div className='FolderSetting'>
        <div style={{ marginTop: 12 }}>
          <div className='label'>项目文件夹管理</div>
          <div className='table-wrapper'>
            <Table rowKey='id'
              columns={this.folderColumns}
              size={'small'}
              defaultExpandAllRows
              pagination={false}
              dataSource={folderTree.children}
              rowClassName={record => selectedRowKey === record.id ? 'ant-table-row-selected' : ''}
              onRow={(record) => ({
                onClick: () => {
                  this.setState({
                    selectedRowKey: record.id
                  });
                }
              })}
            />
          </div>
        </div>
        <WrappedNewFolderForm
          wrappedComponentRef={(ref) => this.newFolderFormRef = ref}
          folder={folder}
          folderTree={folderTree}
          visible={visible}
          confirmLoading={confirmLoading}
          isEditing={isEditing}
          isDeleting={isDeleting}
          onOk={(folder, e, d) => this.handleNewFolderFormOk(folder, e, d)}
          onCancel={this.handleNewFolderFormCancel}
        />
      </div>
    );
  }
}

export default FolderSetting;
