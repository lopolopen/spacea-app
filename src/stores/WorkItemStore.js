import { observable, action, computed, runInAction } from 'mobx';
import moment from 'moment';
import { loading } from '../utility';
import ProjectClient from '../services/api/ProjectClient';
import WorkItemClient from '../services/api/WorkItemClient';
import AttachmentClient from '../services/api/AttachmentClient';
import AttachmentState from './AttachmentState';

class WorkItem {
  id = null;
  client;
  @observable rev;
  @observable title;
  type;
  @observable description;

  @observable acceptCriteria;
  @observable reproSteps;
  @observable state;
  @observable reason;
  @observable priority;
  @observable assigneeId = null;
  // @observable assignedTo;
  @observable tags = [];
  @observable attachments = [];
  @observable folderPath;
  @observable category;
  @observable introducerId;
  @observable introducer;
  @observable uploadFiles;
  @observable estimatedHours;
  @observable remainingHours;
  @observable completedHours;
  @observable environment = '';
  @observable severity;
  @observable parentId = null;
  @observable order;
  @observable creatorId;
  @observable creator;
  @observable projectId;
  @observable folderId;
  @observable iterationId;
  @observable changedDate;
  @observable loading = false;
  @observable hasNoChange = false;
  @observable hasError = false;

  detailed = false;
  appStore;
  static canMove = true;
  static mapper;

  constructor(options, appStore) {
    for (let key in options) {
      if (options[key] !== undefined) {
        this[key] = options[key];
      }
    }
    this.appStore = appStore;
  }

  @action setLoading(loading) {
    this.loading = loading;
  }

  @action
  async loadDetails() {
    if (!this.id || this.detailed) return;
    this.loading = true;
    let detail = await this.client.getDetails();
    runInAction(() => {
      this.description = detail.description;
      this.acceptCriteria = detail.acceptCriteria;
      this.reproSteps = detail.reproSteps;
      this.attachments = detail.attachments;
      this.loading = false;
      this.detailed = true;
    })
  }

  @computed get isProd() {
    if (this.type !== 'bug') return false;
    if (!this.environment) return false;
    return this.environment.toLowerCase() === 'production';
  }

  @computed get willBeShown() {
    if (!this.id) return true;
    if (this.state === 'removed') return false;

    let { project, uiStateStore, pageName } = this.appStore;
    let { selectedTeam, selectedIterationId } = project;
    let showClosedItem, showClosedChild, showInProgressItem;
    if (pageName === 'ProjectBacklogs') {
      showClosedItem = false;
      showClosedChild = uiStateStore.show_closed_child_backlog;
      showInProgressItem = uiStateStore.show_in_progress_item_backlog;
    } else if (pageName === 'ProjectIterations') {
      if (selectedIterationId !== this.iterationId) return false;
      showClosedItem = uiStateStore.show_closed_item_iteration;
      showClosedChild = uiStateStore.show_closed_child_iteration;
      showInProgressItem = true;
    }
    else {
      // throw new Error();
    }
    let pass = (showClosedItem && showClosedChild && showInProgressItem)

      // || (showClosedItem && showClosedChild && (...))
      || (showClosedChild && showInProgressItem && (!!this.parent.id || this.state !== 'closed'))
      || (showClosedItem && showInProgressItem && (!this.parent.id || this.state !== 'closed'))

      // || (!showClosedChild && !showInProgressItem && (...))
      || (showClosedChild && !showClosedItem && !showInProgressItem && (!!this.parent.id || this.state === 'new'))
      || (showInProgressItem && !showClosedItem && !showClosedChild && (this.state !== 'closed'))

      || (this.state === 'new');
    if (!pass) return false;

    if (selectedTeam.folders.every(f => f.id !== this.folderId)) return false;
    if (this.isOrphan) return false;
    return true;
  }

  @computed get isOrphan() {
    if (!this.parentId) return false;
    let parent = this.getParent();
    if (!parent) return false;
    return !parent.willBeShown;
  }

  @computed get client() {
    return this.id && new WorkItemClient(this.id);
  }

  @action
  setNoChange(noChange) {
    this.hasNoChange = noChange;
    return noChange;
  }

  @action
  setError(error) {
    this.hasError = error;
    return error;
  }

  @computed get hasChildren() {
    if (!this._children) return false;
    return this._children.length > 0;
  }

  @computed get children() {
    if (this.id && this.appStore.workItemStore.usingFilter) return null;
    return this._children;
  }

  @computed get longOrder() {
    let parent = this.getParent();
    if (!parent) return '';
    if (!this.id) return '';
    return `${parent.longOrder}.${this.order}`;
  }

  @computed get previousId() {
    let parent = this.getParent();
    if (!parent._children) return null;
    let index = parent._children.indexOf(this);
    if (index < 1) return null;
    return parent._children[index - 1].id;
  }

  @computed get nextId() {
    let parent = this.getParent();
    if (!parent._children) return null;
    let index = parent._children.indexOf(this);
    if (index < 0 || index === parent._children.length - 1) return null;
    return parent._children[index + 1].id;
  }

  // @computed get descHtml() {
  //   return BraftEditor.createEditorState(this.description).toHTML();
  // }

  // @computed get acceptCriteriaHtml() {
  //   return BraftEditor.createEditorState(this.acceptCriteria).toHTML();
  // }

  // @computed get reproStepsHtml() {
  //   return BraftEditor.createEditorState(this.reproSteps).toHTML();
  // }

  @action
  setOrder(order) {
    this.order = order;
  }

  getParent() {
    if (this.parentId === undefined) return;
    return WorkItem.mapper.get(this.parentId) || WorkItem.mapper.get(null);
  }

  @computed get parent() {
    if (this.parentId === undefined) return null;
    if (!WorkItem.mapper) return undefined;
    return WorkItem.mapper.get(this.parentId) || WorkItem.mapper.get(null);
  }

  removeFromParent() {
    //_children :: []
    const parent = this.getParent();
    let index = parent._children.indexOf(this);
    parent._children.splice(index, 1);
    if (parent._children.length === 0) {
      //[]会导致无子项的Story限制展开按钮[+]
      parent._children = null;
    }
  }

  setAboveSibling(sibling) {
    const parent = sibling.getParent();
    let index = parent._children.indexOf(sibling);
    parent._children.splice(index, 0, this);
    this.parentId = parent.id;
  }

  setAsChild(parent) {
    if (!parent._children) {
      parent._children = [this];
    } else {
      parent._children.splice(0, 0, this);
    }
    this.parentId = parent.id;
  }

  setBelowSibling(sibling) {
    const parent = sibling.getParent();
    let index = parent._children.findIndex(c => c === sibling);
    parent._children.splice(index + 1, 0, this);
    this.parentId = parent.id;
  }

  isAncestorOf(descendant) {
    let { id } = descendant;
    if (id === null) return false;
    if (descendant === this) return true;
    if (!this._children) return false;
    const parent = descendant.getParent();
    return this.isAncestorOf(parent);
  }

  static treelize(workItems) {
    WorkItem.mapper = new Map()
    WorkItem.mapper.set(null, new WorkItem({ id: null }));
    workItems.forEach(wi => {
      WorkItem.mapper.set(wi.id, wi);
    });
    for (let item of workItems) {
      item.parentId = item.parentId || null;
      let parent = WorkItem.mapper.get(item.parentId) || WorkItem.mapper.get(null);
      parent._children = parent._children || [];
      parent._children.push(item);
    }
    let root = WorkItem.mapper.get(null);
    return root;
  }

  static sort(node) {
    if (!node || !node._children) return;
    node._children.sort((x, y) => {
      if (x.order > y.order) return 1;
      else return -1;
    });
    node._children.forEach(n => WorkItem.sort(n));
  }

  async loadTags() {
    let tags = await this.client.getTags();
    this.tags = tags;
  }

}

class WorkItemStore {
  appStore;
  //工作事项打开的页面/迭代打开的模态框
  @observable workItem;
  @observable workItems = [];
  @observable workItemCopy;
  @observable workItemTree;
  @observable defaultEnvironmentOption = [];
  @observable isLoading;
  @observable usingFilter = false;

  constructor(appStore) {
    this.appStore = appStore;
  }

  @loading
  @action
  async loadWorkItem(projectId, workItemId) {
    let projectClient = new ProjectClient(projectId);
    let wiObj = await projectClient.getWorkItem(workItemId);
    runInAction(() => {
      this.workItem = new WorkItem(wiObj, this.appStore);
    });
  }

  @action
  setWorkItem(workItem) {
    this.workItem = workItem;
  }

  @action
  useFilter(use) {
    //TODO:
    this.usingFilter = use
    WorkItem.canMove = !use;
  }

  @action
  clearWorkItem() {
    this.workItem = null;
  }

  @action
  clearWorkItems() {
    this.workItems = null;
  }

  @loading
  @action
  async load(projectId, teamId, iterationId, showClosedItem, showClosedChild, showInProgressItem) {
    if (!projectId || !teamId) return;
    let projectClient = new ProjectClient(projectId);
    this.isLoading = true;
    let workItems = await projectClient.getWorkItems(teamId, iterationId, showClosedItem, showClosedChild, showInProgressItem) || [];
    runInAction(() => {
      this.isLoading = false;
      this.workItems = workItems.map(wi => new WorkItem(wi, this.appStore));
      let tree = WorkItem.treelize(this.workItems);
      WorkItem.sort(tree);
      this.workItemTree = tree;
    });
  }

  @action
  expandPath(key) {
    if (!key) return;
    let current = WorkItem.mapper.get(key);
    if (!current) return;
    let collector = [];
    while (current && current.id) {
      if (current.type === 'story') {
        collector.push(current.id)
      }
      current = current.getParent();
    }
    let allKeys = [...collector, ...this.expandedRowKeys];
    this.expandedRowKeys = [...new Set(allKeys)];
  }

  @action
  shrinkAll() {
    this.expandedRowKeys = [];
  }

  @action
  clear() {
    this.workItems = [];
    this.workItemTree = null;
    this.mapper = null;
  }

  @computed get storyIds() {
    return this.workItems
      .filter(item => item.type === 'story')
      .map(item => item.id);
  }

  async saveWorkItem(values) {
    let { me } = this.appStore;
    let workItem = this.workItem;
    let { description, acceptCriteria, reproSteps, attachments, ...rest } = values;
    let newWorkItem = {
      ...rest,
      description: description && description.toHTML(),
      reproSteps: reproSteps && reproSteps.toHTML(),
      acceptCriteria: acceptCriteria && acceptCriteria.toHTML(),
      tags: workItem.tags,
      parentId: workItem.parentId,
      type: workItem.type,
    };
    if (newWorkItem.environment === '') newWorkItem.environment = undefined;
    if (newWorkItem.description === '<p></p>') newWorkItem.description = undefined;
    if (newWorkItem.reproSteps === '<p></p>') newWorkItem.reproSteps = undefined;
    if (newWorkItem.acceptCriteria === '<p></p>') newWorkItem.acceptCriteria = undefined;
    //新建事项
    if (!workItem.id) {
      newWorkItem.creator = me;
      newWorkItem.creatorId = me.id;
      newWorkItem.changerId = me.id;
      await this.addWorkItem(newWorkItem);
    } else {
      newWorkItem.changerId = me.id;
      await this.updateWorkItem(workItem.id, newWorkItem);
    }
    //更新附件
    let id = this.workItem.id;
    let toAttach = attachments.filter(a => a.state === AttachmentState.toadd);
    let xs = toAttach.map(a => new AttachmentClient(a.id).attachTo(id));
    let toDetach = attachments.filter(a => a.state === AttachmentState.todel);
    let ys = toDetach.map(a => new AttachmentClient(a.id).detach());
    await Promise.all([...xs, ...ys]);
    toAttach.forEach(a => a.state = AttachmentState.added);
    toDetach.forEach(a => a.state = AttachmentState.deleted);
    runInAction(() => {
      workItem.attachments = attachments.filter(a => a.state === AttachmentState.added);
    });
    return id;
  }

  @action
  async addWorkItem(workItem) {
    let { parentId, folderId } = workItem;
    let parent = WorkItem.mapper.get(parentId);
    let { projectId, uiStateStore, pageName } = this.appStore;
    let projectClient = new ProjectClient(projectId);
    let location;
    if (pageName === 'ProjectBacklogs') {
      location = uiStateStore.insert_location_backlog;
    }
    else if (pageName === 'ProjectIterations') {
      location = uiStateStore.insert_location_iteration;
    }
    else {
      throw new Error();
    }
    let workItemObj = await projectClient.createWorkItem(folderId, workItem, location);
    let newWorkItem = new WorkItem(workItemObj, this.appStore);
    let workItemClient = new WorkItemClient(newWorkItem.id);
    let newTags = await workItemClient.createTags(workItem.tags);
    newWorkItem.tags = newTags;
    WorkItem.mapper.set(newWorkItem.id, newWorkItem);
    if (parent != null) {
      parent._children = parent._children || [];
      if (location === 'top') {
        parent._children.unshift(newWorkItem);
      } else if (location === 'bottom') {
        parent._children.push(newWorkItem);
      } else {
        throw new Error(location);
      }
    }
    runInAction(() => {
      this.workItem = newWorkItem;
      this.workItems.push(newWorkItem);
    });
    return newWorkItem.id;
  }

  @action
  async deleteWorkItem(workItem) {
    let { id } = workItem;
    await WorkItemClient.remove(id);
    WorkItem.mapper.delete(id)
    runInAction(() => {
      workItem.removeFromParent();
      this.workItems.forEach((item, index) => {
        if (item.id === id) {
          this.workItems.splice(index, 1);
        };
      });
    });
  }

  @action
  async updateWorkItem(id, workItem) {
    await WorkItemClient.update(id, {
      ...workItem,
      rev: this.workItem.rev
    });
    //TODO:
    let { me, project: { members } } = this.appStore;
    let assignedTo = members.find(m => m.id === workItem.assigneeId);
    runInAction(() => {
      this.workItem.title = workItem.title;
      this.workItem.rev += 1;
      this.workItem.assigneeId = workItem.assigneeId;
      this.workItem.assignedTo = assignedTo;
      this.workItem.state = workItem.state;
      this.workItem.reason = workItem.reason;
      this.workItem.priority = workItem.priority;
      this.workItem.folderId = workItem.folderId;
      this.workItem.iterationId = workItem.iterationId;
      this.workItem.category = workItem.category;
      this.workItem.introducerId = workItem.introducerId;
      this.workItem.uploadFiles = workItem.uploadFiles;
      this.workItem.estimatedHours = workItem.estimatedHours;
      this.workItem.remainingHours = workItem.remainingHours;
      this.workItem.completedHours = workItem.completedHours;
      this.workItem.environment = workItem.environment;
      this.workItem.severity = workItem.severity;
      this.workItem.tags = workItem.tags;
      this.workItem.description = workItem.description;
      this.workItem.reproSteps = workItem.reproSteps;
      this.workItem.acceptCriteria = workItem.acceptCriteria;
      this.workItem.reproSteps = workItem.reproSteps;
      this.workItem.changer = me;
      this.workItem.changedDate = moment().format();
    });
  }

  //mask: 为要更新的字段遮罩，如：state,reason
  @action
  async partialUpdateWorkItem(id, options, mask) {
    let keys = Object.keys(options);
    if (!mask) {
      mask = keys.join(',');
    } else {
      keys = mask.split(',').map(key => key.trim());
    }
    mask = mask || Object.keys(options).join();
    let workItem = this.workItems.find(wi => wi.id === id);
    await WorkItemClient.partialUpdate(id, {
      ...options,
      mask,
      rev: workItem.rev
    });
    runInAction(() => {
      keys.forEach(key => {
        workItem[key] = options[key];
      });
      workItem.rev += 1;
      workItem.changedDate = moment().format();
      workItem.changer = this.appStore.me;
    });
  }
}

export default WorkItemStore;
export { WorkItem };
