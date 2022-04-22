/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Divider, Table, Form, Tooltip, Icon, Dropdown, Menu, message } from 'antd';
import moment from 'moment';
import TreeNode from '../../../../../stores/TreeNode';
import NewIterationForm from '../../TeamConfig/NewIterationForm';
import './style.less';

const WrappedNewIterationForm = Form.create({ name: 'new_iteration_form' })(NewIterationForm);
let lastIterationId;

@inject('appStore')
@observer
class IterationSetting extends Component {

  state = {
    iteration: null,
    visible: false,
    confirmLoading: false,
    selectedRowKey: '',
    isEditing: false,
    isDeleting: false
  }

  showNewIteraionModal = (iteration, isEditing = false, isDeleting = false) => {
    let { form } = this.newIterationFormRef.props;
    let selectedId = iteration && iteration.id;
    if (lastIterationId !== selectedId) {
      form.resetFields();
      lastIterationId = selectedId;
    }
    this.setState({
      visible: true,
      iteration,
      isEditing,
      isDeleting
    })
  }

  handleNewIterationFormOk = (iteration, isEditing, isDeleting) => {
    let { projectConfigStore } = this.props.appStore;
    let { form } = this.newIterationFormRef.props;
    form.validateFields(async (err, { name, range, locationId }) => {
      try {
        if (err) return;
        this.setState({
          confirmLoading: true
        });
        let { parent } = iteration;
        if (isEditing) {
          await projectConfigStore.updateIteration(iteration.id, {
            name,
            path: `${parent.path || ''}/${name}`,
            startDate: range[0] && range[0].format('YYYY-MM-DD'),
            endDate: range[1] && range[1].format('YYYY-MM-DD')
          }, undefined, iteration);
        } else if (isDeleting) {
          await projectConfigStore.removeIterationWithSubs(iteration, locationId);
        } else {
          await projectConfigStore.createIteration({
            name,
            path: `${parent.path || ''}/${name}`,
            startDate: range[0] && range[0].format('YYYY-MM-DD'),
            endDate: range[1] && range[1].format('YYYY-MM-DD')
          });
        }
        message.success(`迭代${isEditing ? '更新' : isDeleting ? '删除' : '创建'}成功`);
        this.handleNewIterationFormCancel();
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

  handleNewIterationFormCancel = () => {
    this.setState({
      visible: false,
      confirmLoading: false
    });
  }

  render() {
    let {
      project: {
        rootIterationId,
        iterations,
        iterationTree
      }
    } = this.props.appStore;
    TreeNode.sortTree(iterationTree);
    let rootIteration = iterations.find(i => i.id === rootIterationId);
    let {
      iteration,
      visible,
      confirmLoading,
      selectedRowKey,
      isEditing,
      isDeleting
    } = this.state;

    this.iterationColumns = [{
      title: (
        <span>
          迭代
          <Divider type='vertical' style={{ margin: '0 16px' }} />
          <a onClick={() => this.showNewIteraionModal({ parent: rootIteration })}>
            <Icon type='plus' style={{ color: 'green', marginRight: 6 }} />
            <span>新建</span>
          </a>
        </span>
      ),
      dataIndex: 'name'
    }, {
      title: '',
      render: (record) => {
        return (
          <span className='btns-operation'>
            <Tooltip title='操作'>
              <Dropdown trigger={['click']} overlay={
                <Menu>
                  <Menu.Item key='createChild'
                    onClick={() => this.showNewIteraionModal({ parent: record })} >
                    <span>
                      <Icon type='plus-circle' style={{ color: '#1890ff' }} />
                      <span>新建子级</span>
                    </span>
                  </Menu.Item>
                  <Menu.Item key='edit'
                    onClick={() => this.showNewIteraionModal(record, true)}>
                    <span>
                      <Icon type='edit' style={{ color: '#1890ff' }} />
                      <span>编辑</span>
                    </span>
                  </Menu.Item>
                  <Menu.Item key='delete'
                    onClick={() => this.showNewIteraionModal(record, false, true)}
                    disabled={record.id === rootIterationId}>
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
          </span>
        );
      }
    }, {
      title: '开始日期',
      dataIndex: 'startDate',
      render: (startDate) => startDate && moment(startDate).format('YYYY-MM-DD')
    }, {
      title: '结束日期',
      dataIndex: 'endDate',
      render: (endDate) => endDate && moment(endDate).format('YYYY-MM-DD')
    }, {
      title: '',
      width: '40%'
    }];

    return (
      <div className='IterationSetting'>
        <div style={{ marginTop: 12 }}>
          <div className='label'>项目迭代管理</div>
          <div className='table-wrapper'>
            <Table rowKey='id'
              columns={this.iterationColumns}
              size={'small'}
              pagination={false}
              defaultExpandAllRows
              dataSource={[rootIteration]}
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
        <WrappedNewIterationForm
          wrappedComponentRef={(ref) => this.newIterationFormRef = ref}
          iteration={iteration}
          iterationTree={iterationTree}
          visible={visible}
          confirmLoading={confirmLoading}
          isEditing={isEditing}
          isDeleting={isDeleting}
          onOk={(iteration, e, d) => this.handleNewIterationFormOk(iteration, e, d)}
          onCancel={this.handleNewIterationFormCancel}
        />
      </div >
    );
  }
}

export default IterationSetting;
