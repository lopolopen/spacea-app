import { observable, action, computed, runInAction } from 'mobx';
import update from 'immutability-helper';
import moment from 'moment';
import { loading } from '../utility';
import ProjectClient from '../services/api/ProjectClient';
import TeamClient from '../services/api/TeamClient';
import TreeNode, { Iteration, Folder } from './TreeNode';
import { Team } from './TeamStore';

class Project {
  id;
  @observable name;
  @observable description;
  @observable avatarUrl = null;
  @observable avatarUid = null;
  createdDate;
  @observable owner;
  @observable teams;
  @observable members = [];
  @observable folders;
  // @observable folderTree;
  @observable iterations;
  @observable defaultTeamId;
  @observable rootFolderId;
  @observable rootIterationId;
  @observable _selectedTeamId;
  @observable _selectedIterationId;
  @observable repos;

  appStore;

  constructor(options) {
    for (let key in options) {
      if (options[key] !== undefined) {
        this[key] = options[key];
      }
    }
  }

  @computed get avatar() {
    return {
      url: this.avatarUrl,
      uid: this.avatarUid
    };
  }

  @computed get client() {
    return this.id && new ProjectClient(this.id);
  }

  @computed get iterationMap() {
    return new Map((this.iterations || []).map(i => [i.id, i]));
  }

  @loading
  @action
  async load() {
    let project = await ProjectClient.single(this.id);
    const {
      name,
      description,
      avatarUrl,
      avatarUid,
      defaultTeamId,
      rootFolderId,
      rootIterationId,
      folders,
      iterations,
      teams,
      owner
    } = project;
    runInAction(() => {
      this.name = name;
      this.description = description;
      this.avatarUrl = avatarUrl;
      this.avatarUid = avatarUid;
      this.defaultTeamId = defaultTeamId;
      this.rootFolderId = rootFolderId;
      this.rootIterationId = rootIterationId;
      this.folders = folders.map(f => new Folder(f));
      // this.folderTree = TreeNode.treelize(this.folders);
      this.teams = teams.map(t => new Team({ ...t, project: this }));
      this.owner = owner;
      this.iterations = iterations.map(i => new Iteration(i));
      this.iterations.sort((x, y) => {
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
    });
  }

  @computed get defaultTeam() {
    return this.teams.find(t => t.id === this.defaultTeamId);
  }

  @computed get folderTree() {
    return TreeNode.treelize(this.folders);
  }

  @computed get iterationTree() {
    return TreeNode.treelize(this.iterations);
  }

  @computed get selectedTeamId() {
    return this._selectedTeamId || this.defaultTeamId;
  }

  @computed get selectedTeam() {
    if (!this._selectedTeamId) return this.defaultTeam;
    return this.teams.find(t => t.id === this._selectedTeamId);
  }

  @computed get selectedIterationId() {
    if (this._selectedIterationId) return this._selectedIterationId;
    let curIter = this.selectedTeam.currentIteration;
    return curIter && curIter.id;
  }

  @computed get selectedIteration() {
    if (!this._selectedIterationId) return this.selectedTeam.currentIteration;
    return this.selectedTeam.iterations.find(i => i.id === this._selectedIterationId);
  }

  @action
  selectTeam(teamId) {
    if (isNaN(teamId)) {
      this._selectedTeamId = undefined;
    } else {
      this._selectedTeamId = parseInt(teamId);
    }
  }

  @action
  selectIteration(iterationId) {
    if (isNaN(iterationId)) {
      this._selectedIterationId = undefined;
    } else {
      this._selectedIterationId = parseInt(iterationId);
    }
  }

  @action
  selectTeamAndIteration(teamId, iterationId) {
    this.selectTeam(teamId);
    this.selectIteration(iterationId);
  }

  //TODO: 重构到team store; 优化为并发ajax
  @action
  async loadTeamMembers(teamId) {
    for (let team of this.teams) {
      if (teamId && (team.id !== teamId)) continue;
      let index = this.teams.findIndex(t => t.id === team.id);
      let teamClient = new TeamClient(team.id);
      let members = await teamClient.getMembers();
      runInAction(() => {
        this.teams = update(this.teams, {
          [index]: {
            members: {
              $set: members
            }
          }
        });
      });
    }
  }

  @action
  async loadRepos() {
    if (this.repos) return;
    let linkedRepos = await this.client.getRepos();
    runInAction(() => {
      this.repos = linkedRepos;
    });
  }

  @action
  addTeams(teams) {
    this.teams = update(this.teams, {
      $push: teams
    });
  }

  @action
  async removeTeam(teamId) {
    await TeamClient.remove(teamId);
    let index = this.teams.findIndex(t => t.id === teamId);
    if (index >= 0) {
      runInAction(() => {
        this.teams = update(this.teams, { $splice: [[index, 1]] });
      });
    }
    if (this.selectedTeam.id === teamId) {
      this.selectTeam(this.defaultTeamId);
    }
  }

  @action
  async createTeams(teams) {
    let newTeams = await this.client.createTeams(teams);
    this.addTeams(newTeams);
    for (let t of newTeams) {
      await this.loadTeamMembers(t.id);
    }
    runInAction(() => {
      newTeams.forEach(t => {
        let folder = t.defaultFolder
        folder.projectId = this.id
        this.folders.push(folder)
      });
    })
  }

  @action
  async createTeam(team) {
    let newTeam = await this.client.createTeam(team);
    this.addTeams([newTeam]);
    await this.loadTeamMembers(newTeam.id);
    runInAction(() => {
      let folder = newTeam.defaultFolder
      folder.projectId = this.id
      this.folders.push(folder)
    })
  }

  @action
  async updateTeam(teamId, team) {
    let teamClient = new TeamClient(teamId);
    await teamClient.update(team);
    if (!team.groupId) {
      await this.loadTeamMembers(teamId);
    }
    let index = this.teams.findIndex(t => t.id === teamId);
    if (index >= 0) {
      runInAction(() => {
        this.teams = update(this.teams, {
          [index]: {
            name: { $set: team.name },
            description: { $set: team.description },
            acronym: { $set: team.acronym },
          }
        })
      });
    }
  }
}

class ProjectStore {
  appStore;
  @observable projects = [];
  // @observable selectedTeams = [];

  constructor(appStore) {
    this.appStore = appStore;
  }

  @loading
  @action
  async load() {
    let projects = await ProjectClient.all() || [];
    runInAction(() => {
      this.projects = projects.map(p => {
        let project = new Project(p);
        return project;
      });
    });
  }

  @action
  async create(project) {
    let { me } = this.appStore;
    project.ownerId = me.id;
    let newProjectObj = await ProjectClient.create(project);
    if (!newProjectObj) return;
    let newProject = new Project(newProjectObj);
    runInAction(() => {
      this.projects = update(this.projects, { $push: [newProject] });
    });
    return newProject;
  }

  @action
  remove(id) {
    let index = this.projects.findIndex(p => p.id === id);
    if (index >= 0) {
      this.projects = update(this.projects, { $splice: [[index, 1]] });
    }
  }

  @action
  update(id, project) {
    let index = this.projects.findIndex(p => p.id === id);
    if (index >= 0) {
      this.projects = update(this.projects, {
        [index]: {
          name: { $set: project.name },
          description: { $set: project.description }
        }
      });
    }
  }

  // @action
  // async deleteTeam(id) {
  //   let { projectId } = this.appStore;
  //   let projectClient = new ProjectClient(projectId);
  //   await TeamClient.remove(id)
  //   let getTeams = await projectClient.getTeams()
  //   runInAction(() => {
  //     this.selectedTeams = getTeams;
  //   });
  // }

  @action
  async updateDefaultTeamId(defaultTeamId) {
    let { projectId, project } = this.appStore;
    let projectClient = new ProjectClient(projectId);
    try {
      await projectClient.updateDefaultTeamId(defaultTeamId)
      runInAction(() => {
        project.defaultTeamId = defaultTeamId;
      });
    }
    catch (err) {

    }
  }
}

export default ProjectStore;
export { Project };
