/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { Icon, Divider, Spin, Button, Popconfirm } from 'antd';
import { when } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import BurndownChart from './BurndownChart';
import WorkloadCharts from './WorkloadCharts';
import { FormattedMessage } from 'react-intl';

@inject('appStore')
@observer
class AnalysisPanel extends Component {
  state = { loading: true }

  componentDidMount() {
    let { appStore } = this.props;
    when(() => appStore.project,
      async () => {
        let {
          teamConfigStore,
          project
        } = appStore;
        let {
          selectedTeamId,
          selectedIteration,
          selectedIterationId
        } = project;
        if (selectedIteration && selectedIteration.workdays !== undefined) {
          await teamConfigStore.loadCapacities(selectedTeamId, selectedIterationId);
          // analysisStore.refreshPanel();
          this.setState({ loading: false });
        }
      });
  }

  render() {
    let { appStore, width, toggle } = this.props;
    let chartWidth = width - 24;
    let { project, analysisStore, me } = appStore;
    let { refreshKey } = analysisStore;
    let {
      selectedTeam,
      selectedIteration
    } = project;
    if (!selectedTeam || !selectedIteration) return null;
    let base = `/projects/${project.id}`;
    return (
      <div className='analysis-panel'>
        <div className='panel-top-bar'>
          <span className='panel-title'>
            {/* 分析面板 */}
          </span>
          <a className='close icon-btn' onClick={toggle}>
            <Icon type='close' className='icon-btn-icon' />
          </a>
        </div>
        {
          selectedIteration.workdays === undefined ?
            < div style={{ fontSize: 20, padding: 32 }}>
              <div><FormattedMessage id='tips_period_not_set' /></div>
              <Link to={`${base}/settings/teams/${selectedTeam.id}/config#iteration`}>
                <FormattedMessage id='tips_jump_to_set' />
              </Link>
            </div>
            :
            this.state.loading ?
              <div style={{ margin: '20px 8px' }}>
                <div style={{
                  width,
                  height: width * .6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Spin />
                </div>
              </div>
              :
              <div>
                <BurndownChart width={chartWidth} key={'burndown' + refreshKey} />
                <Divider />
                <WorkloadCharts width={chartWidth} key={'workload' + refreshKey} />
                {
                  me.id !== project.owner.id ? null :
                    <div>
                      <Divider />
                      <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
                        <Popconfirm
                          title={
                            <div style={{ width: 420 }}>
                              <p style={{ fontWeight: 'bold' }}><FormattedMessage id='tips_overwrite_confirm' /></p>
                              <p>
                                <span><FormattedMessage id='tips_overwrite_warning_head' /></span>
                                <span style={{ color: 'red' }}><FormattedMessage id='tips_overwrite_warning_body' /></span>
                                <span><FormattedMessage id='tips_overwrite_warning_tail' /></span>
                              </p>
                            </div>
                          }
                          placement='left'
                          onConfirm={async () => {
                            await analysisStore.runAccountingJob(selectedTeam.id, selectedIteration.id);
                            analysisStore.refreshPanel();
                          }}
                        >
                          <Button type='primary' style={{ margin: '0 12px 8px 0' }}>
                            <FormattedMessage id='btn_overwrite' />
                          </Button>
                        </Popconfirm>

                      </div>
                    </div>
                }
              </div>
        }
      </div>
    );
  }
}

export default AnalysisPanel;
