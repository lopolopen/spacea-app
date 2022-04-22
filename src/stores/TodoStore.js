import { observable, action, runInAction, computed } from 'mobx';
import TodoClient from '../services/api/TodoClient';

class TodoStore {
  appStore;
  @observable groupedWorkItems; //by project
  @observable mergeRequests;

  constructor(appStore) {
    this.appStore = appStore;
  }

  @computed get count() {
    if (!this.groupedWorkItems) return undefined;
    return this.groupedWorkItems.reduce((acc, x) => {
      return acc + x.workItems.length;
    }, 0);
  }

  @action
  async loadInProgressWorkItems(key) {
    let workItems = [];
    if (key === 'tome') {
      workItems = await TodoClient.getInProgressWorkItemsToMe();
    } else if (key === 'byme') {
      workItems = await TodoClient.getInProgressWorkItemsByMe();
    }
    workItems.sort((x, y) => {
      return new Date(y.changedDate) - new Date(x.changedDate);
    });
    var map = workItems.reduce((acc, x) => {
      let p = acc.get(x.project.id);
      if (!p) {
        p = {
          id: x.project.id,
          name: x.project.name,
          workItems: []
        };
        acc.set(x.project.id, p);
      }
      p.workItems.push(x);
      return acc;
    }, new Map());
    runInAction(() => {
      this.groupedWorkItems = [...map.values()];
    });
  }

  @action
  updateMergeRequest(mergeRequests) {
    this.mergeRequests = mergeRequests;
  }
}

export default TodoStore;
