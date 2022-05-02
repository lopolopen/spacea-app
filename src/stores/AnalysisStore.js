import { observable, action } from 'mobx';
import moment from 'moment';
import _ from 'lodash';
import AnalysisClient from '../services/api/AnalysisClient';
import { typeMap } from '../components/WorkItemIcon';
import utility from '../utility';

class BurndownRecord {
  type;
  typeName;
  date;
  remainingHours;

  constructor(options) {
    this.type = options.workItemType;
    this.typeName = options.typeName;
    this.date = moment(options.accountingDate).format('YYYY-M-D');
    this.remainingHours = options.remainingHours;
  }
}

class AnalysisStore {
  appStore;
  @observable refreshKey = '';

  constructor(appStore) {
    this.appStore = appStore;
  }

  @action
  refreshPanel() {
    this.refreshKey = _.uniqueId();
  }

  calcCapacityTrend(start, end, dates, capacityPerDay, intl) {
    let workdays = utility.workdaysBetween(start, end);
    let trend = [];
    for (let i = 0, j = 0; i < dates.length; i++) {
      if (i !== 0) {
        let day = dates[i].day();
        if (day !== 6 && day !== 0) j++;
      }
      trend.push({
        type: 'remainingCapacity',
        typeName: intl.formatMessage({ id: 'remaning_capacity' }),
        date: dates[i].format('YYYY-M-D'),
        remainingHours: (workdays - j) * capacityPerDay
      });
    }
    return trend;
  }

  calcIdealTrend(start, end, dates, init, intl) {
    let workdays = utility.workdaysBetween(start, end);
    let trend = [];
    for (let i = 0, j = 0; i < dates.length; i++) {
      //最初值一定是init
      if (i !== 0) {
        let day = dates[i].day();
        if (day !== 6 && day !== 0) j++;
      }
      trend.push({
        type: 'idealTrend',
        typeName: intl.formatMessage({ id: 'ideal_trend' }),
        date: dates[i].format('YYYY-M-D'),
        remainingHours: parseFloat((init - init * j / workdays).toFixed(1))
      });

    }
    return trend;
  }

  calcMax(trend) {
    let tasks = trend.filter(x => x.type === 'task');
    let bugs = trend.filter(x => x.type === 'bug');
    let sumArr = _.zipWith(tasks, bugs, (t, b) => {
      if (t.date !== b.date) throw new Error('dates not match');
      return (t.remainingHours || 0) + (b.remainingHours || 0);
    });
    return _.max(sumArr);
  }

  async getCurrentStatus(teamId, iterationId) {
    return await AnalysisClient.getCurrentPoints(teamId, iterationId);
  }

  async getBurndownTrend(team, iteration, capacityPerDay, intl) {
    let teamId = team.id;
    let iterationId = iteration.id;
    let { startDate, endDate } = iteration;
    let start = moment(startDate);
    let end = moment(endDate);
    let today = moment().startOf('day');
    let yesterday = today.clone().add(-1, 'days');
    let theDayBefore = start.clone().add(-1, 'days');
    let theDayAfter = end.clone().add(1, 'days');

    let recordObjs = await AnalysisClient.getBurndownTrend(teamId, iterationId);
    let latestDate = moment(_.max(recordObjs.map(r => r.accountingDate)));
    let pointObjs = await AnalysisClient.getCurrentPoints(teamId, iterationId);
    if (today >= start) {
      //当已存档的最后日期为“前天”时（即daily job跑完之前），修正“凌晨真空期” #50830
      //daily job可能由于某种原因没有触发或执行失败，导致“今天”的数据一直没生成，所以需要给修正逻辑一个最后期限
      if (today.diff(latestDate, 'days') === 2 && moment().hour() < 6) {
        pointObjs.forEach(p => p.accountingDate = yesterday.format('YYYY-M-D'));
        today = yesterday;
      }
    } else {
      today = theDayBefore;
    }
    let records = [...recordObjs, ...pointObjs].map(r => new BurndownRecord(r));
    let map = new Map(records.map(r => [
      //开始之前的数据作为开始前一天来计算
      `${r.type}-${moment(r.date) < theDayBefore ? theDayBefore.format('YYYY-M-D') : r.date}`,
      r.remainingHours
    ]));
    //顺序决定燃尽图中task和bug的上下关系
    let types = ['bug', 'task'];

    //迭代周期+“之前”一天
    let dates = _.range(end.diff(start, 'days') + 2)
      .map(i => start.clone().add(i - 1, 'days'));
    let saturdays = dates
      .filter(date => date.day() === 6)
      .map(date => date.format('YYYY-M-D'));
    let sundays =
      dates.filter(date => date.day() === 0)
        .map(date => date.format('YYYY-M-D'));
    let burndownTrend = dates.concat(today > end ? [today] : [])
      .map(date => date.format('YYYY-M-D'))
      .flatMap(accountingDate => types.map(type => new BurndownRecord({
        workItemType: type,
        typeName: intl.formatMessage({ id: typeMap[type].text }),
        accountingDate,
        remainingHours: undefined
      })));
    for (let r of burndownTrend) {
      let remainingHours = map.get(`${r.type}-${r.date}`);
      let date = moment(r.date);
      if (date <= today) {
        r.remainingHours = remainingHours || 0;
      }
      if (date > end) {
        r.date = theDayAfter.format('YYYY-M-D');
      }
      // //开始前一天的工作量作为初始值（来计算理想趋势）
      // if (start.diff(date, 'days') === 1) {
      //   init += (r.remainingHours || 0);
      // }
    }
    //最大工作量作为初始值（来计算理想趋势）
    let max = this.calcMax(burndownTrend);
    let idealTrend = this.calcIdealTrend(start, end, dates, max, intl);
    let capacityTrend = this.calcCapacityTrend(start, end, dates, capacityPerDay, intl);
    if (today > end) {
      idealTrend.push({
        type: 'idealTrend',
        typeName: intl.formatMessage({ id: 'ideal_trend' }),
        date: theDayAfter.format('YYYY-M-D'),
        remainingHours: 0
      });
      capacityTrend.push({
        type: 'remainingCapacity',
        typeName: intl.formatMessage({ id: 'remaning_capacity' }),
        date: theDayAfter.format('YYYY-M-D'),
        remainingHours: 0
      });
    }
    return ({
      max,
      saturdays,
      sundays,
      burndownTrend,
      idealTrend,
      capacityTrend
    });
  }

  async getWorkloads(teamId, iterationId) {
    let { project } = this.appStore;
    let { selectedIteration: { remainingDays } } = project;
    let workloads = await AnalysisClient.getWorkloads(teamId, iterationId, remainingDays);
    let { memberWorkloads } = workloads;
    let assignedCapaacities = memberWorkloads.map(wl => wl.assignedCapacity);
    let capacities = memberWorkloads.map(wl => wl.capacity);
    return {
      ...workloads,
      upperBound: {
        assignedCapacity: Math.max(...assignedCapaacities, 0),
        capacity: Math.max(...capacities, 0)
      }
    };
  }

  async runAccountingJob(teamId, iterationId) {
    await AnalysisClient.runAccountingJob(teamId, iterationId);
  }
}

export default AnalysisStore;
