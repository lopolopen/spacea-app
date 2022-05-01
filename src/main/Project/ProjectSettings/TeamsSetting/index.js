/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Avatar, Table, Divider, Button, Form, Badge, message, Tag, Popconfirm, Icon } from 'antd';
import './style.less';
import { inject, observer } from 'mobx-react';
import utility from '../../../../utility';
import CreateOrEditForm from './CreateOrEditForm';
import MemberAvatar from '../../../../components/MemberAvatar';

const WappedCreateOrEditForm = Form.create({ name: 'create_edit_form' })(CreateOrEditForm);
let lastTeamId;

@withRouter
@Form.create()
@inject('appStore')
@observer
class TeamsSetting extends Component {

  state = {
    visible: false,
    confirmLoading: false
  };

  columns = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: '团队',
      key: 'name',
      // sorter: true,
      render: ({ id, name, acronym }) => {
        let color = utility.hashColor(name);
        let { location } = this.props;
        return (
          <Link to={`${location.pathname}/${id}/config`}>
            <Avatar style={{ backgroundColor: color }}>
              {(acronym || name.charAt(0)).toUpperCase()}
            </Avatar>
            <span style={{ marginLeft: '8px' }}>{name}</span>
          </Link>
        );
      }
    },
    {
      title: '',
      dataIndex: 'groupId',
      render: (groupId) => groupId ? <Tag>开发组</Tag> : null
    },
    {
      title: '成员',
      dataIndex: 'members',
      render: (members) => {
        if (!members) return null;
        return members.filter(m => !m.disabled).map((member) => {
          return (
            <span key={member.id} style={{ marginRight: 2 }}>
              <MemberAvatar member={member} size={'small'} />
            </span>
          )
        });
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (record) => {
        const { appStore: { project } } = this.props;
        let id = record.id;
        let defaultTeamId = project.defaultTeamId;
        return (
          <span>
            {
              id === defaultTeamId ?
                <Tag style={{ marginRight: '2px' }}><Badge color="#1890ff" />默认</Tag> :
                <a onClick={() => this.setDefault(id)}>设为默认</a>
            }
            <Divider type='vertical' />
            <a onClick={() => this.showModal(record)}><Icon type='edit' title="编辑" /></a>
            <Divider type='vertical' />
            <Popconfirm
              okText="Yes"
              cancelText="No"
              onConfirm={() => { this.deleteTeam(record.id); }}
              title={'确定删除"' + record.name + '"团队吗?'}
            >
              <a disabled={id === defaultTeamId}>
                <span title="删除"><Icon type='delete' /></span>
              </a>
            </Popconfirm>
          </span >)
      }
    }
  ];

  async componentDidMount() {
    let { appStore } = this.props
    appStore.setSubName('TeamsSetting');
    await appStore.loadMembers();
  }

  showModal = (team) => {
    let { form } = this.formRef.props;
    let selectedTeamId = team && team.id;
    if (lastTeamId !== selectedTeamId) {
      form.resetFields();
      lastTeamId = selectedTeamId;
    }
    this.setState({
      team,
      visible: true,
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false,
      confirmLoading: false
    });
  };

  handleOk = (team, isEditing) => {
    const { appStore: { project } } = this.props;
    let { form } = this.formRef.props;
    form.validateFields(async (err, { name, memberIds, acronym, description }) => {
      try {
        if (err) return;
        this.setState({
          confirmLoading: true
        });
        if (isEditing) {
          await project.updateTeam(team.id, {
            name,
            memberIds,
            acronym,
            description
          });
          message.success(`团队 ${name} 更新成功`);
        } else {
          await project.createTeam({
            name,
            memberIds,
            acronym,
            description
          });
          message.success(`团队 ${name} 创建成功`);
        }
        this.handleCancel();
        form.resetFields();
      } catch (error) {
        this.setState({
          confirmLoading: false
        });
        throw error;
      }
    });
  }

  async deleteTeam(id) {
    const { appStore: { project } } = this.props;
    let defaultTeamId = project.defaultTeamId;
    if (id !== defaultTeamId) {
      await project.removeTeam(id)
      message.success('删除团队完成')
    }
    else {
      message.warning('默认团队无法删除')
    }
  }

  async setDefault(defaultTeamId) {
    const { appStore: { projectStore } } = this.props;
    await projectStore.updateDefaultTeamId(defaultTeamId)
    this.forceUpdate();
  }

  render() {
    const { project: { teams } } = this.props.appStore;
    const { team, visible, confirmLoading, selected } = this.state;
    return (
      <div className='TeamsSetting'>
        <div className='top-bar'>
          <Button type='primary' onClick={() => this.showModal()}>
            <Icon type='plus' />
            新建团队
          </Button>
        </div>

        <div>
          <Table rowKey={'id'}
            columns={this.columns}
            dataSource={teams}
            rowClassName={({ id }) => selected === id ? 'ant-table-row-selected' : ''}
            onRow={({ id }) => {
              return {
                onClick: () => {
                  this.setState({ selected: id });
                },
              }
            }}
          />
        </div>
        <WappedCreateOrEditForm
          wrappedComponentRef={(ref) => this.formRef = ref}
          team={team}
          teams={teams}
          visible={visible}
          confirmLoading={confirmLoading}
          onCancel={this.handleCancel}
          onOk={this.handleOk}
        />
      </div >
    );
  }
}

export default TeamsSetting;
