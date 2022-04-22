/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Row, Col, Divider, TreeSelect, Table, Form, Tooltip, Icon, Dropdown, Menu, Badge, Popconfirm, message, Button } from 'antd';
import moment from 'moment';
import classNames from 'classnames';
import TreeNode from '../../../../../stores/TreeNode';
import NewIterationForm from '../NewIterationForm';
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
    selectedRowKey: ''
  }

  showNewIteraionModal = (iteration) => {
    let { form } = this.newIterationFormRef.props;
    let selectedId = iteration && iteration.id;
    if (lastIterationId !== selectedId) {
      form.resetFields();
      lastIterationId = selectedId;
    }
    this.setState({
      visible: true,
      iteration
    })
  }

  handleNewIterationFormOk = (iteration) => {
    let { teamConfigStore } = this.props.appStore;
    let { form } = this.newIterationFormRef.props;
    form.validateFields(async (err, { name, range }) => {
      try {
        if (err) return;
        this.setState({
          confirmLoading: true
        });
        let { parent } = iteration;
        if (!iteration.id) {
          await teamConfigStore.createIterationForCurrentTeam({
            name,
            path: `${parent.path}/${name}`,
            startDate: range[0] && range[0].format('YYYY-MM-DD'),
            endDate: range[1] && range[1].format('YYYY-MM-DD')
          }, parent);
          this.forceUpdate();
          message.success(`迭代创建成功，并被当前团队选择`);
        } else {
          await teamConfigStore.updateIteration(iteration.id, {
            name,
            path: `${parent.path}/${name}`,
            startDate: range[0] && range[0].format('YYYY-MM-DD'),
            endDate: range[1] && range[1].format('YYYY-MM-DD')
          }, undefined, iteration);
          this.forceUpdate();
          message.success(`迭代（可能包含子级）更新成功`);
        }
        this.handleNewIterationFormCancel();
        form.resetFields();
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
    const { getFieldDecorator, getFieldValue, setFieldsValue } = this.props.form;
    let {
      project: {
        iterations,
        iterationTree
      },
      teamConfigStore,
      teamConfigStore: {
        currentTeam
      }
    } = this.props.appStore;
    if (!currentTeam) return null;
    TreeNode.sortTree(iterationTree);
    let selectedIterationIds = new Set((currentTeam.iterations || []).map(i => i.id));
    //表单内选中的id（可能尚未提交）
    let defId = getFieldValue('defId') || currentTeam.defaultIteration.id;
    //统一从project.iterations来获取数据（同源原则）
    let newDefIteration = iterations.find(i => i.id === defId);
    let defIteration = iterations.find(i => i.id === currentTeam.defaultIteration.id);
    let {
      iteration,
      visible,
      confirmLoading,
      selectedRowKey
    } = this.state;

    this.iterationColumns = [{
      title: (
        <span>
          迭代
          <Divider type='vertical' style={{ margin: '0 16px' }} />
          <a onClick={() => this.showNewIteraionModal({ parent: defIteration })}>
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
        let included = selectedIterationIds.has(record.id);
        return <Badge status={included ? 'success' : 'default'} text={path} />
      }
    }, {
      title: '',
      render: (record) => {
        let included = selectedIterationIds.has(record.id);
        return (
          <span className='btns-operation'>
            <span className={classNames({ 'to-excludes': included })}>
              {
                included ?
                  <Tooltip title='排除'>
                    <a onClick={async () => {
                      await teamConfigStore.deselectIteration(record);
                    }}>
                      <Icon type='close' />
                    </a>
                  </Tooltip>
                  :
                  <Tooltip title='选择'>
                    <a onClick={async () => {
                      await teamConfigStore.selectIteration(record);
                    }}>
                      <Icon type='check' />
                    </a>
                  </Tooltip>
              }
            </span>
            <Divider type='vertical' />
            <Tooltip title='更多'>
              <Dropdown trigger={['click']} overlay={
                <Menu>
                  <Menu.Item key='createChild'
                    onClick={() => this.showNewIteraionModal({ parent: record })} >
                    <span>
                      <Icon type='plus-circle' style={{ color: '#1890ff' }} />
                      <span>新建子级</span>
                    </span>
                  </Menu.Item>
                  <Menu.Item key='edit' onClick={() => this.showNewIteraionModal(record)}>
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
        );
      }
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      render: (startDate) => startDate && moment(startDate).format('YYYY-MM-DD')
    }, {
      title: '结束日期',
      dataIndex: 'endDate',
      render: (endDate) => endDate && moment(endDate).format('YYYY-MM-DD')
    }, {
      title: '',
      width: '20%'
    }];

    return (
      <div className='IterationSetting'>
        <Form>
          <div className='label'>默认迭代</div>
          <Row>
            <Col span={8}>
              <Form.Item>
                {
                  getFieldDecorator('defId', {
                    initialValue: defIteration.id
                  })(
                    <TreeSelect
                      style={{ width: '100%' }}
                      treeData={iterationTree.children}
                      treeDefaultExpandAll
                      treeNodeLabelProp='path'
                    />
                  )
                }
              </Form.Item>
            </Col>
            <Col span={8}>
              <Button style={{ marginLeft: 8, display: defId === defIteration.id ? 'none' : 'inline-block' }}
                onClick={() => {
                  setFieldsValue({ defId: defIteration.id })
                }}
              >
                取消
              </Button>
              <Popconfirm
                title={
                  <span >
                    <p style={{ fontWeight: 'bold' }}>确定更新当前团队的默认迭代吗？</p>
                    <p style={{ width: 380 }}>
                      {`更新默认迭代将会导致下表中不是“${newDefIteration.path}”后继（被`}
                      <span style={{ background: '#ffe6e6' }}>颜色</span>
                      {`标记）的项被移除。`}
                    </p>
                  </span>
                }
                onConfirm={() => {
                  let { teamConfigStore } = this.props.appStore;
                  teamConfigStore.selectDefIterationOfCurrentTeam(defId);
                }}
                okText='是'
                cancelText='否'
              >
                <Button type='primary' disabled={defId === defIteration.id} style={{ marginLeft: 8 }}>
                  保存
                </Button>
              </Popconfirm>
            </Col>
          </Row>
        </Form >
        <div style={{ marginTop: 12 }}>
          <div className='label'>团队迭代管理</div>
          <div className='table-wrapper'>
            <Table rowKey='id'
              columns={this.iterationColumns}
              size={'small'}
              pagination={false}
              defaultExpandAllRows
              dataSource={defIteration.children}
              rowClassName={record => {
                if (record.id === defId || !record.path.startsWith(newDefIteration.path)) {
                  return 'to-be-removed'
                }
                return selectedRowKey === record.id ? 'ant-table-row-selected' : ''
              }}
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
          onOk={iteration => this.handleNewIterationFormOk(iteration)}
          onCancel={this.handleNewIterationFormCancel}
        />
      </div >
    );
  }
}

export default IterationSetting;
