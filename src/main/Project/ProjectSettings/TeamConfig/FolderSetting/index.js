/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Row, Col, Divider, TreeSelect, Table, Form, Tooltip, Icon, Dropdown, Menu, Badge, message, Tag, Button } from 'antd';
import classNames from 'classnames';
import NewFolderForm from '../NewFolderForm';
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
    selectedRowKey: ''
  }

  handleNewFolderFormOk = (folder) => {
    let { teamConfigStore } = this.props.appStore;
    let { form } = this.newFolderFormRef.props;
    form.validateFields(async (err, { name }) => {
      try {
        if (err) return;
        this.setState({
          confirmLoading: true
        });
        let { parent } = folder;
        if (!folder.id) {
          await teamConfigStore.createFolderForCurrentTeam({
            name,
            path: `${parent.path || ''}/${name}`
          }, parent);
          this.forceUpdate();
          message.success(`文件夹创建成功，并被当前团队选择`);
        } else {
          await teamConfigStore.updateFolder(folder.id, {
            name,
            path: `${parent.path || ''}/${name}`
          }, folder);
          this.forceUpdate();
          message.success(`文件夹更新成功`);
        }
        this.handleNewFolderFormCancel();
        form.resetFields();
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

  showNewFolderModal = (folder) => {
    let { form } = this.newFolderFormRef.props;
    let selectedId = folder && folder.id;
    if (lastFolderId !== selectedId) {
      form.resetFields();
      lastFolderId = selectedId;
    }
    this.setState({
      visible: true,
      folder
    })
  }

  handleOnSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields(async (_, { defId }) => {
      let { teamConfigStore } = this.props.appStore;
      teamConfigStore.selectDefFolderOfCurrentTeam(defId);
    });
  }

  render() {
    const { getFieldDecorator, getFieldValue, setFieldsValue } = this.props.form;
    let {
      project: {
        rootFolderId,
        folders,
        folderTree
      },
      teamConfigStore,
      teamConfigStore: {
        currentTeam
      }
    } = this.props.appStore;
    if (!currentTeam) return null;

    let selectedFolderIds = new Set((currentTeam.folders || []).map(f => f.id));
    let defFolderId = currentTeam.defaultFolder && currentTeam.defaultFolder.id;
    //表单内选中的id（可能尚未提交）
    let getDefId = () => getFieldValue('defId') || defFolderId;
    let rootFolder = folders.find(f => f.id === rootFolderId);


    let {
      folder,
      visible,
      confirmLoading,
      selectedRowKey
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
    }, {
      title: '',
      dataIndex: 'path',
      render: (path, record) => {
        let included = record.id === getDefId() || selectedFolderIds.has(record.id);
        return <Badge status={included ? 'success' : 'default'} text={path} />
      }
    }, {
      title: <div style={{ width: 60}} />,
      render: (record) => {
        let included = record.id === getDefId() || selectedFolderIds.has(record.id);
        return (
          <span className='btns-operation'>
            <span className={classNames(
              { 'to-excludes': included },
              { 'is-default': record.id === defFolderId }
            )}>
              {
                included ?
                  <Tooltip title='排除'>
                    <a disabled={record.id === defFolderId} onClick={async () => {
                      await teamConfigStore.deselectFolder(record);
                    }}>
                      <Icon type='close' />
                    </a>
                  </Tooltip>
                  :
                  <Tooltip title='选择'>
                    <a onClick={async () => {
                      await teamConfigStore.selectFolder(record);
                    }}>
                      <Icon type='check' />
                    </a>
                  </Tooltip>
              }
            </span>
            <span style={{ display: included ? '' : 'none' }}>
              <Divider type='vertical' />
              <Tooltip title='更多'>
                <Dropdown trigger={['click']} overlay={
                  <Menu>
                    <Menu.Item key='createChild'
                      onClick={() => this.showNewFolderModal({ parent: record })} >
                      <span>
                        <Icon type='plus-circle' style={{ color: '#1890ff' }} />
                        <span>新建子级</span>
                      </span>
                    </Menu.Item>
                    <Menu.Item key='edit' onClick={() => this.showNewFolderModal(record)}>
                      <span>
                        <Icon type='edit' style={{ color: '#1890ff' }} />
                        <span>编辑</span>
                      </span>
                    </Menu.Item>
                  </Menu >
                }>
                  <a><Icon type='ellipsis' /></a>
                </Dropdown >
              </Tooltip>
            </span>
          </span>
        );
      }
    },
    {
      title: <div style={{ width: 60 }} />,
      render: ({ id }) => {
        if (id === getDefId() || id === defFolderId) {
          return <Tag color={'#1890ff'}>{'默认'}</Tag>;
        }
      }
    },
    {
      title: '',
      width: '20%'
    }];

    return (
      <div className='FolderSetting'>
        <Form onSubmit={this.handleOnSubmit}>
          <Row>
            <Col span={8}>
              <div className='label'>默认文件夹</div>
              <div style={{ display: 'flex' }}>
                <div style={{ flexGrow: 1 }}>
                  <Form.Item>
                    {
                      getFieldDecorator('defId', {
                        initialValue: defFolderId
                      })(
                        <TreeSelect
                          style={{ width: '100%' }}
                          treeData={folderTree.children}
                          treeDefaultExpandAll
                          treeNodeLabelProp='path'
                        />
                      )
                    }
                  </Form.Item>
                </div>
                <Button style={{ marginLeft: 8, display: getDefId() === defFolderId ? 'none' : 'inline-block' }}
                  onClick={() => {
                    setFieldsValue({ defId: defFolderId })
                  }}
                >
                  取消
                </Button>
                <Button type='primary' htmlType='submit' disabled={getDefId() === defFolderId} style={{ marginLeft: 8 }}>
                  保存
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
        <div style={{ marginTop: 12 }}>
          <div className='label'>团队文件夹管理</div>
          <div className='table-wrapper'>
            <Table rowKey='id'
              columns={this.folderColumns}
              size={'small'}
              defaultExpandAllRows
              pagination={false}
              dataSource={folderTree.children}
              rowClassName={record => classNames(
                { 'to-be-default': record.id === getDefId() && record.id !== defFolderId },
                { 'ant-table-row-selected': selectedRowKey === record.id }
              )}
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
          onOk={folder => this.handleNewFolderFormOk(folder)}
          onCancel={this.handleNewFolderFormCancel}
        />
      </div>
    );
  }
}

export default FolderSetting;
