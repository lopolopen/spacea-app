import React, { Component } from 'react';
import { Row, Col, Button, Form, message, Icon } from 'antd';
import { inject, observer } from 'mobx-react';
import MemberAvatar from '../../../components/MemberAvatar';
import AvatarUpload from '../../../components/AvatarUpload';
import NameInput from './NameInput';
import './style.less'

function hasErrors(fieldsError) {
  return Object.keys(fieldsError).some(field => fieldsError[field]);
}

function hasNoChange(fieldsValue, member) {
  return Object.keys(fieldsValue).every(field => {
    if (field === 'enName') {
      let enName = fieldsValue.enName;
      return enName.firstName === member.firstName && enName.lastName === member.lastName;
    }
    if (field === 'name') {
      let name = fieldsValue.name;
      return name.xing === member.xing && name.ming === member.ming;
    }
    if (field === 'avatar') {

      return fieldsValue.avatar.uid === member.avatarUid;
    }
    return fieldsValue[field] === member[field];
  });
}

@Form.create({ name: 'prifile_setting' })
@inject('appStore')
@observer
class ProfileSetting extends Component {
  state = {
    saving: false
  };

  async componentDidMount() {
    this.props.appStore.setSubName('ProfileSetting');
  }

  handleSubmit = e => {
    e.preventDefault();
    this.setState({ saving: true });
    const { appStore, form } = this.props;
    form.validateFields(async (err, { enName, name, avatar }) => {
      try {
        if (err) return;
        await appStore.updateMember({
          ...enName,
          ...name,
        }, avatar);
        message.success(`我的用户信息更新成功`);
        this.setState({ saving: false });
      } catch (error) {
        this.setState({ saving: false });
        throw error;
      }
    });
  }

  render() {
    const {
      getFieldDecorator,
      getFieldsError,
      getFieldsValue
    } = this.props.form;
    let { me } = this.props.appStore;
    let { accountName, avatar } = me;
    let { saving } = this.state;
    return (
      <div className='ProfileSetting'>
        <Form onSubmit={this.handleSubmit}>
          <label className='head'>用户信息</label>
          <Row>
            <Col span={4} style={{ minWidth: 240 }}>
              <div className='label'>用户ID</div>
              <div className='account-name'>{`@${accountName}`}</div>

              <div className='label'>英文名</div>
              <Form.Item>
                {
                  getFieldDecorator('enName', {
                    initialValue: {
                      firstName: me.firstName,
                      lastName: me.lastName
                    }
                  })(<NameInput en />)
                }
              </Form.Item>

              <div className='label'>中文名</div>
              <Form.Item>
                {
                  getFieldDecorator('name', {
                    initialValue: {
                      xing: me.xing,
                      ming: me.ming
                    }
                  })(<NameInput />)
                }
              </Form.Item>

              <div className='label'></div>
              <Form.Item>
                <Button
                  type='primary'
                  htmlType='submit'
                  disabled={hasErrors(getFieldsError()) || hasNoChange(getFieldsValue(), me)}
                >
                  <Icon type={saving ? 'sync' : 'save'} spin={saving} />
                  保存
                </Button>
              </Form.Item>
            </Col>
            <Col span={4} offset={4}>
              <Form.Item>
                {
                  getFieldDecorator('avatar', {
                    initialValue: avatar
                  })(
                    <AvatarUpload>
                      <MemberAvatar size={100} antiCache member={me} />
                    </AvatarUpload>
                  )
                }
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    );
  }
}

export default ProfileSetting;
