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
import './style.less'

const { Sider, Content } = Layout;

const items = [
  { title: '系统', key: 'SystemSetting', type: 'tool', path: '/system' },
  { title: '用户信息', key: 'ProfileSetting', type: 'profile', path: '/profile' },
  { title: '访问令牌', key: 'AccessTokenSetting', type: 'safety-certificate', path: '/accesstoken' },
  { title: '项目管理', key: 'ProjectsSetting', type: 'project', path: '/projects' },
  { title: '用户管理', key: 'MembersSetting', type: 'user', path: '/members' },
  // { title: '集成', key: 'IntegrationSetting', type: 'deployment-unit', path: '/integration' }
]

const bgColor = 'white';

@inject('appStore')
@observer
class Settings extends Component {
  componentDidMount() {
    const { appStore } = this.props;
    appStore.setPageName('Settings');
  }

  render() {
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
