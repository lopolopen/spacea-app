import { configure, observable, action, runInAction } from 'mobx';
import update from 'immutability-helper';

import ProjectStore, { Project } from './ProjectStore';
import TodoStore from './TodoStore';
import WorkItemStore from './WorkItemStore';
import ProjectConfigStore from './ProjectConfigStore';
import RepoSettingStore from './RepoSettingStore';
import TeamConfigStore from './TeamConfigStore';
import MemberClient from '../services/api/MemberClient';
import TokenClient from '../services/api/TokenClient'
import AccountClient from '../services/api/AccountClient';
import MetaClient from '../services/api/MetaClient';
// import BuildInfoClient from '../services/api/BuildInfoClient';
import { spaceaClient } from '../services/axiosConfig';
import HistoryStore from './HistoryStore';
import AnalysisStore from './AnalysisStore';
import UiStateStore from './UiStateStore';
import ServiceStore from './ServiceStore';
import { Member } from './MemberStore';

configure({ enforceActions: 'observed' });

class AppStore {
  projectId;
  @observable me;
  //TODO: refactor: project应转移到projectStore
  @observable project;
  @observable todo;
  @observable config;
  @observable buildInfo;
  projectStore = new ProjectStore(this);
  workItemStore = new WorkItemStore(this);
  projectConfigStore = new ProjectConfigStore(this);
  teamConfigStore = new TeamConfigStore(this);
  repoSettingStore = new RepoSettingStore(this);
  todoStore = new TodoStore(this);
  historyStore = new HistoryStore(this);
  analysisStore = new AnalysisStore(this);
  uiStateStore = new UiStateStore(this);
  serviceStore = new ServiceStore(this);

  @observable members;
  @observable pageName;
  @observable subName;

  @observable error;
  @observable metas = { enums: {} };

  @action
  async signIn(signInModal) {
    let { member, tokens } = await AccountClient.signIn(signInModal);
    TokenClient.setTokens(tokens);
    spaceaClient.resetApiToken();
    runInAction(() => {
      this.me = new Member(member);
    });
    this.uiStateStore.loadMyUiState();
    await this.loadMetas();
  }

  @action
  async signInWithToken() {
    let token = TokenClient.getToken();
    if (!token) {
      this.me = null;
    } else {
      try {
        let member = await TokenClient.authToken();
        runInAction(() => {
          this.me = new Member(member);
        });
        this.uiStateStore.loadMyUiState();
        await this.loadMetas();
      } catch {
        runInAction(() => {
          this.me = null;
        });
      }
    }
  }

  @action
  signOut() {
    AccountClient.signOut();
    TokenClient.clearTokens();
    spaceaClient.resetApiToken();
    this.me = null;
  }

  @action
  async loadProject(id) {
    this.projectId = id;
    if (id) {
      let project = new Project({ id, appStore: this });
      await project.load();
      runInAction(() => {
        this.project = project;
      });
    } else {
      this.project = undefined;
    }
  };

  @action
  async loadMembers() {
    let members = await MemberClient.all();
    runInAction(() => {
      this.members = members;
    });
  }

  @action
  setPageName(name) {
    this.pageName = name;
  }

  @action
  setSubName(name) {
    this.subName = name;
  }

  @action
  async updateMember(member, avatar) {
    await this.me.client.update(member);
    runInAction(() => {
      this.me = update(this.me, {
        firstName: { $set: member.firstName },
        lastName: { $set: member.lastName },
        xing: { $set: member.xing },
        ming: { $set: member.ming },
      })
    });
    if (avatar && avatar.uid !== this.me.avatarUid) {
      await this.updateMemberAvatar(avatar);
    }
  }

  @action
  async updateMemberAvatar(avatar) {
    if (!avatar) return;
    let { uid, file } = avatar;
    let url;
    if (!uid) {
      await this.me.client.removeAvatar();
    } else {
      url = await this.me.client.uploadAvatar(file, uid);
    }
    runInAction(() => {
      this.me = update(this.me, {
        avartarUrl: { $set: url },
        avatarUid: { $set: uid }
      });
    });
  }

  @action
  async updateProject(project, avatar) {
    await this.project.client.update({
      name: project.name,
      desc: project.desc
    });
    runInAction(() => {
      this.project = update(this.project, {
        name: { $set: project.name },
        desc: { $set: project.desc }
      });
    });
    if (avatar && avatar.uid !== this.project.avatarUid) {
      await this.updateProjectAvatar(avatar);
    }
  }

  @action
  async updateProjectAvatar(avatar) {
    if (!avatar) return;
    let { uid, file } = avatar;
    let url;
    if (!uid) {
      await this.project.client.removeAvatar();
    } else {
      url = await this.project.client.uploadAvatar(file, uid);
    }
    runInAction(() => {
      this.project = update(this.project, {
        avartarUrl: { $set: url },
        avatarUid: { $set: uid }
      });
    });
  }

  @action
  async disableMember(id, disabled) {
    let memberClient = new MemberClient(id);
    await memberClient.disable(disabled)
    let index = this.members.findIndex(g => g.id === id);
    if (index >= 0) {
      runInAction(() => {
        this.members = update(this.members, {
          [index]: {
            disabled: { $set: disabled },
          }
        });
      });
    }
  }

  @action
  async loadConfig(keys) {
    let memberClient = new MemberClient(this.me.id);
    let config = await memberClient.getConfig(keys);
    runInAction(() => {
      this.config = config;
    });
  }

  @action
  async saveConfig(config) {
    let memberClient = new MemberClient(this.me.id);
    await memberClient.saveConfig(config);
    runInAction(() => {
      this.config = { ...this.config, ...config };
    });
  }

  @action
  setError(error) {
    if (this.error) return;
    this.error = error;
  }

  // @action
  // async loadBuildInfo() {
  //   let buildInfo = await BuildInfoClient.getAll();
  //   runInAction(() => {
  //     this.buildInfo = buildInfo;
  //   });
  // }

  @action
  async loadMetas() {
    let metas = await MetaClient.getMetas();
    runInAction(() => {
      this.metas = metas;
    });
  }
}

export default new AppStore();
