import React, { Component } from 'react';
import { inject } from 'mobx-react';
import { Link } from 'react-router-dom'
import { Avatar, Divider } from 'antd';
import { Chart } from '@antv/g2';
import MemberAvatar from '../../../../components/MemberAvatar';
import utility from '../../../../utility';
import { injectIntl, FormattedMessage } from 'react-intl';

const CHART_CONT_ID_PREFIX = 'workload-chart-container';

// const eazy = x => x * 0.5;
// const heavy = x => x * 1;

@injectIntl
@inject('appStore')
class WorkloadCharts extends Component {

  state = { workload: undefined };

  async componentDidMount() {
    let { appStore } = this.props;
    let {
      analysisStore,
      project
    } = appStore;
    let { selectedTeam, selectedIteration } = project;
    let workloads = await analysisStore.getWorkloads(selectedTeam.id, selectedIteration.id);
    this.setState({ workloads });
  }

  render() {
    let { workloads } = this.state;
    let { appStore, intl } = this.props;
    let {
      teamConfigStore,
      project
    } = appStore;
    let { currentCapacities } = teamConfigStore;
    let { selectedTeam, selectedIteration } = project;
    let base = `/projects/${project.id}`;
    if (!currentCapacities || currentCapacities.length === 0) {
      return (
        <div style={{ margin: '20px 8px' }}>
          < div style={{ fontSize: 20, padding: 32 }}>
            <div><FormattedMessage id='tips_capacity_not_set' /></div>
            <Link to={`${base}/settings/teams/${selectedTeam.id}/config#capacity`}
              onClick={() => {
                teamConfigStore.setCurrentIteration(selectedIteration)
              }}
            >
              <FormattedMessage id='tips_jump_to_set' />
            </Link>
          </div>
        </div>
      );
    }

    if (!workloads) return null;
    let {
      teamWorkload,
      memberWorkloads,
      upperBound
    } = workloads;

    let { name } = selectedTeam;
    let color = utility.hashColor(name);
    return (
      <div style={{ margin: '20px 8px' }}>
        <div style={{ marginBottom: 4 }}>
          <Avatar style={{ backgroundColor: color, marginRight: '4px' }}
            title={name} size='small'>
            {name[0]}
          </Avatar>
          <span>{name}</span>
          <span>{`（${teamWorkload.assignedCapacity}/${teamWorkload.capacity} ${intl.formatMessage({ id: 'hours' })}）`}</span>
        </div>
        <WorkloadChart type='by-team' workload={teamWorkload} />
        <Divider />
        {
          memberWorkloads.map(wl => {
            let assignee = selectedTeam.members.find(m => m.id === wl.ownerId);
            return (
              <div key={wl.ownerId} style={{ marginTop: 20 }}>
                <div style={{ marginBottom: 4 }}>
                  <MemberAvatar size='small' labeled member={assignee} textFunc={id => intl.formatMessage({ id })} />
                  <span>
                    {
                      wl.ownerId ?
                        `（${wl.assignedCapacity}/${wl.capacity} ${intl.formatMessage({ id: 'hours' })}）`
                        :
                        `（${wl.assignedCapacity} ${intl.formatMessage({ id: 'hours' })}）`
                    }
                  </span>
                </div>
                {
                  wl.ownerId ?
                    <WorkloadChart type='by-member' workload={wl} upperBound={upperBound} />
                    :
                    null
                }
              </div>);
          })
        }
      </div>
    );
  }
}

class WorkloadChart extends Component {
  componentDidMount() {
    let { workload } = this.props;
    let chart = this.drawChart();
    this.drawWorkload(chart, workload);
    chart.render();
  }

  getContainerId() {
    let { type, workload: { ownerId } } = this.props;
    return `${CHART_CONT_ID_PREFIX}-${type}-${ownerId}`;
  }

  drawChart() {
    const chart = new Chart({
      container: this.getContainerId(),
      autoFit: true,
      height: 24,
      region: {
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 }
      }
    });
    chart.legend(false);
    chart.tooltip(false);
    return chart;
  }

  drawWorkload(chart, workload) {
    let { assignedCapacity, capacity } = workload;
    let curMax = Math.max(assignedCapacity, capacity);
    chart.scale({
      capacity: {
        nice: false,
        min: 0,
        max: curMax
      },
      assignedCapacity: {
        nice: false,
        min: 0,
        max: curMax
      }
    });
    chart.coordinate().transpose();
    chart.axis('capacity', false);
    chart.axis('assignedCapacity', false);

    chart.point()
      .position('*capacity')
      .color('rgba(0, 0, 0, .9)')
      .shape('line')
      .size(30)
      .style({
        lineWidth: capacity === curMax ? 6 : 4
      });

    chart.interval()
      .position('*assignedCapacity')
      .color(assignedCapacity > capacity ? 'rgba(255, 0, 0, .75)' : 'rgba(0, 0, 0, .75)')
      .size(10);

    chart.annotation().region({
      start: ['start', 0],
      end: ['end', capacity],
      style: {
        fill: '#A7E8B4',
        fillOpacity: .9
      }
    });

    if (assignedCapacity > capacity) {
      chart.annotation().region({
        start: ['start', capacity],
        end: ['end', curMax],
        style: {
          fill: '#FFA39E',
          fillOpacity: .85
        }
      });
    }

    chart.data([{
      capacity,
      assignedCapacity
    }]);
  }

  render() {
    let {
      upperBound: up,
      workload: wl
    } = this.props;
    up = up || wl;
    //上界值
    let upperMax = Math.max(up.assignedCapacity || 0, up.capacity || 0);
    //成员值
    let memberMax = Math.max(wl.assignedCapacity || 0, wl.capacity || 0);
    return (
      <div style={{ width: `${memberMax / upperMax * 100}%` }}>
        <div id={this.getContainerId()} />
      </div>
    );
  }
}

export default WorkloadCharts;
