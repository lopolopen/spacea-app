import { observable, action, runInAction } from 'mobx';
import moment from 'moment';
import BraftEditor from 'braft-editor';
import { stateMap } from '../components/StateBadge';
import { priorityMap } from '../components/PriorityTag';
import { getFullName } from '../components/MemberAvatar';
import { typeMap } from '../components/WorkItemIcon';
import WorkItemClient from '../services/api/WorkItemClient';

function htmlTransfer(value) {
  let html = BraftEditor.createEditorState(value).toHTML();
  if (html === '<p></p>') return '';
  return html;
}

const fieldMap = {
  title: { label: '标题' },
  state: {
    label: '状态',
    transfer: (value, { type }) => {
      if (!value) return ''; 
      let state = stateMap[type][value] || stateMap[`${type}_obsolete`][value];
      return state.text
    }
  },
  reason: { label: '原因' },
  assigneeId: {
    label: '分配人',
    transfer: (value, { appStore }) => {
      if (!value) return '未分配';
      let { members } = appStore;
      let assignee = members.find(m => m.id === value);
      if (!assignee) return '[已删除人员]';
      return getFullName(assignee);
    }
  },
  priority: {
    label: '优先级',
    transfer: (value) => {
      if (!value) return '';
      return priorityMap[value].text;
    }
  },
  folderId: {
    label: '文件夹',
    transfer: (value, { appStore }) => {
      if (!value) return '';
      let { project: { folders } } = appStore;
      let folder = folders.find(f => f.id === value);
      if (!folder) return '[已删除文件夹]';
      return folder.path;
    }
  },
  iterationId: {
    label: '迭代',
    transfer: (value, { appStore }) => {
      if (!value) return '';
      let { project: { iterations } } = appStore;
      let iteration = iterations.find(i => i.id === value);
      if (!iteration) return '[已删除迭代]';
      return iteration.path;
    }
  },
  estimatedHours: { label: '预估工时' },
  remainingHours: { label: '剩余工时' },
  completedHours: { label: '完成工时' },
  environment: { label: '环境' },
  severity: {
    label: '严重级别',
    transfer: (value) => {
      if (!value) return '';
      let severityMap = {
        low: '低',
        medium: '中',
        high: '高',
        critical: '严重',
        blocker: '阻塞',
      };
      return severityMap[value];
    }
  },
  reproSteps: {
    label: '重现步骤',
    transfer: htmlTransfer,
    isHtml: true
  },
  description: {
    label: '描述',
    transfer: htmlTransfer,
    isHtml: true
  },
  acceptCriteria: {
    label: '验收标准',
    transfer: htmlTransfer,
    isHtml: true
  }
};


class HistoryStore {
  appStore;
  @observable groupedDiffs; //by date

  constructor(appStore) {
    this.appStore = appStore;
  }

  async loadHistories(workItemId) {
    let workItemClient = new WorkItemClient(workItemId);
    let histories = await workItemClient.getHistories();
    // histories = histories.reverse();
    let diffs = histories.reduce((acc, curItem) => {
      let preItem;
      if (acc.length > 0) {
        preItem = acc[acc.length - 1].item;
      }
      acc.push(this.diff(preItem, curItem));
      return acc;
    }, []);
    let map = diffs.reduce((acc, x) => {
      let dateLabel, order;
      let changedDate = moment(x.item.changedDate);
      if (changedDate > moment().startOf('day')) {
        dateLabel = 'today';
        order = 1;
      } else if (changedDate > moment().subtract(1, 'days').startOf('day')) {
        dateLabel = 'yesterday';
        order = 2;
      } else if (changedDate > moment().subtract(2, 'days').startOf('day')) {
        dateLabel = 'tdby';
        order = 3;
      } else {
        dateLabel = 'older';
        order = 4;
      }
      let g = acc.get(dateLabel);
      if (!g) {
        g = {
          order,
          dateLabel,
          diffs: []
        };
        acc.set(dateLabel, g);
      }
      g.diffs.push(x);
      return acc;
    }, new Map());
    let groupedDiffs = [...map.values()];
    groupedDiffs.sort((x, y) => x.order - y.order);
    runInAction(() => {
      this.groupedDiffs = groupedDiffs;
    });
  }

  @action
  clearHistories() {
    this.groupedDiffs = null;
  }

  diff(oldItem, newItem) {
    oldItem = oldItem || { rev: -1 };
    if (oldItem.rev + 1 !== newItem.rev) {
      console.warn(`The histories of work item #${newItem.id} seem not serial.`);
    }
    let appStore = this.appStore;
    let { members } = this.appStore;
    let changer;
    if (newItem.changerId === 0) {
      changer = { id: 1, firstName: '?', lastName: '?', accountName: '?' };
    } else {
      changer = members.find(m => m.id === newItem.changerId);
    }
    let diffPoints = [];
    for (let field in fieldMap) {
      let transfer = fieldMap[field].transfer || (x => x === null || x === undefined ? '' : x.toString());
      if (oldItem[field] !== newItem[field]) {
        diffPoints.push({
          rev: newItem.rev,
          label: fieldMap[field].label,
          oldValue: transfer(oldItem[field], { ...newItem, appStore }),
          newValue: transfer(newItem[field], { ...newItem, appStore }),
          isHtml: fieldMap[field].isHtml
        });
      }
    }
    const n = 3;
    let title;
    let typeLabel = typeMap[newItem.type].text;
    if (newItem.rev === 0) {
      title = `新建了${typeLabel}`;
    } else {
      let diffFieldLabels = diffPoints.map(dp => dp.label);
      let lableLstStr = diffFieldLabels.slice(0, n).join('，');
      title = `更新了${typeLabel}的${lableLstStr}${diffFieldLabels.length > n ? '等字段' : ''}`;
    }
    return {
      rev: newItem.rev,
      item: newItem,
      changer,
      diffPoints,
      title
    }
  }
}

export default HistoryStore;
