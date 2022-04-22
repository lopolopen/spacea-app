import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { inject } from 'mobx-react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import Home from '../../Home';
import Projects from '../../Projects';
import Settings from '../../Settings';

import ProjectOverview from '../../Project/ProjectOverview';
import ProjectWorkItems from '../../Project/ProjectWorkItems';
import ProjectBacklogs from '../../Project/ProjectBacklogs';
import ProjectIterations from '../../Project/ProjectIterations';
import ProjectSettings from '../../Project/ProjectSettings';

import WorkItemDragLayer from '../../common/WorkItemDragLayer';
import UiStateKeys from '../../../stores/UiStateKeys';
import './style.less';

@inject('appStore')
class Workspace extends Component {
  state = {
    projectId: undefined
  };

  static getDerivedStateFromProps(props, state) {
    if (props.projectId === state.projectId) return null;
    return {
      projectId: props.projectId
    };
  }

  async componentDidMount() {
    const { appStore, projectId } = this.props;
    await Promise.all([
      appStore.loadProject(projectId),
    ]);
    this.rememberProject();
  }

  shouldComponentUpdate(nextProps) {
    return this.props.projectId !== nextProps.projectId;
  }

  async componentDidUpdate() {
    const { appStore, projectId } = this.props;
    await appStore.loadProject(projectId);
    this.rememberProject();
  }

  rememberProject() {
    const { appStore } = this.props;
    let { project, uiStateStore } = appStore;
    if (!project) return;
    let latestProjs = uiStateStore.latest_accessed_projects;
    latestProjs = latestProjs.filter(p => p.id !== project.id);
    latestProjs = [{
      id: project.id,
      name: project.name
    },
    ...latestProjs
    ].slice(0, 10);
    uiStateStore.setMyUiState(UiStateKeys.LATEST_ACCESSED_PROJECTS, latestProjs);
  }

  render() {
    // console.log(this.constructor.name, 'render()');
    let { projectId } = this.state;
    let base = `/projects/${projectId}`;
    return (
      <DndProvider backend={HTML5Backend}>
        <WorkItemDragLayer />
        <div className='Workspace'>
          {
            projectId
              ? (
                // 选中某个项目显示的菜单
                <Switch>
                  <Redirect exact from={`${base}/`} to={`${base}/overview`} />
                  <Route path={`${base}/overview`} component={ProjectOverview} />
                  <Route path={`${base}/workitems/:id(\\d+)`} component={({ match, ...rest }) =>
                    <ProjectWorkItems {...rest} projectId={projectId} workItemId={parseInt(match.params.id)} />} />
                  <Route path={`${base}/workitems`} component={ProjectWorkItems} />
                  <Route path={`${base}/teams/:teamid/backlogs`} component={({ match, ...rest }) =>
                    <ProjectBacklogs {...rest} teamId={match.params.teamid} />} />
                  <Route path={`${base}/teams/:teamid/iterations/:iterid`} component={({ match, ...rest }) =>
                    <ProjectIterations {...rest} teamId={match.params.teamid} iterationId={match.params.iterid} />} />
                  <Route path={`${base}/settings`} component={ProjectSettings} />
                </Switch>
              ) : (
                // 首页菜单
                <Switch>
                  <Redirect exact from='/' to='/projects' />
                  <Route path='/home' component={Home} />
                  <Route exact path='/projects' component={Projects} />
                  <Route path='/settings' component={Settings} />
                </Switch>
              )}
        </div>
      </DndProvider>);
  }
}

export default Workspace;
