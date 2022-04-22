/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Table, Form, Icon, message, Divider, Tooltip, Modal, Badge } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faLockOpen, faLock, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import classNames from 'classnames';
// import moment from 'moment';
import LinkForm from './LinkForm';

const WappedLinkForm = Form.create({ name: 'link_form' })(LinkForm);

@inject('appStore')
@observer
class RepoManagement extends Component {
  state = {
    selected: undefined,
    visible: false,
    confirmLoading: false
  };

  columns = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: (
        <span>
          仓库
          {/* <Divider type='vertical' style={{ margin: '0 16px' }} />
          <a disabled onClick={null}>
            <Icon type='plus' style={{ color: 'green', marginRight: 6 }} />
            <span>新建</span>
          </a> */}
          <Divider type='vertical' style={{ margin: '0 16px' }} />
          <a onClick={() => this.showLinkReposModal()}>
            <Icon type='link' style={{ color: 'green', marginRight: 6 }} />
            <span>关联</span>
          </a>
        </span>
      ),
      render: ({ nameWithNamespace, webUrl }) => {
        return (
          !webUrl ? nameWithNamespace :
            <a target='_blank' href={webUrl}>
              <span style={{ marginRight: 6 }}>{nameWithNamespace}</span>
              <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
        );
      }
    },
    // {
    //   title: '创建日期',
    //   dataIndex: 'createdAt',
    //   render: (createdAt) => moment(createdAt).format('YYYY-MM-DD')
    // },
    {
      title: 'JOKERPIPE',
      render: ({ name, jokerpipeUrl, jokerpipeStatus }) => {
        if (jokerpipeStatus === 'off') return null;
        return (
          <a target='_blank' href={jokerpipeUrl}>
            <span style={{ marginRight: 6 }}>{name}</span>
            <FontAwesomeIcon icon={faExternalLinkAlt} />
          </a>
        );
      }
    },
    {
      title: 'JOKERPIPE状态',
      dataIndex: 'jokerpipeStatus',
      render: (status) => {
        switch (status) {
          case 'off':
            return <Badge status='default' text='OFF' />;
          case 'updating':
            return <Icon type='sync' spin style={{ color: '#1890ff' }} />;
          case 'enabled':
            return <Badge status='green' text='已启用' />;
          case 'error':
            return <Badge status='red' text='异常' />;
          case 'disabled':
            return <Badge status='default' text='已禁用' />;
          default:
            return null;
        }
      }
    },
    {
      title: '操作',
      key: 'action',
      render: ({ id, jokerpipeStatus: status }) => {
        let { repoSettingStore } = this.props.appStore;
        if (status === 'error') status = 'off';
        return (
          <span>
            <Tooltip title={`${status === 'off' ? '开启' : '关闭'}Jokerpipe`}>
              <a className={classNames({ 'off-btn': status === 'off' })}
                disabled={status === 'updating'}
                onClick={() => {
                  repoSettingStore.jokerpipeOn(id, status !== 'off');
                }}><FontAwesomeIcon icon={faBolt} /></a>
            </Tooltip>
            <Divider type='verticcal' />
            <Tooltip title={`${status === 'enabled' ? '禁用' : '启用'}Jokerpipe`}>
              <a disabled={status === 'off' || status === 'updating'}
                onClick={() => {
                  repoSettingStore.enableJokerpipe(id, status === 'enabled');
                }}><FontAwesomeIcon icon={status === 'enabled' ? faLockOpen : faLock} /></a>
            </Tooltip>
            <Divider type='verticcal' />
            <Tooltip title='解除关联'>
              <a className='dislink-btn' onClick={() => {
                repoSettingStore.dislinkRepo(id);
              }}><Icon type='disconnect' /></a>
            </Tooltip>
          </span>
        );
      }
    },
    {
      title: '',
      width: '20%'
    }
  ];

  showLinkReposModal = () => {
    this.setState({ visible: true });
  };

  handleLinkCancel = () => {
    this.setState({
      visible: false,
      confirmLoading: false
    });
  };

  handleLinkOk = async () => {
    let { form } = this.linkFormRef.props;
    form.validateFields(async (err, { ownedRepoIds, joinedRepoIds }) => {
      try {
        if (err) return;
        this.setState({
          confirmLoading: true
        });
        // let { appStore: { project,repoSettingStore } } = this.props;
        let { repoSettingStore } = this.props.appStore;
        let { gitLabRepos } = repoSettingStore;
        let ids = new Set([...ownedRepoIds, ...joinedRepoIds]);
        let reposToLink = gitLabRepos.filter(r => ids.has(r.id.toString()));
        await repoSettingStore.linkGitLabRepos(reposToLink);
        this.handleLinkCancel();
        form.resetFields();
        message.success(`成功关联${reposToLink.length}个仓库`);
      } catch (error) {
        this.setState({
          confirmLoading: false
        });
        throw err;
      }
    });
  };

  render() {
    let { repoSettingStore } = this.props.appStore;
    let { linkedRepos } = repoSettingStore;
    if (!linkedRepos) return null;
    let { visible, confirmLoading, selected } = this.state;
    linkedRepos.sort((x, y) => x.id - y.id);
    return (
      <div className='RepoManagement'>
        <div className='label'>关联到项目的仓库</div>
        <div className='table-wrapper'>
          <Table rowKey={'id'}
            size={'small'}
            columns={this.columns}
            dataSource={linkedRepos}
            rowClassName={({ id }) => selected === id ? 'ant-table-row-selected' : ''}
            pagination={false}
            onRow={({ id }) => {
              return {
                onClick: () => {
                  this.setState({ selected: id });
                },
              }
            }}
          />
        </div>
        <Modal className='link-repo-modal'
          title="关联仓库"
          maskClosable={false}
          visible={visible}
          confirmLoading={confirmLoading}
          onCancel={this.handleLinkCancel}
          onOk={this.handleLinkOk}
        >
          <WappedLinkForm
            wrappedComponentRef={(ref) => this.linkFormRef = ref}
            visible={visible}
          />
        </Modal>
      </div>
    );
  }
}

export default RepoManagement;
