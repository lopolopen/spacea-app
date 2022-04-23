/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { Table, Button, Empty, Modal, Tooltip, message, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import classNames from 'classnames';
import update from 'immutability-helper';
import copy from 'copy-to-clipboard';
import utility from '../../../utility';
import DragableRow from '../DragDropRow';
import { DragTitle } from '../../../components/Dragable';
import { WorkItem } from '../../../stores/WorkItemStore';
import WorkItemForm from '../WorkItemForm';
import WorkItemIcon from '../../../components/WorkItemIcon';
import { RepoClient } from '../../../services/api/GitLabClient';
import { defineColumns } from './columns';
import { injectIntl, FormattedMessage } from 'react-intl';
import NewBranchForm from './NewBranchForm';

const WappedWorkItemForm = Form.create({ name: 'work_item_form' })(WorkItemForm);
const WappedNewBranchForm = Form.create({ name: 'new_branch_form' })(NewBranchForm);

@injectIntl
@inject('appStore')
@observer
class WorkItemTable extends Component {
  state = {
    nbm_visible: false,
    selectedIds: [],
    expandedRowKeys: [],
    filters: {},
    pageSize: 20,
  };

  idRefMap = new Map();

  showWorkItemModel = async (workItem) => {
    const { workItemStore } = this.props.appStore;
    await workItem.loadDetails();
    workItemStore.setWorkItem(workItem);
    this.setState({
      nwim_visible: true,
    }, () => {
      setTimeout(() => {
        //如果是新建，则标题输入框聚焦
        if (!workItem.id) {
          this.workItemFormRef.titleRef.focus();
        }
      }, 50);
    });
  }

  handleWorkItemOk = (workItem) => {
    const { appStore } = this.props;
    const { workItemStore, analysisStore } = appStore;
    let { form } = this.workItemFormRef.props;
    form.validateFields(async (err, values) => {
      try {
        if (err) return;
        this.setState({
          nwim_confirmLoading: true
        });
        let id = await workItemStore.saveWorkItem(values);
        if (id) {
          this.toggleExpansion(workItem.parentId, true);
          this.setState({
            selectedIds: [id]
          });
          message.success(`事项 #${id} 创建成功`);
        }
        else {
          message.success(`事项 #${workItem.id} 更新成功`);
        }
        this.handleWorkItemCancel();
        analysisStore.refreshPanel();
      } catch (error) {
        this.setState({
          nwim_confirmLoading: false
        });
        throw error;
      }
    })
  };

  handleWorkItemCancel = (hasNoChange = true) => {
    const closeModal = () => {
      //会引起无限render
      // let { form } = this.workItemFormRef.props;
      // form.resetFields();
      this.setState({
        nwim_visible: false,
        nwim_confirmLoading: false
      });
    }
    if (hasNoChange) {
      closeModal()
    } else {
      const okText = '是';
      Modal.confirm({
        title: '确认取消吗？',
        content: `您已经改动了工作事项的数据，如果点击“${okText}”，这些数据将会被丢弃。`,
        okText,
        cancelText: '否',
        onOk: closeModal
      });
    }
  };

  toggleExpansion = (key, expanded) => {
    if (!key) return;
    let { expandedRowKeys } = this.state;
    let index = expandedRowKeys.indexOf(key);
    if (index >= 0) {
      if (expanded !== true) {
        this.setState({
          expandedRowKeys: update(expandedRowKeys, { $splice: [[index, 1]] })
        });
      }
    } else {
      if (expanded !== false) {
        this.setState({
          expandedRowKeys: [...expandedRowKeys, key]
        });
      }
    }
  }

  expandAll = () => {
    let { appStore: { workItemStore } } = this.props;
    this.setState({
      expandedRowKeys: workItemStore.storyIds
    });
  };

  shrinkAll = () => {
    this.setState({
      expandedRowKeys: []
    });
  };

  getKeysInPath(key) {
    if (!key) return;
    let current = WorkItem.mapper.get(key);
    if (!current) return;
    let collector = [];
    while (current && current.id) {
      current = current.getParent();
      if (current.type === 'story') {
        collector.push(current.id)
      }
    }
    let allKeys = [...collector, ...this.state.expandedRowKeys];
    return [...new Set(allKeys)];
  }

  expand = utility.stay(function (key) {
    this.toggleExpansion(key, true);
  }, 650);

  handleNewBranchCancel = () => {
    this.setState({
      nbm_visible: false,
      nbm_confirmLoading: false
    });
  }

  handleNewBranchOk = ({ id }) => {
    let { form } = this.newBranchFormRef.props;
    form.validateFields(async (err, { repoId, ref, branch }) => {
      try {
        if (err) return;
        let branchName = `${branch.prefix}-#${id}-${branch.body}`;
        this.setState({
          nbm_confirmLoading: true
        });
        let repoClient = new RepoClient(repoId);
        let newBranch = await repoClient.createBranch(ref, branchName);
        this.handleNewBranchCancel();
        message.success(`分支 ${newBranch.name} 创建成功`);
      } catch (error) {
        this.setState({
          nbm_confirmLoading: false
        });
        throw error;
      }
    });
  }

  deleteWorkItem = async (workItem) => {
    const { appStore } = this.props;
    const { workItemStore, analysisStore } = appStore;
    try {
      await workItemStore.deleteWorkItem(workItem);
      message.success(`事项 #${workItem.id} 删除成功`)
    } catch (error) {
      message.error(error.response.data)
    }
    analysisStore.refreshPanel()
    this.forceUpdate();
  }

  handleTableChange = (pagination, filters, sorter) => {
    const { appStore: { workItemStore } } = this.props;
    if (pagination) { }
    if (filters) {
      let usingFilter = Object.keys(filters).some(k => filters[k] && filters[k].length > 0);
      workItemStore.useFilter(usingFilter);
      if (!usingFilter) {
        this.setState({
          expandedRowKeys: !this.keyToScroll ?
            this.state.expandedRowKeys
            :
            this.getKeysInPath(this.keyToScroll),
          filters
        }, () => {
          setTimeout(() => {
            this.scrollTo(this.keyToScroll);
            this.keyToScroll = null;
          }, 500);
        });
      } else {
        this.setState({
          selectedIds: [],
          filters
        });
      }
    }
    if (sorter) { }
  }

  scrollTo = (id) => {
    if (!id) return;
    let idElem = this.idRefMap.get(id);
    if (!idElem) return;
    idElem.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  render() {
    let {
      appStore,
      excludedColumns
    } = this.props;
    let {
      workItemStore,
      project,
      uiStateStore
    } = appStore;
    const {
      workItem,
      workItems,
      workItemTree,
      isLoading,
      usingFilter
    } = workItemStore;
    const {
      expandedRowKeys,
      selectedIds,
      nwim_visible,
      nwim_confirmLoading,
      nbm_visible,
      nbm_confirmLoading,
      pageSize
    } = this.state;
    let dataSource = [];
    let pagination = false;
    if (workItemTree && workItems && workItems.length > 0) {
      dataSource = !usingFilter ?
        workItemTree.children
        :
        workItems.sort((x, y) => {
          if (x.longOrder > y.longOrder) return 1;
          else return -1;
        });
      if (workItems.length > 100) {
        pagination = {
          position: 'top',
          showSizeChanger: true,
          pageSize,
          onShowSizeChange: (_, size) => this.setState({ pageSize: size })
        };
      }
    }
    let columns = defineColumns.call(this)
      .filter(c => !(excludedColumns || []).includes(c.flagId));
    return (
      <div className={classNames(
        { 'WorkItemTable': true },
        { 'has-pagination': pagination }
      )}>
        <Table rowKey='id'
          expandIconColumnIndex={1}
          onChange={this.handleTableChange}
          columns={columns}
          dataSource={isLoading ? [] : dataSource}
          size='small'
          rowClassName={record => classNames(
            { 'ant-table-row-size': true },
            { [`size-${uiStateStore.work_item_table_size}`]: true },
            { 'ant-table-row-will-disappear': !record.willBeShown },
            { 'ant-table-row-selected': selectedIds.includes(record.id) }
          )}
          expandedRowKeys={expandedRowKeys}
          onExpand={(expanded, { id }) => this.toggleExpansion(id, expanded)}
          pagination={pagination}
          components={{ body: { row: DragableRow } }}
          locale={{
            filterConfirm: <Button type='primary' icon='check' size='small' />,
            filterReset: <Button style={{ color: 'red' }} icon='close' size='small' />,
            emptyText: <Empty />
          }}
          loading={isLoading}
          onRow={(record, index) => {
            return {
              index,
              record,
              selected: selectedIds.map(id => WorkItem.mapper.get(id)),
              onHover: (key) => {
                this.expand(key);
              },
              onDrop: async (e) => {
                //TODO: [refactor]转移到project store中
                const { from, to, location } = e;
                if (from === to) return;
                let reOrder;
                if (location === 'top') {
                  // if (from.nextId === to.id) return;
                  from.removeFromParent();
                  reOrder = {
                    parentId: to.parentId,
                    nextId: to.id
                  };
                  from.setAboveSibling(to);
                } else if (location === 'center') {
                  from.removeFromParent();
                  reOrder = {
                    parentId: to.id,
                  }
                  from.setAsChild(to);
                } else {
                  // location === 'bottom'
                  // if (from.previousId === to.id) return;
                  from.removeFromParent();
                  reOrder = {
                    parentId: to.parentId,
                    previousId: to.id,
                  };
                  from.setBelowSibling(to);
                }
                this.setState({
                  selectedIds: [from.id]
                });
                this.toggleExpansion(to.id, true);
                from.setLoading(true);
                this.forceUpdate();
                let order = await project.client.reOrder(from.id, reOrder);
                from.setOrder(order);
                from.setLoading(false);
                this.forceUpdate();
              },
              onMouseDown: (e) => {
                const { id } = record;
                if (!selectedIds.includes(id)) {
                  if (e.ctrlKey) {
                    this.justAdded = true;
                    this.setState({
                      selectedIds: [...selectedIds, record.id]
                    });
                  } else {
                    this.setState({
                      selectedIds: [record.id]
                    });
                  }
                }
              },
              onClick: (e) => {
                const { id } = record;
                let idx = selectedIds.indexOf(id);
                if (idx >= 0) {
                  if (e.ctrlKey) {
                    !this.justAdded && this.setState({
                      selectedIds: update(selectedIds, { $splice: [[idx, 1]] })
                    });
                  } else {
                    this.setState({
                      selectedIds: [record.id]
                    });
                  }
                }
                this.justAdded = false;
                //在使用过滤器条件下选择事项，则需要在返回时滚动并选中
                if (usingFilter) {
                  this.lastKey = record.id;
                }
              },
              onDoubleClick: () => {
                //workaround: 被包装的事件，没有被mobx监听
                if (!record.detailed) {
                  record.setLoading(true);
                  this.forceUpdate();
                }
                this.showWorkItemModel(record);
              }
            };
          }}
        />
        {
          !workItem ? null :
            <Modal className='work-item-modal'
              title={
                <DragTitle visible={nwim_visible}>
                  <div>
                    <WorkItemIcon type={workItem.type} labeled />
                    <span style={{ marginLeft: 8 }}>
                      {
                        !workItem.id ? '<新建>' :
                          <Tooltip title='复制ID'>
                            <span className='workitem-id'
                              onClick={() => {
                                copy(workItem.id);
                                message.info('ID已复制到剪贴板');
                              }}>
                              {`#${workItem.id}`}
                            </span>
                          </Tooltip>
                      }
                    </span>
                  </div>
                </DragTitle>
              }
              centered
              visible={nwim_visible}
              confirmLoading={nwim_confirmLoading}
              maskClosable={false}
              afterClose={() => {
                this.setState({ currentKey: 'details' })
              }}
              //部分子组件依赖componentDidMount初始化
              //同时，在Modal关闭后将重置被移动的位置
              destroyOnClose={true}
              onCancel={() => this.handleWorkItemCancel(workItem.hasNoChange)}
              onOk={() => this.handleWorkItemOk(workItem)}
              keyboard={true}
              okText={'保存 & 关闭'}
              okButtonProps={{
                disabled: workItem.hasError || (workItem.id && workItem.hasNoChange)
              }}
            >
              <WappedWorkItemForm wrappedComponentRef={(ref) => this.workItemFormRef = ref} />
            </Modal >
        }
        <WappedNewBranchForm
          wrappedComponentRef={(ref) => this.newBranchFormRef = ref}
          repos={project.repos}
          workItem={workItem}
          visible={nbm_visible}
          confirmLoading={nbm_confirmLoading}
          onCancel={this.handleNewBranchCancel}
          onOk={this.handleNewBranchOk}
        />
      </div>
    );
  }
}

export default WorkItemTable;
