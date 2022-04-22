/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { Table, Divider, Popconfirm, Icon, Form, message } from 'antd';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import ProjectAvatar from '../../../components//ProjectAvatar';
import EditForm from './EditForm';
import './style.less';

const WappedEditForm = Form.create({ name: 'edit_form' })(EditForm);
let lastProjectId;

@inject('appStore')
@observer
class ProjectsSetting extends Component {
  state = {
    visible: false,
    confirmLoading: false
  };

  columns;

  constructor(props) {
    super(props);

    this.columns = [
      {
        title: '项目',
        dataIndex: 'name',
        sorter: true,
        render: (text, record) => {
          return (
            <Link to={`/projects/${record.id}/settings`} className='link'>
              <ProjectAvatar size={32} project={record} />
              <span style={{ marginLeft: '8px' }}>{text}</span>
            </Link>
          );
        },
      },
      {
        title: '负责人',
        dataIndex: 'owner',
      },
      {
        title: '描述',
        dataIndex: 'desc',
        render: desc => (
          <span style={{
            display: 'inline-block',
            maxWidth: 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }} title={desc}>{desc}</span>)
      },
      // {
      //   title: '标签',
      //   dataIndex: 'tags',
      //   render: tags => (
      //     <span>
      //       {tags && tags.map(({ text, color }) => {
      //         return (
      //           <Tag color={color} key={text}>
      //             {text.toUpperCase()}
      //           </Tag>
      //         );
      //       })}
      //     </span>
      //   ),
      // },
      {
        title: '操作',
        key: 'action',
        render: (_, record) => {
          let handleOk = async () => {
            const { appStore: { projectStore } } = this.props;
            await record.client.remove();
            projectStore.remove(record.id);
          };
          return (
            <span>
              <a onClick={() => this.showEditModal(record)}><Icon type='edit' title="编辑" /></a>
              <Divider type="vertical" />
              <Popconfirm title={'确定删除当前项目吗?'} onConfirm={handleOk} >
                <a><span title="删除"><Icon type='delete' /></span></a>
              </Popconfirm>
            </span>
          );
        }
      },
    ];
  }

  async componentDidMount() {
    const { appStore } = this.props;
    let { projectStore } = appStore;
    appStore.setSubName('ProjectsSetting');
    await projectStore.load();
  }

  showEditModal = (project) => {
    let { form } = this.editFormRef.props;
    if (project.id !== lastProjectId) {
      form.resetFields();
      lastProjectId = project.id;
    }
    this.setState({
      project,
      visible: true,
    });
  };

  handleEditCancel = () => {
    this.setState({
      visible: false,
      confirmLoading: false
    });
  };

  handleEditOk = () => {
    const { appStore: { projectStore } } = this.props;
    let { form } = this.editFormRef.props;
    let { project } = this.state;
    form.validateFields(async (err, { name, desc }) => {
      try {
        if (err) return;
        this.setState({
          confirmLoading: true
        });
        await project.client.update({
          name,
          desc
        });
        projectStore.update(project.id, {
          name,
          desc
        })
        this.handleEditCancel();
        form.resetFields();
        message.success(`项目 ${name} 更新成功`);
      } catch (error) {
        this.setState({
          confirmLoading: false
        });
      }
    });
  }


  render() {
    const { appStore: { projectStore } } = this.props;
    let { projects } = projectStore;
    if (!projects) return null;
    let { project, visible, confirmLoading, selected } = this.state;
    return (
      <div className='ProjectsSetting'>
        <Table columns={this.columns} dataSource={projects} rowKey='id'
          rowClassName={({ id }) => selected === id ? 'ant-table-row-selected' : ''}
          onRow={
            ({ id }) => {
              return {
                onClick: e => {
                  this.setState({ selected: id });
                }
              }
            }} />
        <WappedEditForm
          wrappedComponentRef={(ref) => this.editFormRef = ref}
          project={project}
          visible={visible}
          confirmLoading={confirmLoading}
          onCancel={this.handleEditCancel}
          onOk={this.handleEditOk}
        />
      </div>
    );
  }
}

export default ProjectsSetting;
