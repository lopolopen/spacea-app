/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Form, Icon, Input, Button, Checkbox, message } from 'antd';
import { inject, observer } from 'mobx-react';
import MemberAvatar from '../../components/MemberAvatar';
import { injectIntl, FormattedMessage } from 'react-intl';
import * as Setting from '../../setting';
import './style.less';

const LOCAL_STORAGE_ACCOUNT_NAME = 'account_name';

@injectIntl
@withRouter
@inject('appStore')
@observer
class SignInForm extends React.Component {
  state = {
    validateStatus: undefined,
    help: undefined
  }

  handleAccountNameOrPasswordChange = e => {
    if (e.target.value !== '') {
      this.setState({
        validateStatus: undefined,
        help: undefined
      });
    }

  }

  handleSubmit = e => {
    e.preventDefault();
    let { appStore, form, intl, location: { state }, history } = this.props;
    form.validateFields(async (err, { accountName, password, rememberMe }) => {
      if (err) return;
      try {
        await appStore.signIn({
          accountName,
          password
        });
        if (rememberMe) {
          localStorage.setItem(LOCAL_STORAGE_ACCOUNT_NAME, accountName);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_ACCOUNT_NAME);
        }
        if (state) {
          let { from } = state;
          //debugger
          history.push(from.pathname + from.hash);
        } else {
          history.push('/');
        }
      } catch (err) {
        if (err.response && err.response.status === 403) {
          this.setState({
            validateStatus: 'error',
            help: intl.formatMessage({ id: "tips_account_or_pwd_wrong" })
          });
        } else {
          message.error(intl.formatMessage({ id: "msg_fail_to_sign_in" }));
        }
      }
    });
  };

  renderProviderLogo(provider, application, width, margin) {
    if (provider.category === "OAuth") {
      return (
        <a key={provider.displayName} href={Setting.getAuthUrl(application, provider, "signup")}>
          <img width={width} height={width} src={Setting.getProviderLogoURL(provider)} alt={provider.displayName} style={{ margin: margin }} />
        </a>
      );
    }
  }

  render() {
    let { intl, form, appStore } = this.props;
    const { getFieldDecorator } = form;
    const { application } = appStore;
    let accountName = localStorage.getItem(LOCAL_STORAGE_ACCOUNT_NAME);
    let { validateStatus, help } = this.state;
    return (
      <div className='sign-in'>
        <Form onSubmit={this.handleSubmit} className='sign-in-form'>
          <Form.Item validateStatus={validateStatus}>
            {getFieldDecorator('accountName', {
              initialValue: accountName,
              rules: [{ required: true, message: intl.formatMessage({ id: "tips_account_miss" }) }],
            })(
              <Input
                onChange={this.handleAccountNameOrPasswordChange}
                prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder={intl.formatMessage({ id: "account_name" })}
              />,
            )}
          </Form.Item>
          <Form.Item validateStatus={validateStatus} help={help}>
            {getFieldDecorator('password', {
              rules: [{ required: true, message: intl.formatMessage({ id: "tips_pwd_miss" }) }],
            })(
              <Input.Password
                autoComplete='on'
                onChange={this.handleAccountNameOrPasswordChange}
                prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder={intl.formatMessage({ id: "password" })}
              />,
            )}
          </Form.Item>
          <Form.Item>
            {getFieldDecorator('rememberMe', {
              valuePropName: 'checked',
              initialValue: true,
            })(<Checkbox><FormattedMessage id='remember_me' /></Checkbox>)}

            <Button type="primary" htmlType="submit" className="sign-in-form-button">
              <FormattedMessage id='sign_in' />
            </Button>
          </Form.Item>
          {
            application &&
            application.providers &&
            <Form.Item>
              {
                application.providers.filter(p => p.canSignIn).map(p => {
                  return this.renderProviderLogo(p.provider, application, 30, 5)
                })
              }
            </Form.Item>
          }
        </Form>
      </div>
    );
  }
}

const WrappedSignInForm = Form.create({ name: 'sign_in_form' })(SignInForm);

@inject('appStore')
@observer
class SignIn extends Component {
  render() {
    let { appStore } = this.props;
    let { me } = appStore;
    return (
      <div className='SignIn'>
        {/* <div>
          <Icon type="global" />
        </div> */}

        <div className='left'>
          <div className='logo'>
            <img src={require('../../images/logo.png')} alt='' />
            <span>&nbsp;<FormattedMessage id="welcome_message" /></span>
          </div>
        </div>

        <div className='right'>
          {
            !me ?
              <WrappedSignInForm />
              :
              <div className='signed-in'>
                <MemberAvatar member={me} size={48} labeled />
                <div className='msg'>
                  <span><FormattedMessage id='tips_signed_in_head' /></span>
                  <a onClick={() => appStore.signOut()}>
                    <Icon style={{ color: 'red', margin: '0 4px' }} type="logout" />
                  </a>
                  <span><FormattedMessage id='tips_signed_in_body' /></span>
                  <Link to='/'>
                    <Icon style={{ margin: '0 4px' }} type="login" />
                  </Link>
                  <span><FormattedMessage id='tips_signed_in_tail' /></span>
                </div>
              </div>
          }
        </div>
      </div>
    );
  }
}

export default SignIn;
