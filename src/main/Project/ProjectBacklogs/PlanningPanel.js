/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Icon } from 'antd';
import { autorun } from 'mobx';
import _ from 'lodash';
import IterationBox from './IterationBox';

@inject('appStore')
@observer
class PlanningPanel extends Component {
  state = {
    countMap: null,
    loading: '*'
  }

  componentDidMount() {
    let { appStore } = this.props;
    this.distructor = autorun(async () => {
      let {
        analysisStore,
        project,
        pageName
      } = appStore;
      if (pageName !== 'ProjectBacklogs') return;
      if (!project) return;
      let { selectedTeam } = project;
      let { id: tid, cookedIterations } = selectedTeam;
      let iterIds = cookedIterations.filter(i => i.tag !== 'past').map(i => i.id);
      let counts = await Promise.all(iterIds.map(id => analysisStore.getCurrentStatus(tid, id)));
      this.setState({
        countMap: new Map(_.zip(iterIds, counts)),
        loading: []
      });
    });
  }

  componentWillUnmount() {
    this.distructor && this.distructor();
  }

  partialUpdate = async (id, options) => {
    const { appStore } = this.props;
    let { workItemStore } = appStore;

    await workItemStore.partialUpdateWorkItem(id, options);
  }

  updateIterationOfAll = async (workItems, iterationId) => {
    let { appStore, parent } = this.props;
    let { analysisStore, project } = appStore;
    let { selectedTeam: team } = project;
    let { countMap } = this.state;
    let wis = workItems.filter(wi => wi.iterationId !== iterationId);
    let wiIds = wis.map(wi => wi.id);
    wis.forEach(wi => wi.setLoading(true));
    parent.forceUpdate();
    let iterIds = [...new Set([
      iterationId,
      ...workItems.map(wi => wi.iterationId)
    ])].filter(id => countMap.has(id));
    if (wiIds.length === 0) return;
    this.setState({ loading: iterIds });
    await Promise.all(wiIds.map(id => this.partialUpdate(id, { iterationId })));
    let counts = await Promise.all(iterIds.map(id => analysisStore.getCurrentStatus(team.id, id)));
    let newCountMap = new Map(_.zip(iterIds, counts));
    for (let id of newCountMap.keys()) {
      countMap.set(id, newCountMap.get(id));
    }
    workItems.forEach(wi => wi.setLoading(false));
    this.setState({ loading: [] });
    parent.forceUpdate();
  }

  render() {
    const { appStore, toggle } = this.props;
    const { project } = appStore;
    if (!project) return null;
    let { selectedTeam } = project;
    let { cookedIterations, defaultIteration } = selectedTeam;
    let notPassed = cookedIterations.filter(i => i.tag !== 'past');
    let { countMap, loading } = this.state;
    return (
      <div className='planning-panel'>
        <div className='panel-top-bar'>
          <span className='panel-title'>
            {/* 规划面板 */}
          </span>
          <a className='close icon-btn' onClick={toggle}>
            <Icon type='close' className='icon-btn-icon' />
          </a>
        </div>
        <div className='box-list'>
          <div>
            <IterationBox
              team={selectedTeam}
              iteration={defaultIteration}
              onDrop={e => this.updateIterationOfAll(e.workItems, defaultIteration.id)}
            />
          </div>
          {
            notPassed.map(i => (
              <div key={i.id} style={{ marginTop: 16 }}>
                <IterationBox
                  iteration={i}
                  counts={countMap && countMap.get(i.id)}
                  onDrop={e => this.updateIterationOfAll(e.workItems, i.id)}
                  isLoading={loading === '*' || loading.includes(i.id)}
                />
              </div>
            ))
          }
        </div>
      </div>
    );
  }
}

export default PlanningPanel;
