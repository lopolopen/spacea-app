import { observable, action, computed, runInAction } from 'mobx';
import update from 'immutability-helper';
import _, { uniqueId } from 'lodash';
import entries from 'object.entries';
import TeamClient from '../services/api/TeamClient';
import TreeNode, { Iteration, Folder } from './TreeNode';

if (!Object.entries) {
  entries.shim();
}

class TeamConfigStore {
  appStore;
  @observable currentTeam;
  @observable currentIteration;
  @observable currentCapacities = undefined;

  constructor(appStore) {
    this.appStore = appStore;
  }

  @computed get teamCapacityPerDay() {
    return this.currentCapacities &&
      this.currentCapacities
        .flatMap(c => c.capacities)
        .map(c => c.hoursPerDay)
        .reduce((x, y) => x + y, 0);
  }

  @computed get currentTeamId() {
    return this.currentTeam && this.currentTeam.id;
  }

  @action
  selectTeam(teamId) {
    if (teamId === this.currentTeamId) return;
    let { teams } = this.appStore.project;
    this.currentTeam = teams.find(t => t.id === teamId);
  }

  @action
  async selectDefIterationOfCurrentTeam(iterationId) {
    let { iterations } = this.appStore.project;
    var client = new TeamClient(this.currentTeamId);
    await client.updateDefaultIteration(iterationId);
    runInAction(() => {
      this.currentTeam.defaultIteration = iterations.find(i => i.id === iterationId);
    });
  }

  @action
  async selectDefFolderOfCurrentTeam(folderId) {
    let { folders } = this.appStore.project;
    var client = new TeamClient(this.currentTeamId);
    await client.updateDefaultFolder(folderId);
    // let folder = folders.find(f => f.id === folderId);
    runInAction(() => {
      this.currentTeam.folderIds = update(
        this.currentTeam.folderIds || [], {
        $push: [folderId]
      });
      this.currentTeam.defaultFolder = folders.find(f => f.id === folderId);
    });
  }

  @action
  clearDefIterationOfCurrentTeam() {
    this.currentTeam = null
  }

  @action
  async selectFolder(folder) {
    if (!this.currentTeamId) return;
    var client = new TeamClient(this.currentTeamId);
    await client.selectFolder(folder.id);
    let { defaultFolder, folderIds } = this.currentTeam;
    runInAction(() => {
      if (!defaultFolder) {
        this.currentTeam.defaultFolder = folder;
      }
      this.currentTeam.folderIds = update(
        folderIds || [], {
        $push: [folder.id]
      });
    });
  }

  @action
  async selectIteration(iteration) {
    if (!this.currentTeamId) return;
    var client = new TeamClient(this.currentTeamId);
    await client.selectIteration(iteration.id);
    let { iterationIds } = this.currentTeam;
    runInAction(() => {
      this.currentTeam.iterationIds = update(
        iterationIds || [], {
        $push: [iteration.id]
      });
    });
    //select current
    this.appStore.project.selectIteration();
  }

  @action
  async deselectFolder(folder) {
    if (!this.currentTeamId) return;
    var client = new TeamClient(this.currentTeamId);
    await client.deselectFolder(folder.id);
    let { folderIds } = this.currentTeam;
    let index = (folderIds || []).findIndex(id => id === folder.id);
    if (index >= 0) {
      runInAction(() => {
        this.currentTeam.folderIds = update(
          folderIds || [], {
          $splice: [[index, 1]]
        });
      });
    }
  }

  @action
  async deselectIteration(iteration) {
    debugger
    if (!this.currentTeamId) return;
    var client = new TeamClient(this.currentTeamId);
    await client.deselectIteration(iteration.id);
    let { iterationIds } = this.currentTeam;
    let index = (iterationIds || []).findIndex(id => id === iteration.id);
    if (index >= 0) {
      runInAction(() => {
        this.currentTeam.iterationIds = update(
          iterationIds || [], {
          $splice: [[index, 1]]
        });
      });
      //select current
      this.appStore.project.selectIteration();
    }
  }

  @action
  async createFolderForCurrentTeam(folderObj) {
    if (!this.currentTeamId) return;
    let { project } = this.appStore;
    let newFolderObj = await project.client.createFolderForTeam(this.currentTeamId, folderObj);
    var newFolder = new Folder(newFolderObj);
    let { folderIds } = this.currentTeam;
    runInAction(() => {
      let { project: { folders } } = this.appStore;
      folders.push(newFolder);
      this.currentTeam.folderIds = update(
        folderIds || [], {
        $push: [newFolder.id]
      });
    });
  }

  @action
  async createIterationForCurrentTeam(iterationObj) {
    if (!this.currentTeamId) return;
    let { project } = this.appStore;
    let newIterationObj = await project.client.createIterationForTeam(this.currentTeamId, iterationObj);
    var newIteration = new Iteration(newIterationObj);
    let { iterfationIds } = this.currentTeam;
    runInAction(() => {
      let { project: { iterations } } = this.appStore;
      iterations.push(newIteration);
      this.currentTeam.iterationIds = update(
        iterfationIds || [], {
        $push: [newIteration.id]
      });
      this.currentTeam.cookedIterations = Iteration.cook(this.currentTeam.iterations);
    });
    project.selectIteration();
  }

  @action
  async updateFolder(folderId, folderObj, current) {
    let { projectConfigStore } = this.appStore;
    projectConfigStore.updateFolder(folderId, folderObj, current);
  }

  @action
  async updateIteration(iterationId, iterationObj, mask, current) {
    let { projectConfigStore } = this.appStore;
    projectConfigStore.updateIteration(iterationId, iterationObj, mask, current);
  }

  @action
  async loadCapacities(teamId, iterationId) {
    if (!iterationId) {
      let cookedIterations = Iteration.cook(this.currentTeam.iterations);
      let current = cookedIterations.find(i => i.tag === 'current');
      if (!current) return;
      iterationId = current.id;
    }
    var client = new TeamClient(teamId);
    let capacities = await client.getCapacities(iterationId);
    runInAction(() => {
      this.currentCapacities = capacities;
    });
  }

  @action
  setCurrentIteration(iteration) {
    this.currentIteration = iteration;
  }

  @action
  resetCapacities(currentCapacities) {
    this.currentCapacities = currentCapacities;
  }

  @action
  clearCapacities() {
    this.currentCapacities = undefined;
  }

  @action
  addCapacity(memberId) {
    let member = this.currentCapacities.find(c => c.memberId === memberId);
    member.capacities.push({
      ownerId: memberId,
      type: 'unassigned',
      hoursPerDay: 0,
      cachedKey: uniqueId()
    });
  }

  @action
  removeCapacity(memberId, capacity) {
    let member = this.currentCapacities.find(c => c.memberId === memberId);
    member.capacities = member.capacities.filter(c => c !== capacity);
    if (member.capacities.length === 0) {
      member.capacities.push({
        ownerId: memberId,
        type: 'unassigned',
        hoursPerDay: 0,
        cachedKey: uniqueId()
      });
    }
  }

  @action
  changeCapacityType(capacity, type) {
    capacity.type = type;
    capacity.cachedKey = uniqueId();
  }

  @action
  changeCapacityHours(capacity, hoursPerDay) {
    capacity.hoursPerDay = hoursPerDay;
    capacity.cachedKey = uniqueId();
  }

  @action
  removeMember(memberId) {
    this.currentCapacities = this.currentCapacities.filter(c => c.memberId !== memberId);
  }

  @action
  addMembers(memberIds) {
    let cachedMemberCapacities = memberIds.map(id => ({
      memberId: id,
      capacities: [{
        ownerId: id,
        type: 'unassigned',
        hoursPerDay: 0,
        cachedKey: uniqueId()
      }]
    }));
    this.currentCapacities = [
      ...this.currentCapacities,
      ...cachedMemberCapacities
    ];
  }

  @action
  async saveCapacities(teamId, iterationId) {
    for (let m of this.currentCapacities) {
      m.capacities = Object.entries(_.groupBy(m.capacities, 'type'))
        //x: ['unassigned', [c1, c2]]
        .map(x => ({
          owner: m.memberId,
          type: x[0],
          hoursPerDay: _.sum(x[1].map(c => c.hoursPerDay)),
          cachedKey: uniqueId()
        }));
    }
    let client = new TeamClient(teamId);
    await client.updateCapacities(iterationId, this.currentCapacities);
  }
}

export default TeamConfigStore;
