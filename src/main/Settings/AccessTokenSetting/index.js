import React, { Component } from 'react';
import { Row, Col, Input, Button, Form, message } from 'antd';
import { inject, observer } from 'mobx-react';
import ConfigKeys from '../../../stores/ConfigKeys';
import './style.less';

const fieldKeyMap = {
  accessToken: ConfigKeys.ACCESS_TOKEN
};

function hasErrors(fieldsError) {
  return Object.keys(fieldsError).some(field => fieldsError[field]);
}

function hasNoChange(fieldsValue, config) {
  if (!config) return true;
  return Object.keys(fieldsValue).every(field => fieldsValue[field] === config[fieldKeyMap[field]]);
}

@Form.create({ name: 'access_token_setting' })
@inject('appStore')
@observer
class AccessTokenSetting extends Component {

  async componentDidMount() {
    this.props.appStore.setSubName('AccessTokenSetting');
    let { appStore } = this.props;
    await appStore.loadConfig([ConfigKeys.ACCESS_TOKEN]);
  }

  handleSubmitGitLabAccessToken = e => {
    e.preventDefault();
    const { appStore,form } = this.props;
    form.validateFields(async (err, { accessToken }) => {
      if (err) return;
      await appStore.saveConfig({
        [ConfigKeys.ACCESS_TOKEN]: accessToken
      });
      message.success(`访问令牌保存成功`);
    });
  };

  render() {
    const {
      getFieldDecorator,
      getFieldsError,
      getFieldsValue,
    } = this.props.form;
    let { me, config } = this.props.appStore;
    let { firstName, lastName,  } = me;
    if (!config) return null;
    return (
      <div className='ProfileSetting'>
        {/* <Form onSubmit={this.handleSubmitGitLabAccessToken}>
          <Row>
            <Col span={8}>
              <label>个人访问令牌</label>
              <Form.Item>
                {
                  getFieldDecorator('accessToken', {
                    initialValue: '',
                    rules: []
                  })(<Input placeholder={`${firstName} ${lastName}的个人访问令牌`} />)
                }
              </Form.Item>
              <Form.Item>
                <Button type='primary' htmlType='submit' disabled={hasErrors(getFieldsError()) || hasNoChange(getFieldsValue(), config)}>
                  保存
                </Button>
              </Form.Item>
            </Col>
          </Row>

          <div className='divider' />
        </Form> */}

        {/* TODO: not safe */}
        <Form onSubmit={this.handleSubmitGitLabAccessToken}>
          <Row>
            <Col span={8}>
              <label>GitLab 访问令牌</label>
              <Form.Item>
                {
                  getFieldDecorator('accessToken', {
                    initialValue: config[ConfigKeys.ACCESS_TOKEN],
                    rules: []
                  })(<Input placeholder={`${firstName} ${lastName}的GitLab访问令牌`} />)
                }
              </Form.Item>
              <Form.Item>
                <Button type='primary' htmlType='submit' disabled={hasErrors(getFieldsError()) || hasNoChange(getFieldsValue(), config)}>
                  保存
                </Button>
              </Form.Item>
            </Col>
          </Row>

          <div className='divider' />
        </Form>

      </div>
    );
  }
}

export default AccessTokenSetting;
