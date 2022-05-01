import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { Layout } from 'antd';
import NavMenu from '../common/NavMenu';
import SystemSetting from './SystemSetting';
import ProfileSetting from './ProfileSetting';
import AccessTokenSetting from './AccessTokenSetting';
import ProjectsSetting from './ProjectsSetting';
import MembersSetting from './MembersSetting';
import IntegrationSetting from './IntegrationSetting';
import { inject, observer } from 'mobx-react';
import { injectIntl, FormattedMessage } from 'react-intl';
import './style.less'

const { Sider, Content } = Layout;
const bgColor = 'white';

@injectIntl
@inject('appStore')
@observer
class Settings extends Component {
  componentDidMount() {
    const { appStore } = this.props;
    appStore.setPageName('Settings');
  }

  render() {
    const { intl } = this.props;

    const items = [
      { title: intl.formatMessage({ id: "menu_system" }), key: 'SystemSetting', type: 'tool', path: '/system' },
      { title: intl.formatMessage({ id: "menu_my_profile" }), key: 'ProfileSetting', type: 'profile', path: '/profile' },
      { title: intl.formatMessage({ id: "manu_access_token" }), key: 'AccessTokenSetting', type: 'safety-certificate', path: '/accesstoken' },
      { title: intl.formatMessage({ id: "menu_projects" }), key: 'ProjectsSetting', type: 'project', path: '/projects' },
      { title: intl.formatMessage({ id: "menu_users" }), key: 'MembersSetting', type: 'user', path: '/members' },
      // { title: '集成', key: 'IntegrationSetting', type: 'deployment-unit', path: '/integration' }
    ]

    let base = '/settings';
    return (
      <div className='Setting'>
        <Layout>
          <div style={{ backgroundColor: bgColor, borderRight: '1px solid #eee' }}>
            <Sider style={{ background: '#eee' }}>
              <NavMenu base={base} items={items} mode={'vertical'} />
            </Sider>
          </div>
          <Content style={{ backgroundColor: bgColor }}>
            <div className='auto-scroll'>
              <Switch>
                <Redirect exact from={base} to={`${base}/system`} />
                <Route path={`${base}/system`} component={SystemSetting} />
                <Route path={`${base}/profile`} component={ProfileSetting} />
                <Route path={`${base}/accesstoken`} component={AccessTokenSetting} />
                <Route path={`${base}/projects`} component={ProjectsSetting} />
                <Route path={`${base}/members`} component={MembersSetting} />
                <Route path={`${base}/integration`} component={IntegrationSetting} />
              </Switch>
            </div>
          </Content>
        </Layout>
      </div>
    );
  }
}

export default Settings;
