import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { Layout } from 'antd';
import NavMenu from '../../common/NavMenu';
import OverviewSetting from './OverviewSetting';
import TeamsSetting from './TeamsSetting';
import TeamConfig from './TeamConfig';
import ProjectConfig from './ProjectConfig';
import ReposSetting from './ReposSetting';
import { inject, observer } from 'mobx-react';
import './style.less'

const { Sider, Content } = Layout;
const bgColor = 'white';

@inject('appStore')
@observer
class ProjectsSettings extends Component {
  componentDidMount() {
    this.props.appStore.setPageName('ProjectsSettings');
  }

  render() {
    const { project } = this.props.appStore;
    if (!project || !project.id) return null;
    let { selectedTeamId: teamId } = project;
    const items = [
      { title: '概要', key: 'OverviewSetting', type: 'layout', path: '/overview' },
      { title: '团队', key: 'TeamsSetting', type: 'team', path: '/teams' },
      { key: 'divider1', __: '__' },
      // { title: '迭代', key: 'sprints', type: 'sync', path: '/sprints' },
      // { title: '文件夹', key: 'FoldersSetting', type: 'folder', path: '/folders' },
      { title: '项目配置', key: 'ProjectConfig', path: '/config' },
      { title: '团队配置', key: 'TeamConfig', path: `/teams/${teamId}/config` },
      { key: 'divider2', __: '__' },
      // { title: '代码仓库', key: 'ReposSetting', type: 'gitlab', path: '/repos' },
      // { title: '工作流', key: 'WorkflowSetting', type: 'retweet', path: '/workflow' },
      // { title: '生产力', key: 'ProductivitySetting', type: 'history', path: '/productivity' },
    ]
    let base = `/projects/${project.id}/settings`;
    return (
      <div className='ProjectsSettings'>
        <Layout>
          <div style={{ background: bgColor, borderRight: '1px solid #eee' }}>
            <Sider style={{ background: '#eee' }}>
              <NavMenu base={base} items={items} mode={'vertical'} />
            </Sider>
          </div>
          <Content style={{ background: bgColor }}>
            <div className='auto-scroll'>
              <Switch>
                <Redirect exact path={base} to={`${base}/overview`} />
                <Route path={`${base}/overview`} component={OverviewSetting} />
                <Route exact path={`${base}/teams`} component={TeamsSetting} />
                <Route path={`${base}/teams/:id(\\d+)/config`} render={({ match, ...rest }) =>
                  <TeamConfig {...rest} teamId={parseInt(match.params.id)} />} />
                <Route path={`${base}/config`} component={ProjectConfig} />
                <Route path={`${base}/repos`} component={ReposSetting} />
                <Route path={`${base}/workflow`} component={null} />
              </Switch>
            </div>
          </Content>
        </Layout>
      </div>)
  }
}

export default ProjectsSettings;
