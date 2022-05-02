import React, { Component } from 'react';
import { inject } from 'mobx-react';
import moment from 'moment';
import { Chart } from '@antv/g2';
import fromEntries from 'object.fromentries';
import { typeMap } from '../../../../components/WorkItemIcon';
import { injectIntl, FormattedMessage } from 'react-intl';

if (!Object.fromEntries) {
  fromEntries.shim();
}

const CHART_CONTAINER_ID = 'burndown-chart-container';

@injectIntl
@inject('appStore')
class BurndownChart extends Component {
  //charts的重绘依赖父组件给其分配一个新的key
  async componentDidMount() {
    let { appStore, intl } = this.props;
    let {
      analysisStore,
      teamConfigStore,
      project
    } = appStore;
    let { selectedTeam, selectedIteration } = project;
    let { startDate, endDate } = selectedIteration;
    let start = moment(startDate);
    let end = moment(endDate);
    let chart = this.drawChart(start, end);
    let view = this.drawView(chart);
    let { teamCapacityPerDay } = teamConfigStore;
    let trend = await analysisStore.getBurndownTrend(
      selectedTeam,
      selectedIteration,
      teamCapacityPerDay,
      intl
    );
    let {
      max,
      saturdays,
      sundays,
      burndownTrend,
      idealTrend,
      capacityTrend
    } = trend;
    let top = Math.max(max, capacityTrend[0].remainingHours);
    this.drawBurndownTrend(chart, burndownTrend, top);
    this.drawIdealAndCapacityTrend(view, idealTrend, capacityTrend);
    this.drawWeekendsAnnotation(chart, saturdays, sundays);
    chart.render();
  }

  drawWeekendsAnnotation(chart, saturdays, sundays) {
    for (let sat of saturdays) {
      chart.annotation().region({
        top: true,
        start: [moment(sat).add(-1, 'days').format('YYYY-M-D'), 0],
        end: [sat, 'max']
      });
    }

    for (let sun of sundays) {
      chart.annotation().region({
        top: true,
        offsetX: 1,
        start: [moment(sun).add(-1, 'days').format('YYYY-M-D'), 0],
        end: [sun, 'max']
      });
    }
  }

  drawView(chart) {
    let { intl } = this.props;

    const view = chart.createView();
    view.axis(false);

    view.scale({
      remainingHours: {
        nice: true,
        sync: true
      }
    });

    view
      .line()
      .position('date*remainingHours')
      .style('type', type => {
        if (type === 'remainingCapacity') return { lineDash: [4, 2] }
      })
      .color('typeName', typeName => {
        if (typeName === intl.formatMessage({ id: 'remaning_capacity' })) return 'rgb(82, 196, 26)';
        if (typeName === intl.formatMessage({ id: 'ideal_trend' })) return 'rgba(0, 0, 0, .6)';
      });
    return view;
  }

  drawChart(start, end) {
    let { intl } = this.props;

    const genColor = (typeName) => {
      const colorMap = Object.fromEntries(new Map(
        ['story', 'task', 'bug'].map(type => [
          intl.formatMessage({ id: typeMap[type].text }),
          typeMap[type].color
        ]
        )));
      return colorMap[typeName];
    }

    const chart = new Chart({
      container: CHART_CONTAINER_ID,
      autoFit: true,
      height: 350,
    });

    chart.tooltip({
      showCrosshairs: true,
      shared: true,
    });

    chart.scale('date', {
      tickCount: 1000
    });

    chart.axis('remainingHours', {
      title: {
        style: {
          fill: 'grey'
        },
      }
    });

    chart.axis('date', {
      label: {
        formatter: date => {
          let dt = moment(date);
          if (dt < start) return intl.formatMessage({ id: 'before' });
          if (dt > end) return intl.formatMessage({ id: 'after' });
          return dt.format('M-D')
        }
      }
    });

    chart
      .area()
      .adjust('stack')
      .position('date*remainingHours')
      .color('typeName', genColor);

    chart
      .line()
      .adjust('stack')
      .position('date*remainingHours')
      .color('typeName', genColor);

    chart.interaction('element-highlight');

    return chart;
  }

  drawIdealAndCapacityTrend(view, idealTrend, capacityTrend) {
    view.data([...idealTrend, ...capacityTrend]);
  }

  drawBurndownTrend(chart, burndownTrend, top) {
    let { intl } = this.props;
    chart.data(burndownTrend);
    chart.scale({
      remainingHours: {
        nice: true,
        sync: true,
        alias: intl.formatMessage({ id: 'remaining_hours' }),
        max: top || 40
      }
    });
  }

  render() {
    let { width } = this.props;
    return (
      <div id={CHART_CONTAINER_ID}
        style={{
          width,
          height: width * .6
        }}
      />
    );
  }
}

export default BurndownChart;
