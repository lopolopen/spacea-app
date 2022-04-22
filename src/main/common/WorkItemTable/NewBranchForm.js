import React, { Component } from 'react';
import { Modal, Form, Select } from 'antd';
import { RepoClient } from '../../../services/api/GitLabClient';
import BranchNameInput from '../../common/BranchNameInput';
import './style.less';

const { Option } = Select;

class NewBranchForm extends Component {
  state = {
    branches: []
  };

  // handleSubmit(e) {
  //   e.preventDefault();
  //   this.props.form.validateFields((err, values) => {
  //     console.log(values);
  //   });
  // };

  handleRepoChange = async (id) => {
    let repoClient = new RepoClient(id);
    let branches = await repoClient.getBranches();
    this.setState({
      branches
    });
  }

  validateBranch = (_, { body }, cb) => {
    if (body) return cb();
    cb('分支名主体不可以为空');
  }

  render() {
    let { repos, workItem, form, visible, confirmLoading, onCancel, onOk } = this.props;
    if (!workItem) return null;
    let { branches } = this.state;
    let defBranch = branches.find(b => b.default);
    repos = repos || [];
    const { getFieldDecorator } = form;

    return (
      <Modal
        visible={visible}
        confirmLoading={confirmLoading}
        title="新建分支"
        maskClosable={false}
        onCancel={onCancel}
        onOk={() => onOk(workItem)}
        afterClose={() => {
          this.setState({
            branches: []
          });
          form.resetFields();
        }}
      >
        <Form layout="vertical">
          <div className='label'>仓库</div>
          <Form.Item>
            {
              getFieldDecorator('repoId', {
                // initialValue: null,
                rules: [
                  { required: true, message: '请选择GitLab仓库' },
                ]
              })(
                <Select
                  // style={{ width: '100%' }}
                  placeholder='请选择GitLab仓库'
                  onChange={this.handleRepoChange}
                >
                  {
                    repos.map(({ id, name }) =>
                      <Option key={id} value={id}>
                        <span>{name}</span>
                      </Option>)
                  }
                </Select>
              )
            }
          </Form.Item>
          <div className='label'>基于分支</div>
          <Form.Item>
            {
              getFieldDecorator('ref', {
                initialValue: defBranch && defBranch.name
              })(
                <Select
                  // style={{ width: '100%' }}
                  showSearch={true}
                  placeholder='请选择基础分支'
                  optionFilterProp='label'
                  filterOption={(input, option) => {
                    let label = option.props.label;
                    if (typeof label !== 'string') {
                      label = label.props.children;
                    }
                    if (typeof label !== 'string') {
                      return false;
                    }
                    return label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                  }}
                >
                  {
                    branches.map(({ name, default: def }, idx) =>
                      <Option key={idx} value={name} label={name}>
                        <span>{name}</span>
                      </Option>)
                  }
                </Select>
              )
            }
          </Form.Item>
          <div className='label'>分支名称</div>
          <Form.Item>
            {
              getFieldDecorator('branch', {
                initialValue: { prefix: 'feat' },
                rules: [{ validator: this.validateBranch }]
              })(<BranchNameInput workItem={workItem} />)
            }
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default NewBranchForm;
