import React, { Component } from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import LoadingBar from 'react-top-loading-bar';
import TopBar from './TopBar';
import SideBar from './SideBar';
import Workspace from './Workspace';
import { inject, observer } from 'mobx-react';
import utility from '../../utility';

import SignIn from '../../main/SignIn';
import PrivateRoute from '../../components/PrivateRoute';
import { initInterceptors } from '../../services/axiosConfig';
import DevErrorModal from '../common/DevErrorModal';
import UiStateKeys from '../../stores/UiStateKeys';
// import BuildInfoClient from '../../services/api/BuildInfoClient';
import { injectIntl, FormattedMessage } from 'react-intl';

import moment from 'moment';
import 'moment/locale/zh-cn';
import zhCN from 'antd/es/locale/zh_CN';
import enUS from 'antd/es/locale/en_US';
import { IntlProvider } from 'react-intl';
import zh from '../../locales/zh-CN.json';
import en from '../../locales/en-US.json';

import './style.less';

const { Sider, Header, Content } = Layout;
const bgColor = 'white';
const workspaceBgColor = '#f8f8f8';

@inject('appStore')
@observer
class AppWrapper extends Component {
  render() {
    let { appStore } = this.props;
    let { uiStateStore: { preffered_language } } = appStore;
    let intlLocale, intlMsgs, antdLocale;
    if (preffered_language === 'zhCN') {
      intlLocale = 'zh';
      intlMsgs = zh;
      antdLocale = zhCN;
      moment.locale('zh-cn');
    } else if (preffered_language === 'enUS') {
      intlLocale = 'en';
      intlMsgs = en;;
      antdLocale = enUS;
      moment.locale();
    }
    return (
      <IntlProvider locale={intlLocale} messages={intlMsgs} >
        <ConfigProvider locale={antdLocale}>
          <App />
        </ConfigProvider>
      </IntlProvider>
    )
  }
}

@injectIntl
@withRouter
@inject('appStore')
@observer
class App extends Component {
  state = {
    buildInfo: undefined
  };

  constructor(props) {
    super(props);
    let { appStore, history } = props;
    initInterceptors(appStore, history);
  }

  async componentDidMount() {
    let { appStore } = this.props;
    let { uiStateStore } = appStore;
    uiStateStore.loadUiState();
    await appStore.signInWithToken();
    // var buildInfo = await BuildInfoClient.getAll();
    // this.setState({ buildInfo });
  }

  onCollapse = collapsed => {
    let { appStore: { uiStateStore } } = this.props;
    uiStateStore.setUiState(UiStateKeys.SIDER_COLLAPSED, collapsed);
  };

  render() {
    let { appStore, intl } = this.props;

    const items1 = [
      { title: intl.formatMessage({ id: "menu_home" }), key: 'Home', type: 'home', path: '/home' },
      { title: intl.formatMessage({ id: "menu_projects" }), key: 'Projects', type: 'project', path: '/projects' },
      { title: intl.formatMessage({ id: "menu_settings" }), key: 'Settings', type: 'setting', path: '/settings' },

      // { title: '帮助', key: '/help', type: 'question-circle', path: '/help' }
    ];

    const items2 = [
      { title: intl.formatMessage({ id: "menu_overview" }), key: 'ProjectOverview', type: 'layout', path: '/overview' },
      { title: intl.formatMessage({ id: "menu_work_items" }), key: 'ProjectWorkItems', type: 'file-done', path: '/workitems', disabled: true },
      { title: intl.formatMessage({ id: "menu_backlogs" }), key: 'ProjectBacklogs', type: 'pushpin', path: '/teams/_default/backlogs' },
      { title: intl.formatMessage({ id: "menu_iterations" }), key: 'ProjectIterations', type: 'flag', path: '/teams/_default/iterations/_current' },
      { title: intl.formatMessage({ id: "menu_settings" }), key: 'ProjectsSettings', type: 'setting', path: '/settings' },
    ];

    let { me, uiStateStore } = appStore;
    // 须在render={()=>{...}}所包含的lambda表达式之外使用
    let collapsed = uiStateStore[UiStateKeys.SIDER_COLLAPSED];
    let { buildInfo } = this.state;
    return (
      <div>
        {
          <Switch>
            <Route exact path='/sign_in' component={SignIn} />
            <PrivateRoute me={me} render={() =>
              <Layout style={{ minHeight: '100vh' }}>
                <Header style={{ background: bgColor, padding: '0 16px', width: '100%' }}>
                  <TopBar />
                  <LoadingBar className='loading-bar' height={2} color='#1890ff' onRef={ref => (utility.initLoadingBar(ref))} />
                </Header>
                <Layout>
                  <div style={{ background: bgColor, borderRight: '1px solid #eee' }}>
                    <Sider collapsible
                      collapsed={collapsed}
                      onCollapse={this.onCollapse}
                      style={{ background: bgColor }}
                    >
                      <Switch>
                        <Route path='/projects/:id(\d+)' render={({ match, ...rest }) =>
                          <SideBar {...rest}
                            items={items2}
                            projectId={parseInt(match.params.id)}
                            openKeys={uiStateStore.sider_project_menu_keys}
                            onOpenChange={(openKeys) => {
                              uiStateStore.setUiState(UiStateKeys.SIDER_PROJECT_MENU_KEYS, [...new Set(openKeys)]);
                              this.forceUpdate();
                            }}
                          />}
                        />
                        <Route path='/' render={props =>
                          <SideBar {...props}
                            items={items1}
                            buildInfo={buildInfo}
                            openKeys={uiStateStore.sider_menu_keys}
                            onOpenChange={(openKeys) => {
                              uiStateStore.setUiState(UiStateKeys.SIDER_MENU_KEYS, [...new Set(openKeys)]);
                              this.forceUpdate();
                            }}
                          />}
                        />
                      </Switch>
                    </Sider>
                  </div>
                  <Content style={{ background: workspaceBgColor, display: 'flex' }}>
                    <Switch>
                      <Route path='/projects/:id(\d+)' render={({ match, ...rest }) =>
                        <Workspace {...rest} projectId={parseInt(match.params.id)} />} />
                      <Route path='/' component={Workspace} />
                    </Switch>
                  </Content>
                </Layout>
              </Layout>
            } />
          </Switch>
        }
        <DevErrorModal error={appStore.error} />
      </div >
    );
  }
}

export default App;
export { AppWrapper };
