/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { PureComponent } from 'react';
import { Icon, Popconfirm, Divider, Menu, Dropdown, Tooltip } from 'antd';
import { inject, observer } from 'mobx-react';

@inject('appStore')
@observer
class Operations extends PureComponent {

  state = {
    title: '',
    iconColor: null,
    visible: false
  }

  popToDelete = (workItem) => {
    let title;
    let iconColor;
    if (workItem.hasChildren) {
      title = '当前节点下存在子节点，删除会导致子节点全部删除，确定删除当前事项吗？';
      iconColor = 'red';
      this.setState({
        title,
        iconColor,
        visible: true
      });
    }
    else {
      title = '确定删除当前事项吗？';
      iconColor = 'orange';
      this.setState({
        title,
        iconColor,
        visible: true
      });
    }
  }

  onVisibleChange = () => {
    this.setState({
      visible: false
    })
  }

  render() {
    let {
      appStore,
      onEditWorkItem,
      onDeleteWorkItem,
      onNewBranch,
      onCopyWorkItem,
      record
    } = this.props;
    let { project: { selectedTeam } } = appStore;
    if (!selectedTeam) return null;
    let { title, iconColor } = this.state;
    return (
      <span>
        <Tooltip title='编辑'>
          <a onDoubleClick={(e) => { e.stopPropagation() }}
            onClick={onEditWorkItem}>
            <Icon type='edit' />
          </a>
        </Tooltip>

        <Divider type='vertical' />

        <Tooltip title='删除'>
          <Popconfirm
            title={title}
            overlayStyle={{ maxWidth: '260px' }}
            icon={<Icon type='exclamation-circle' style={{ color: iconColor }} />}
            onConfirm={onDeleteWorkItem}
          >
            <a
              onDoubleClick={(e) => { e.stopPropagation() }}
              onClick={() => this.popToDelete(record)}>
              <Icon type='delete' />
            </a>
          </Popconfirm>
        </Tooltip>

        <Divider type='vertical' />

        <Tooltip title='更多'>
          <Dropdown trigger={['click']} overlay={
            <Menu>
              <Menu.Item key='copy' onClick={onCopyWorkItem}>
                <span>
                  <Icon type='copy' style={{ color: '#1890ff' }} />
                  <span>复制新建</span>
                </span>
              </Menu.Item>
              <Menu.Item key='newbranch' onClick={onNewBranch}>
                <span>
                  <Icon type='branches' style={{ color: '#1890ff' }} />
                  <span>新建分支</span>
                </span>
              </Menu.Item>
            </Menu >
          }>
            <a><Icon type='ellipsis' /></a>
          </Dropdown >
        </Tooltip>
      </span >
    )
  }
}

export default Operations;
