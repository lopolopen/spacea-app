import { observable, action, computed } from 'mobx';
import moment from 'moment';
import utility from '../utility';

class TreeNode {
  id;
  @observable name;
  @observable path;
  @observable path1;

  key;
  value;
  @observable title;

  constructor(options) {
    let {
      id,
      name,
      path
    } = options;
    if (id) this.id = id;
    if (name) { this.name = name; }
    if (path) this.path = path;

    this.key = id;
    this.value = id;
    this.title = name;
  }

  @action
  setName(name) {
    this.name = name;
    this.title = name;
  }

  static treelize(nodes) {
    let root = {};
    if (nodes) {
      let nodeMap = new Map(nodes.map(i => [i.path, i]));
      nodeMap.set('', root)
      nodes.forEach(n => {
        delete n.parent;
        delete n.children;
      });
      for (let n of nodes) {
        let parentPath = n.path.substr(0, n.path.lastIndexOf('/'));
        let current = nodeMap.get(n.path);
        let parent = nodeMap.get(parentPath);
        if (!parent) continue;
        current.parent = parent;
        let children = parent.children || [];
        parent.children = [...children, current];
      }
    }
    return root;
  }

  static sortTree(node) {
    if (!node) return;
    if (!node.children) return;
    //(y, x) ~ reverse
    node.children.sort((y, x) => {
      if (x.startDate) {
        if (y.startDate) {
          return new Date(x.startDate) - new Date(y.startDate);
        } else {
          return -1;
        }
      } else {
        if (y.startDate) {
          return 1;
        } else {
          return x.name < y.name ? -1 : 1;
        }
      }
    });
    for (let c of node.children) {
      TreeNode.sortTree(c)
    }
  }
}

class Iteration extends TreeNode {
  @observable startDate;
  @observable endDate;

  constructor({ startDate, endDate, ...restOptions }) {
    super(restOptions);
    if (startDate) this.startDate = startDate;
    if (endDate) this.endDate = endDate;
  }

  @computed get workdays() {
    if (!this.startDate || !this.endDate) return undefined;
    return utility.workdaysBetween(this.startDate, this.endDate);
  }

  @computed get remainingDays() {
    if (!this.startDate || !this.endDate) return undefined;
    let startOfTomorrow = moment().add(1, 'days').startOf('day');
    let start = moment(this.startDate);
    if (startOfTomorrow < start.startOf('day')) return this.workdays;
    let end = moment(this.endDate);
    if (startOfTomorrow > end.endOf('day')) return 0;
    return utility.workdaysBetween(startOfTomorrow, end);
  }

  static cook(iterations) {
    //BUG: tag exists
    if (!iterations || iterations.length === 0) return [];
    //优先以时间排序，时间不存在则以名称排序
    iterations = iterations.sort((x, y) => {
      if (x.startDate) {
        if (y.startDate) {
          return moment(x.startDate) - moment(y.startDate);
        } else {
          return -1;
        }
      } else {
        if (y.startDate) {
          return 1;
        } else {
          return x.name < y.name ? -1 : 1;
        }
      }
    });
    let today = moment().startOf('day');
    //标识current是否已出现
    let flag = false;
    let cur;
    let lst;
    for (let idx = 0; idx < iterations.length; idx++) {
      cur = iterations[idx];
      if (flag) {
        cur.tag = 'future';
        continue;
      }
      //startDate未定义则认为是无限期的未来
      if (!cur.startDate || moment(cur.startDate) > today) {
        if (lst && lst.tag === 'past') {
          lst.tag = 'current';
          cur.tag = 'future';
        }
        else {
          cur.tag = 'current';
        }
        flag = true;
        continue;
      }
      if (moment(cur.endDate) < today) {
        cur.tag = 'past';
      } else {
        cur.tag = 'current';
        flag = true;
      }
      lst = cur;
    }
    //若current一直未出现，则标记最后一项为current
    if (!flag) {
      cur.tag = 'current'
    }
    return iterations;
  }
}

class Folder extends TreeNode { }

export default TreeNode;
export { Iteration, Folder };
