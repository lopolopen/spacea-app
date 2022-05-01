import React, { Component } from 'react';
import { Row, Col, Input, Button, Form, message, Icon } from 'antd';
import { inject, observer } from 'mobx-react';
import ProjectAvatar from '../../../../components/ProjectAvatar';
import AvatarUpload from '../../../../components/AvatarUpload';
import './style.less';

const { TextArea } = Input;

function hasErrors(fieldsError) {
  return Object.keys(fieldsError).some(field => fieldsError[field]);
}

function hasNoChange(fieldsValue, project) {
  if (!project) return true;
  return Object.keys(fieldsValue).every(field => {
    if (field === 'avatar') {
      return fieldsValue.avatar.uid === project.avatarUid;
    }
    return fieldsValue[field] === project[field];
  });
}

@Form.create({ name: 'overview_setting' })
@inject('appStore')
@observer
class OverviewSetting extends Component {
  state = {
    saving: false
  };

  componentDidMount() {
    this.props.appStore.setSubName('OverviewSetting');
  }

  handleSubmit = e => {
    e.preventDefault();
    this.setState({ saving: true });
    const { appStore, form } = this.props;
    form.validateFields(async (err, { name, description, avatar }) => {
      try {
        if (err) return;
        await appStore.updateProject({
          name,
          description,
        }, avatar);
        message.success(`项目 ${name} 更新成功`);
        this.setState({ saving: false });
      } catch (error) {
        this.setState({ saving: false });
        throw error;
      }
    });
  };

  render() {
    const { project } = this.props.appStore;
    if (!project || !project.id) return null;
    let { name, description, avatar } = project;
    if (!name) return null;
    const {
      getFieldDecorator,
      getFieldsError,
      getFieldsValue
    } = this.props.form;
    let { saving } = this.state;
    return (
      <div className='OverviewSetting'>
        <Form onSubmit={this.handleSubmit}>
          <label className='head'>项目信息</label>
          <Row>
            <Col span={8}>
              <div className='label'>名称</div>
              <Form.Item>
                {
                  getFieldDecorator('name', {
                    initialValue: name,
                    //TODO: 一些特殊字符可能产生不良影响
                    rules: [
                      { required: true, whitespace: true, message: '项目名称不能为空' },
                      { max: 30, message: '项目名称不能超过30个字符' }
                    ],
                  })(<Input placeholder='项目名称' />)
                }
              </Form.Item>
              <div className='label'>描述</div>
              <Form.Item>
                {
                  getFieldDecorator('description', {
                    initialValue: description,
                    rules: [{ max: 250, message: '项目描述不能超过250个字符' }],
                  })(<TextArea rows={5} placeholder='项目描述' />)
                }
              </Form.Item>
              <div className='label'></div>
              <Form.Item>
                <Button
                  type='primary'
                  htmlType='submit'
                  disabled={saving || hasErrors(getFieldsError()) || hasNoChange(getFieldsValue(), project)}
                >
                  <Icon type={saving ? 'sync' : 'save'} spin={saving} />
                  保存
                </Button>
              </Form.Item>
            </Col>
            <Col span={6} offset={4}>
              <Form.Item>
                {
                  getFieldDecorator('avatar', {
                    initialValue: avatar
                  })(
                    <AvatarUpload>
                      <ProjectAvatar size={100} antiCache project={project} />
                    </AvatarUpload>
                  )
                }
              </Form.Item>
            </Col>
          </Row>

          <div className='divider' />

        </Form>
        <label className='head'>项目管理员</label>
      </div >

    );
  }
}

export default OverviewSetting;
